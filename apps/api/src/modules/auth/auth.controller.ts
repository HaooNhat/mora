import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import crypto from 'crypto';
import type { Request, Response } from 'express';

import { Public } from '@mora/api/common/decorators/public.decorator';
import { Serialize } from '@mora/api/common/decorators/serialize.decorator';
import { JwtAuthGuard } from '@mora/api/common/guards/jwt.guard';
import { OidcService } from '@mora/api/services/oidc/oidc.service';
import { RedisService } from '@mora/api/services/redis/redis.service';

import { AuthService } from './auth.service';

import appConfig from '@mora/api/configs/app.config';
import { ConfigType } from '@nestjs/config';
import { LoginWithPasswordDto } from './dto/request-dto/login.dto';
import { RegisterDto } from './dto/request-dto/register.dto';
import { AuthSuccessResponseDto } from './dto/response-dto/auth-success-response';
import { UserResponseDto } from './dto/response-dto/login-response';
import type {
  RequestWithCookies,
  RequestWithUser,
} from './interfaces/request.interface';
import { AuthCookieService } from './services/auth-cookie.service';

const OIDC_STATE_TTL = 600; // 10 minutes

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly oidcService: OidcService,
    private readonly authCookieService: AuthCookieService,
    private readonly redisService: RedisService,
    @Inject(appConfig.KEY)
    private readonly appConf: ConfigType<typeof appConfig>,
  ) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Serialize(AuthSuccessResponseDto)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({
    status: 201,
    description: 'Verification email sent',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async register(@Body() registerDto: RegisterDto) {
    await this.authService.register(registerDto);
    return {
      success: true,
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('verify-email')
  @Serialize(AuthSuccessResponseDto)
  @ApiOperation({ summary: 'Verify email address via token sent by email' })
  @ApiQuery({ name: 'token', description: 'Email verification token' })
  @ApiResponse({
    status: 200,
    description: 'Email verified',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      success: true,
      message: 'Email verified successfully. You can now log in.',
    };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @Serialize(AuthSuccessResponseDto)
  @ApiOperation({
    summary: 'Login with email and password — sets auth cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged in, auth cookies set',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or unverified email',
  })
  async login(
    @Body() loginWithPasswordDto: LoginWithPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens =
      await this.authService.loginWithPassword(loginWithPasswordDto);
    this.authCookieService.setAuthCookies(res, tokens);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @Serialize(UserResponseDto)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProfile(
    @Req() req: RequestWithUser,
  ): Promise<UserResponseDto | null> {
    const user = await this.authService.getUserProfile(req.user.id);
    return user;
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('refresh')
  @Serialize(AuthSuccessResponseDto)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Refresh access token using the refreshToken cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'New auth cookies set',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid refresh token' })
  async refreshTokens(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token!');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    this.authCookieService.setAuthCookies(res, tokens);

    return { success: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google/login')
  @ApiOperation({
    summary: 'Initiate Google OAuth login — redirects to Google',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google authorization page',
  })
  async googleLogin(@Res() res: Response) {
    const state = crypto.randomUUID();
    const { url, code_verifier, nonce } =
      await this.oidcService.getAuthUrl(state);

    await this.redisService.setObject(
      `oidc:state:${state}`,
      { code_verifier, nonce },
      OIDC_STATE_TTL,
    );

    res.redirect(url.toString());
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Get('google/callback')
  @ApiOperation({
    summary: 'Google OAuth callback — handled automatically by Google',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with auth cookies set',
  })
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.appConf.frontendUrl;
    const backendUrl = this.appConf.backendUrl;

    const redirectUrl = `${frontendUrl}/auth/callback`;

    try {
      const currentUrl = new URL(req.originalUrl, backendUrl);

      const queryState = req.query.state;
      const stateParam = Array.isArray(queryState) ? queryState[0] : queryState;

      if (typeof stateParam !== 'string') {
        throw new UnauthorizedException('Invalid state');
      }

      const oidcData = await this.redisService.getObject<{
        code_verifier: string;
        nonce: string;
      }>(`oidc:state:${stateParam}`);

      if (!oidcData) {
        throw new UnauthorizedException('OAuth state expired or invalid');
      }

      // Consume state — single use
      await this.redisService.del(`oidc:state:${stateParam}`);

      const claims = await this.oidcService.callback(
        currentUrl,
        oidcData.code_verifier,
        stateParam,
        oidcData.nonce,
      );

      if (!claims) {
        throw new UnauthorizedException('Missing ID token claims');
      }

      const { sub, email, email_verified, given_name, family_name, picture } =
        claims;

      const { accessToken, refreshToken } =
        await this.authService.loginWithGoogle({
          googleId: sub,
          email: email as string,
          emailVerified: email_verified as boolean,
          firstName: given_name as string,
          lastName: family_name as string,
          picture: picture as string,
        });

      this.authCookieService.setAuthCookies(res, { accessToken, refreshToken });
      res.redirect(redirectUrl);
    } catch (error: unknown) {
      if (!(error instanceof UnauthorizedException)) {
        this.logger.error('Google OAuth callback error', error);
      }

      const safeMessage =
        error instanceof UnauthorizedException
          ? error.message
          : 'Authentication failed';

      res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(safeMessage)}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @Serialize(AuthSuccessResponseDto)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Logout — revokes refresh token and clears cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out',
    type: AuthSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing refresh token' })
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token not found!');
    }

    const accessToken = req.cookies?.accessToken;
    await this.authService.logout(refreshToken, accessToken);

    this.authCookieService.clearAuthCookies(res);

    return { success: true, message: 'Logged out successfully!' };
  }
}

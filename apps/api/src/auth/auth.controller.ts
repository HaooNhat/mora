import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { User } from '@prisma/client';
import type { Request, Response } from 'express';
import { OidcService } from 'src/oidc/oidc.service';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginWithPasswordDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import type { AuthSession } from './interfaces/auth-session.interface';
import type {
  RequestWithCookies,
  RequestWithUser,
} from './interfaces/request.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oidcService: OidcService,
  ) {}

  @Post('login')
  async login(@Body() loginWithPasswordDto: LoginWithPasswordDto) {
    return this.authService.loginWithPassword(loginWithPasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserProfile(
    @Req()
    req: RequestWithUser,
  ): Promise<User | null> {
    if (!req.user.email) {
      throw new UnauthorizedException();
    }

    const user = await this.authService.getUserProfile(req.user.email);

    return user;
  }

  @Public()
  @Post('refresh')
  async refreshTokens(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token!');
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    this.authService.setAuthCookies(res, tokens);

    return { success: true };
  }

  @Public()
  @Get('google/login')
  async googleLogin(@Session() session: AuthSession, @Res() res: Response) {
    const state = crypto.randomUUID();

    session.state = state;

    const { url, code_verifier, nonce } =
      await this.oidcService.getAuthUrl(state);

    session.code_verifier = code_verifier;
    session.nonce = nonce;

    res.redirect(url.toString());
  }

  @Public()
  @Get('google/callback')
  async googleCallback(
    @Req() req: Request,
    @Session() session: AuthSession,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback`;
    const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

    try {
      const currentUrl = new URL(req.originalUrl, backendUrl);

      if (req.query.state !== session.state) {
        throw new UnauthorizedException('Invalid state');
      }

      if (!session.code_verifier || !session.state || !session.nonce) {
        throw new UnauthorizedException('Invalid session');
      }

      const claims = await this.oidcService.callback(
        currentUrl,
        session.code_verifier,
        session.state,
        session.nonce,
      );

      if (!claims) {
        throw new UnauthorizedException('Missing ID token claims');
      }

      const { sub, email, given_name, family_name, picture } = claims;

      const { accessToken, refreshToken } =
        await this.authService.loginWithGoogle({
          googleId: sub,
          email: email as string,
          firstName: given_name as string,
          lastName: family_name as string,
          picture: picture as string,
        });

      this.authService.setAuthCookies(res, {
        accessToken,
        refreshToken,
      });

      delete session.code_verifier;
      delete session.state;
      delete session.nonce;

      res.redirect(redirectUrl);
    } catch (error: unknown) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const safeMessage =
        error instanceof UnauthorizedException
          ? 'Unauthorized'
          : 'Authentication failed';

      res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(safeMessage)}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh Token not found!');
    }

    await this.authService.logout(refreshToken);

    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');

    return { success: true, message: 'Logged out successfully!' };
  }
}

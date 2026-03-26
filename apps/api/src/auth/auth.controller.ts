import {
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
import type { SessionData } from 'express-session';
import { OidcService } from 'src/oidc/oidc.service';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { UserProfile } from './types/userProfile';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oidcService: OidcService,
  ) {}

  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // login() {
  //   throw new NotImplementedException('This method is not implemented');
  // }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserProfile(
    @Req()
    req: Request & UserProfile,
  ): Promise<User | null> {
    const user = await this.authService.getUserProfile(req.user.email);

    return user;
  }

  @Public()
  @Post('refresh')
  async refreshTokens(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken as string;
    try {
      if (!refreshToken) {
        throw new UnauthorizedException('Missing refresh token!');
      }

      const tokens = await this.authService.refreshTokens(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
    } catch (error: unknown) {
      console.error('Refresh Route Error: ', error);
      throw new Error('Error refreshing token');
    }
  }

  @Public()
  @Get('google/login')
  async googleLogin(@Session() session: SessionData, @Res() res: Response) {
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
    @Session() session: SessionData,
    @Res() res: Response,
  ) {
    try {
      const currentUrl = new URL(
        req.originalUrl,
        process.env.BACKEND_URL ?? 'http://localhost:3001',
      );

      if (req.query.state !== session.state) {
        throw new UnauthorizedException('Invalid state');
      }

      if (!session.state) {
        throw new Error('state not found');
      }

      if (!session.code_verifier) {
        throw new Error('code vierifier not found');
      }

      if (!session.nonce) {
        throw new Error('nonce not found');
      }

      const claims = await this.oidcService.callback(
        currentUrl,
        session.code_verifier,
        session.state,
        session.nonce,
      );
      console.log('Claims', claims);

      if (!claims) {
        throw new UnauthorizedException('Missing ID token claims');
      }

      const { sub, email, given_name, family_name, picture } = claims;

      console.log('sub', sub);
      console.log('email', email);
      console.log('firstName', given_name);
      console.log('lastName', family_name);
      console.log('picture', picture);

      const { accessToken, refreshToken } =
        await this.authService.loginWithGoogle({
          googleId: sub,
          email: email as string,
          firstName: given_name as string,
          lastName: family_name as string,
          picture: picture as string,
        });

      console.log('asdfadsf', accessToken, refreshToken);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback`;

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      delete session.code_verifier;
      delete session.state;
      delete session.nonce;

      res.redirect(redirectUrl);
    } catch (error: unknown) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      let errorMessage = 'Internal server error';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.redirect(
        `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken as string;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      res
        .status(200)
        .json({ success: true, message: 'Logged out successfully' });
    } catch (error: unknown) {
      res.status(500).json({ success: false, message: 'Logout failed' });
      console.error('Error: ', error);
    }
  }
}

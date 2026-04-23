import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { Tokens } from '../interfaces/jwt.types';

const REFRESH_COOKIE_NAME = 'refreshToken';
const ACCESS_COOKIE_NAME = 'accessToken';

@Injectable()
export class AuthCookieService {
  private readonly isProd = process.env.NODE_ENV === 'production';

  private get baseCookieOptions() {
    return {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  setAuthCookies(res: Response, tokens: Tokens) {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      ...this.baseCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, {
      ...this.baseCookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  clearAuthCookies(res: Response) {
    const clearOptions = {
      ...this.baseCookieOptions,
      maxAge: 0,
      expires: new Date(0),
    };

    res.clearCookie(REFRESH_COOKIE_NAME, clearOptions);
    res.clearCookie(ACCESS_COOKIE_NAME, clearOptions);
  }
}

import { Request } from 'express';
import { JwtExtracted } from './jwt.types';

/**
 * Extends Express Request to include cookies.
 *
 * Used when accessing the refresh token stored in cookies,
 * typically in authentication / token refresh flows.
 */
export interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
    accessToken?: string;
  };
}

/**
 * Extends Express Request to include user information
 * extracted from a verified JWT.
 *
 * This is populated by a JWT Guard after token validation.
 */
export interface RequestWithUser extends Request {
  /**
   * User payload extracted from JWT after successful verification.
   */
  user: JwtExtracted;
}

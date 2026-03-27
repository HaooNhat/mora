import { Request } from 'express';
import { JwtExtraced } from './jwt.types';

export interface RequestWithCookies extends Request {
  cookies: {
    refreshToken?: string;
  };
}

export interface RequestWithUser extends Request {
  user: JwtExtraced;
}

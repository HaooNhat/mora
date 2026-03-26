import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Payload } from '../types/jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies.accessToken as string;
        },
      ]),
      secretOrKey: process.env.JWT_SECRET!,
    });
  }

  validate(payload: Payload) {
    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}

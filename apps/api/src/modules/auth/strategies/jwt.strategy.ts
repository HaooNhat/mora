import jwtConfig from '@mora/api/configs/jwt.config';
import {
  JwtExtracted,
  Payload,
} from '@mora/api/modules/auth/interfaces/jwt.types';
import { RedisService } from '@mora/api/services/redis/redis.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly redisService: RedisService,
    @Inject(jwtConfig.KEY)
    private readonly JwtConf: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return (req.cookies?.accessToken ?? null) as string;
        },
      ]),
      secretOrKey: JwtConf.jwtSecret,
      issuer: JwtConf.jwtIssuer,
      audience: JwtConf.jwtAudience,
      algorithms: [JwtConf.jwtAlgorithm],
    });
  }

  async validate(payload: Payload): Promise<JwtExtracted> {
    if (!payload.jti) {
      throw new UnauthorizedException('Invalid token structure.');
    }

    const denied = await this.redisService.exists(`jwt:deny:${payload.jti}`);
    if (denied) {
      throw new UnauthorizedException('Token has been revoked.');
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}

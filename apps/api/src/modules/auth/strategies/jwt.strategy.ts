import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from 'src/services/redis/redis.service';
import jwtConfig from '../configs/jwt.config';
import { JwtExtracted, Payload } from '../interfaces/jwt.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly redisService: RedisService,
    @Inject(jwtConfig.KEY)
    private readonly JwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return (req.cookies?.accessToken ?? null) as string;
        },
      ]),
      secretOrKey: JwtConfiguration.JwtSecret,
      issuer: JwtConfiguration.JwtIssuer,
      audience: JwtConfiguration.JwtAudience,
      algorithms: [JwtConfiguration.JwtAlgorithm],
    });
  }

  async validate(payload: Payload): Promise<JwtExtracted> {
    if (payload.jti) {
      const denied = await this.redisService.exists(`jwt:deny:${payload.jti}`);
      if (denied) {
        throw new UnauthorizedException('Token has been revoked.');
      }
    }

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}

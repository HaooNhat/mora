import jwtConfig from '@mora/api/configs/jwt.config';
import { RedisService } from '@mora/api/services/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import type { Payload, Tokens } from '../interfaces/jwt.types';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  signTokens(payload: Omit<Payload, 'jti'>): Tokens {
    const accessToken = this.jwtService.sign(
      { ...payload, jti: crypto.randomUUID() },
      {
        expiresIn: '15m',
        secret: this.jwtConf.jwtSecret,
        issuer: this.jwtConf.jwtIssuer,
        audience: this.jwtConf.jwtAudience,
      },
    );

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: crypto.randomUUID() },
      {
        expiresIn: '7d',
        secret: this.jwtConf.jwtRefreshSecret,
        issuer: this.jwtConf.jwtIssuer,
        audience: this.jwtConf.jwtAudience,
      },
    );

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(rawRefreshToken: string): Payload {
    return this.jwtService.verify(rawRefreshToken, {
      secret: this.jwtConf.jwtRefreshSecret,
      issuer: this.jwtConf.jwtIssuer,
      audience: this.jwtConf.jwtAudience,
      algorithms: [this.jwtConf.jwtAlgorithm],
    });
  }

  async denyAccessToken(rawAccessToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<Payload>(rawAccessToken, {
        secret: this.jwtConf.jwtSecret,
        issuer: this.jwtConf.jwtIssuer,
        audience: this.jwtConf.jwtAudience,
        algorithms: [this.jwtConf.jwtAlgorithm],
      });
      if (payload?.jti && payload.exp) {
        const remainingTtl = payload.exp - Math.floor(Date.now() / 1000);
        if (remainingTtl > 0) {
          await this.redisService.set(
            `jwt:deny:${payload.jti}`,
            '1',
            remainingTtl,
          );
        }
      }
    } catch {
      // expired or invalid — nothing to deny
    }
  }
}

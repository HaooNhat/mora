import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import crypto from 'crypto';
import { RedisService } from 'src/services/redis/redis.service';
import jwtConfig from '../configs/jwt.config';
import type { Payload, Tokens } from '../interfaces/jwt.types';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  signTokens(payload: Omit<Payload, 'jti'>): Tokens {
    const jti = crypto.randomUUID();
    const fullPayload: Payload = { ...payload, jti };

    const accessToken = this.jwtService.sign(fullPayload, {
      expiresIn: '15m',
      secret: this.jwtConfiguration.JwtSecret,
      issuer: this.jwtConfiguration.JwtIssuer,
      audience: this.jwtConfiguration.JwtAudience,
    });

    const refreshToken = this.jwtService.sign(fullPayload, {
      expiresIn: '7d',
      secret: this.jwtConfiguration.JwtRefreshSecret,
      issuer: this.jwtConfiguration.JwtIssuer,
      audience: this.jwtConfiguration.JwtAudience,
    });

    return { accessToken, refreshToken };
  }

  verifyRefreshToken(rawRefreshToken: string): Payload {
    return this.jwtService.verify(rawRefreshToken, {
      secret: this.jwtConfiguration.JwtRefreshSecret,
      issuer: this.jwtConfiguration.JwtIssuer,
      audience: this.jwtConfiguration.JwtAudience,
      algorithms: [this.jwtConfiguration.JwtAlgorithm],
    });
  }

  async denyAccessToken(rawAccessToken: string): Promise<void> {
    try {
      const payload = this.jwtService.decode<Payload>(rawAccessToken);
      if (payload?.jti) {
        await this.redisService.set(
          `jwt:deny:${payload.jti}`,
          '1',
          ACCESS_TOKEN_TTL_SECONDS,
        );
      }
    } catch {
      // malformed token — nothing to deny
    }
  }
}

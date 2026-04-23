import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import { UserRepository } from 'src/services/user/user.repository';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { JwtTokenService } from './jwt-token.service';

@Injectable()
export class RefreshTokenRotationService {
  private readonly logger = new Logger(RefreshTokenRotationService.name);

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async persistRefreshToken(args: {
    userId: string;
    rawRefreshToken: string;
    stableDeviceId?: string;
  }): Promise<void> {
    await this.refreshTokenRepository.create({
      userId: args.userId,
      hashedToken: this.hashToken(args.rawRefreshToken),
      device: args.stableDeviceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  async rotateRefreshToken(rawRefreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = this.jwtTokenService.verifyRefreshToken(rawRefreshToken);
    const userId = payload.sub;
    const hashedIncomingToken = this.hashToken(rawRefreshToken);

    const { count } = await this.refreshTokenRepository.revokeOne(
      userId,
      hashedIncomingToken,
    );

    if (count === 0) {
      const revokedRecord = await this.refreshTokenRepository.findRevoked(
        userId,
        hashedIncomingToken,
      );

      if (revokedRecord) {
        await this.refreshTokenRepository.revokeAll(userId);
        this.logger.warn(
          `Refresh token reuse detected for user ${userId} — all sessions revoked`,
        );
        throw new UnauthorizedException(
          'Session compromised. Please log in again.',
        );
      }

      throw new UnauthorizedException('Refresh token not found');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const tokens = this.jwtTokenService.signTokens({
      sub: user.id,
      email: user.email,
    });

    await this.persistRefreshToken({
      userId: user.id,
      rawRefreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const payload = this.jwtTokenService.verifyRefreshToken(rawRefreshToken);
    await this.refreshTokenRepository.revokeByHash(
      payload.sub,
      this.hashToken(rawRefreshToken),
    );
  }

  async revokeAllDevices(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAll(userId);
  }
}

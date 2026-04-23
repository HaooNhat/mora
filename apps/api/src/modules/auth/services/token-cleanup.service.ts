import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanExpiredTokens() {
    const result = await this.refreshTokenRepository.deleteExpired();
    this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
  }
}

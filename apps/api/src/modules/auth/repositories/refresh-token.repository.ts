import { PrismaService } from '@mora/api/services/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    hashedToken: string;
    device?: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({ data });
  }

  /**
   * Atomically revokes the token if active, or detects reuse if it was already revoked.
   * Combines both checks in a single transaction to eliminate the race window that
   * exists when they run as separate queries.
   */
  async revokeAndDetectReuse(
    userId: string,
    hashedToken: string,
  ): Promise<{ revoked: boolean; isReuse: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.refreshToken.updateMany({
        where: {
          userId,
          hashedToken,
          revoked: false,
          expiresAt: { gt: new Date() },
        },
        data: { revoked: true },
      });

      if (result.count > 0) {
        return { revoked: true, isReuse: false };
      }

      const revokedRecord = await tx.refreshToken.findFirst({
        where: { userId, hashedToken, revoked: true },
      });

      return { revoked: false, isReuse: !!revokedRecord };
    });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async revokeByHash(userId: string, hashedToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, hashedToken, revoked: false },
      data: { revoked: true },
    });
  }

  async deleteExpired(): Promise<{ count: number }> {
    return this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

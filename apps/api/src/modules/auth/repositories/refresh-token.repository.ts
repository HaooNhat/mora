import { Injectable } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from 'src/services/prisma/prisma.service';

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

  async revokeOne(
    userId: string,
    hashedToken: string,
  ): Promise<{ count: number }> {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        hashedToken,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      data: { revoked: true },
    });
  }

  async findRevoked(
    userId: string,
    hashedToken: string,
  ): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: { userId, hashedToken, revoked: true },
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

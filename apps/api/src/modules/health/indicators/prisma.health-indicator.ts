import { PrismaService } from '@mora/api/services/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unreachable';
      throw new HealthCheckError(
        'Prisma health check failed',
        this.getStatus(key, false, { message }),
      );
    }
  }
}

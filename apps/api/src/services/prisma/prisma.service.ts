import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const isAccelerate =
      process.env.DATABASE_URL?.startsWith('prisma://') ||
      process.env.DATABASE_URL?.startsWith('prisma+postgres://');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({
      ...(isAccelerate
        ? {
            accelerateUrl: process.env.DATABASE_URL,
          }
        : {
            adapter,
          }),
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      Logger.error(error, 'PrismaService');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

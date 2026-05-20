import { databasePrismaConfig } from '@mora/env';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(
    @Inject(databasePrismaConfig.KEY)
    private readonly dbPrismaConf: ConfigType<typeof databasePrismaConfig>,
  ) {
    const isAccelerate =
      dbPrismaConf.db_url.startsWith('prisma://') ||
      dbPrismaConf.db_url.startsWith('prisma+postgres://');

    const pool = new Pool({
      connectionString: dbPrismaConf.db_url,
    });

    const adapter = new PrismaPg(pool);

    super({
      ...(isAccelerate
        ? {
            accelerateUrl: dbPrismaConf.db_url,
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

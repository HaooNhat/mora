import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './configs/app.config';
import databasePrismaConfig from './configs/database-prisma.config';
import jwtConfig from './configs/jwt.config';
import mailConfig from './configs/mail.config';
import oidcConfig from './configs/oidc.config';
import redisConfig from './configs/redis.config';
import userConfig from './configs/user.config';
import { validate } from './configs/validation';
import { AuthModule } from './modules/auth/auth.module';
import { RequisitionsModule } from './modules/requisitions/requisitions.module';
import { PrismaModule } from './services/prisma/prisma.module';
import { RedisModule } from './services/redis/redis.module';
import { RedisService } from './services/redis/redis.service';
import { UserModule } from './services/user/user.module';

@Module({
  imports: [
    // Global configurations
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        jwtConfig,
        oidcConfig,
        userConfig,
        mailConfig,
        redisConfig,
        databasePrismaConfig,
      ],
      validate,
      cache: true,
    }),

    // Redis (global — exposes RedisService to all modules)
    RedisModule,

    // Rate limiting — Redis-backed for distributed deployments
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [{ ttl: 60000, limit: 60 }],
        storage: new ThrottlerStorageRedisService(redis.client),
      }),
    }),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature modules
    UserModule,
    AuthModule,
    RequisitionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

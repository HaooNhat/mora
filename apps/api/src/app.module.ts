import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';
import { databasePrismaConfig, mailConfig, sqsConfig } from '@mora/env';
import appConfig from './configs/app.config';
import jwtConfig from './configs/jwt.config';
import oidcConfig from './configs/oidc.config';
import redisConfig from './configs/redis.config';
import userConfig from './configs/user.config';
import { validate } from './configs/validation';
import { AuthModule } from './modules/auth/auth.module';
import { SqsModule } from './services/sqs/sqs.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
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
        sqsConfig,
        databasePrismaConfig,
      ],
      validate,
      cache: true,
    }),

    RedisModule,

    // TODO: temporary redis store for throttler, if redis is down this would be a problem,
    // consider using @nestjs/cache-manager instead
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [{ ttl: 60000, limit: 60 }],
        storage: new ThrottlerStorageRedisService(redis.client),
      }),
    }),

    // SQS (global — available in all modules)
    SqsModule,

    // Database
    PrismaModule,

    // Feature modules
    HealthModule,
    MetricsModule,
    UserModule,
    AuthModule,
    RequisitionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .exclude('health', 'metrics')
      .forRoutes('*');
  }
}

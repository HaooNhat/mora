import redisConfig from '@mora/api/configs/redis.config';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { REDIS_CLIENT, RedisService } from './redis.service';

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: async (redisConf: ConfigType<typeof redisConfig>) => {
        // Normalize the URL: add redis:// scheme if it's a bare host:port
        const rawUrl = redisConf.url ?? 'localhost:6379';
        const url = /^rediss?:\/\//.test(rawUrl) ? rawUrl : `redis://${rawUrl}`;

        const options: RedisOptions = {
          lazyConnect: true,
          enableOfflineQueue: false,
        };
        if (redisConf.password) options.password = redisConf.password;
        if (redisConf.username) options.username = redisConf.username;
        if (redisConf.tls) options.tls = {};

        const client = new Redis(url, options);

        let connectStart = Date.now();

        client.on('connect', () => {
          connectStart = Date.now();
          logger.log('Redis connecting', {
            host: url.replace(/:\/\/.*@/, '://***@'),
          });
        });
        client.on('ready', () =>
          logger.log('Redis ready', { durationMs: Date.now() - connectStart }),
        );
        client.on('reconnecting', (delay: number) =>
          logger.warn('Redis reconnecting', { delayMs: delay }),
        );
        client.on('error', (err: Error) =>
          logger.error('Redis connection error', {
            message: err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
          }),
        );
        client.on('close', () => logger.log('Redis connection closed'));

        await client.connect();
        await client.ping();

        return client;
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

import redisConfig from '@mora/api/configs/redis.config';
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT, RedisService } from './redis.service';

const logger = new Logger('RedisModule');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [redisConfig.KEY],
      useFactory: async (redisConf: ConfigType<typeof redisConfig>) => {
        const url = redisConf.url;

        const client = new Redis(url, {
          lazyConnect: true,
          enableOfflineQueue: false,
        });

        client.on('connect', () => logger.log('Redis connecting...'));
        client.on('ready', () => logger.log('Redis ready'));
        client.on('error', (err) => logger.error('Redis error', err));
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

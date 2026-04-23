import { registerAs } from '@nestjs/config';

export default registerAs('RedisConfig', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
}));

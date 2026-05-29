import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL!,
  // username: process.env.REDIS_USERNAME,
  // password: process.env.REDIS_PASSWORD,
  // host: process.env.REDIS_SOCKET_HOST,
  // port: process.env.REDIS_SOCKET_PORT,
  // tls: process.env.REDIS_TLS === 'true',
}));

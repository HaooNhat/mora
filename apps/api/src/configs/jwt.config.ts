import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtIssuer: process.env.JWT_ISSUER!,
  jwtAudience: process.env.JWT_AUDIENCE!,
  jwtAlgorithm: process.env.JWT_ALGORITHM! as 'HS256',
}));

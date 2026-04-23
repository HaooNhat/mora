import { registerAs } from '@nestjs/config';

export default registerAs('JwtConfig', () => ({
  JwtSecret: process.env.JWT_SECRET!,
  JwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  JwtIssuer: process.env.JWT_ISSUER!,
  JwtAudience: process.env.JWT_AUDIENCE!,
  JwtAlgorithm: process.env.JWT_ALGORITHM! as 'HS256',
}));

import { registerAs } from '@nestjs/config';

export default registerAs('JwtConfig', () => ({
  JwtSecret: process.env.JWT_SECRET!,
  JwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
}));

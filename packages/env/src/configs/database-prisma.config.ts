import { registerAs } from '@nestjs/config';

export default registerAs('prisma', () => ({
  db_url: process.env.DATABASE_URL!,
}));

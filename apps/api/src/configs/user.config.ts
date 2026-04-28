import { registerAs } from '@nestjs/config';

export default registerAs('user', () => ({
  saltOrRounds: Number(process.env.SALT_OR_ROUNDS),
}));

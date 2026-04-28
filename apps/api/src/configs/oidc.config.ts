import { registerAs } from '@nestjs/config';

export default registerAs('oidc', () => ({
  googleClientID: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_SECRET!,
  googleCallbackURL: process.env.GOOGLE_CALLBACK_URL!,
}));

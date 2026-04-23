import { registerAs } from '@nestjs/config';

export default registerAs('oidc', () => ({
  Google_ClientID: process.env.GOOGLE_CLIENT_ID!,
  Google_ClientSecret: process.env.GOOGLE_SECRET!,
  Google_CallbackURL: process.env.GOOGLE_CALLBACK_URL!,
}));

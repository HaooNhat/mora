import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  apiKey: process.env.RESEND_API_KEY as string,
  fromEmail: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
  appName: process.env.APP_NAME ?? 'Mora',
}));

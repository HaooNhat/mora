import { registerAs } from '@nestjs/config';

export default registerAs('mail', () => ({
  apiKey: process.env.RESEND_API_KEY!,
  fromEmail: process.env.RESEND_FROM_EMAIL!,
  devToEmail: process.env.RESEND_DEV_TO_EMAIL,
  appName: process.env.APP_NAME!,
}));

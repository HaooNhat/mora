import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: process.env.PORT!,
  nodeEnv: process.env.NODE_ENV!,
  frontendUrl: process.env.FRONTEND_URL!,
  backendUrl: process.env.BACKEND_URL!,
}));

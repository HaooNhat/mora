import Joi from 'joi';

export const validationSchema = Joi.object({
  // APP check
  PORT: Joi.number().port().default(3001),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  BACKEND_URL: Joi.string().default('http://localhost:3001'),

  // JWT check
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  JWT_ALGORITHM: Joi.string().valid('HS256').required(),

  // DATABASE check
  DATABASE_URL: Joi.string().required(),

  // OIDC check
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),

  // Security check
  SALT_OR_ROUNDS: Joi.number().default(10),

  // RESEND check
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().default('onboarding@resend.dev'),
  APP_NAME: Joi.string().default('Mora'),

  // REDIS check
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
}).unknown(true);

export function validate(config: Record<string, any>) {
  const { error, value } = validationSchema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
}

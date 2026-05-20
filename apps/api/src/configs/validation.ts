import {
  baseSchema,
  buildValidate,
  databaseSchema,
  mailSchema,
  sqsSchema,
} from '@mora/env';
import Joi from 'joi';

const schema = Joi.object({
  ...baseSchema,
  ...databaseSchema,
  ...mailSchema,
  ...sqsSchema,
  PORT: Joi.number().port().default(3001),
  FRONTEN_URL: Joi.string().default('http://localhost:3000'),
  BACKEND_URL: Joi.string().default('http://localhost:3001'),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ISSUER: Joi.string().required(),
  JWT_AUDIENCE: Joi.string().required(),
  JWT_ALGORITHM: Joi.string().valid('HS256').required(),
  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_SECRET: Joi.string().required(),
  GOOGLE_CALLBACK_URL: Joi.string().required(),
  SALT_OR_ROUNDS: Joi.number().default(10),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
}).unknown(true);

export const validate = buildValidate(schema);

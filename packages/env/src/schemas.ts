import Joi from 'joi';

export const baseSchema = {
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
};

export const databaseSchema = {
  DATABASE_URL: Joi.string().required(),
};

export const mailSchema = {
  RESEND_API_KEY: Joi.string().required(),
  RESEND_FROM_EMAIL: Joi.string().default('onboarding@resend.dev'),
  RESEND_DEV_TO_EMAIL: Joi.string().optional(),
  APP_NAME: Joi.string().default('Mora'),
};

export const sqsSchema = {
  AWS_REGION: Joi.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: Joi.string().required(),
  AWS_SECRET_ACCESS_KEY: Joi.string().required(),
  SQS_QUEUE_URL: Joi.string().required(),
  SQS_ENDPOINT_URL: Joi.string().optional(),
};

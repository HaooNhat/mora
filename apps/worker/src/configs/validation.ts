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
}).unknown(true);

export const validate = buildValidate(schema);

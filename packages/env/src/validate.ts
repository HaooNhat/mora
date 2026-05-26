import Joi from "joi";

export function buildValidate(schema: Joi.ObjectSchema) {
  return function validate(config: Record<string, unknown>) {
    const { error, value } = schema.validate(config, { abortEarly: false });
    if (error) throw new Error(`Config validation error: ${error.message}`);
    return value;
  };
}

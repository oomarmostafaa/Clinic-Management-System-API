import Joi from 'joi';
export const addDoctorValidation = Joi.object({
  userId: Joi.string().required(),
  specialization: Joi.string().required(),
  price: Joi.number().required(),
    schedule: Joi.array().items(
    Joi.object({
      day: Joi.string().required(),
      from: Joi.string().required(),
      to: Joi.string().required(),
    }),
  ),
});
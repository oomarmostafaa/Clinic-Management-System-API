import Joi from "joi";
export const createDoctorValidation = Joi.object({
  userId: Joi.string().required(),
  specialization: Joi.string().required(),
  price: Joi.number().required(),
  schedule: Joi.array()
    .required()
    .items(
      Joi.object({
        day: Joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday").required(),
        from: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),

        to: Joi.string()
          .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
          .required(),
      }).required(),
    ),
});
export const updateDoctorValidation = Joi.object({
  specialization: Joi.string(),
  price: Joi.number(),
  schedule: Joi.array().items(
    Joi.object({
      day: Joi.string().valid("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"),
      from: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
      to: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
    }),
  ),
});

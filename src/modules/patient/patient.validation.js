import Joi from "joi";
export const addPatientValidation = Joi.object({
  medicalHistory: Joi.array().items(Joi.string()).required(),
});

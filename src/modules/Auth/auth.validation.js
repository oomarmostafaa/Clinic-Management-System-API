

import Joi from 'joi';

const signUpSchema = Joi.object({
    name:Joi.string().min(3).required(),
    email:Joi.string().email().required(),
    password: Joi.string().pattern(/^[A-Za-z0-9]{6,20}$/).required(),
    age:Joi.number().required(),
    role:Joi.string().valid("patient").default("patient"),
});

const signInSchema = Joi.object({
    email:Joi.string().email().required(),
    password: Joi.string().required(),
});
const forgetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});
const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().pattern(/^[A-Za-z0-9]{6,20}$/).required(),
});
const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(/^[A-Za-z0-9]{6,20}$/).required(),
});
export {
    signUpSchema,
    signInSchema,
    forgetPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema
}

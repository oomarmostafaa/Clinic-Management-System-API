import Joi from 'joi';
export const updateUserSchema = Joi.object({
    id:Joi.string().hex().length(24),
    name:Joi.string().min(3),
    email:Joi.string().email(),
    age:Joi.number().max(100),
    role:Joi.string(),
});

export const updateUserProfileSchema = Joi.object({
    name:Joi.string().min(3),
    email:Joi.string().email(),
    age:Joi.number().max(100),
});
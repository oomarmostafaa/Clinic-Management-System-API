import Joi from "joi";

export const createBookingSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  date: Joi.date().min("now").required().messages({
    "date.base": "Date must be a valid date",
    "date.min": "Date must be in the future",
    "any.required": "Date is required",}),

  time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/).required().messages({
    "string.pattern.base": "Time must be in HH:MM format",
    "any.required": "Time is required",}),
});

export const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "cancelled", "completed").optional(),
  paymentStatus: Joi.string().valid("pending", "paid", "failed").optional(),
});
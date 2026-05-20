import Joi from "joi";

// Validation schema for creating a Stripe Payment Intent
export const createPaymentIntentSchema = Joi.object({
  bookingId: Joi.string().hex().length(24).required().messages({
    "string.empty": "Booking ID is required",
    "any.required": "Booking ID is required",
  }),
});

// Validation schema for confirming a payment
export const confirmPaymentSchema = Joi.object({
  paymentIntentId: Joi.string().required().messages({
    "string.empty": "Payment Intent ID is required",
    "any.required": "Payment Intent ID is required",
  }),
});
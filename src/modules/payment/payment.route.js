import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { validation } from "../../middleware/validation.js";
import {createCheckoutSession,getPaymentById,getPaymentByBookingId,getAllPayments,paymentSuccess,paymentCancel,} from "./payment.controller.js";

const paymentRouter = Router();

// POST /api/v1/payments/create-checkout - إنشاء رابط دفع Stripe
paymentRouter.post("/create-checkout", protectedRoutes, createCheckoutSession);

// صفحات الـ Redirect من Stripe (مش محتاجة token) + بيشتغلوا لوحدهم مع الي فوقيهم 
paymentRouter.get("/success", paymentSuccess);
paymentRouter.get("/cancel", paymentCancel);

// GET /api/v1/payments - كل المعاملات   (Admin)
paymentRouter.get("/", protectedRoutes, allowTo("admin"), getAllPayments);

// GET /api/v1/payments/booking/:bookingId - دفعة حسب booking ID
paymentRouter.get("/booking/:bookingId", protectedRoutes, getPaymentByBookingId);

// GET /api/v1/payments/:id - دفعة محددة
paymentRouter.get("/:id", protectedRoutes, getPaymentById);

export default paymentRouter;
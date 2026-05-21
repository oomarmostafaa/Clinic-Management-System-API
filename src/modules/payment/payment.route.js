import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { validation } from "../../middleware/validation.js";
import {createCheckoutSession,getPaymentById,getPaymentByBookingId,getAllPayments,paymentSuccess,paymentCancel,searchPayments} from "./payment.controller.js";

const paymentRouter = Router();

// POST /api/v1/payments/create-checkout - إنشاء رابط دفع Stripe
paymentRouter.post("/create-checkout", protectedRoutes, createCheckoutSession);

// صفحات الـ Redirect للعرض للمستخدم (الـ Webhook هو الذي يحدث البيانات)
paymentRouter.get("/success", paymentSuccess);
paymentRouter.get("/cancel", paymentCancel);

// GET /api/v1/payments - كل المعاملات   (Admin)
paymentRouter.get("/", protectedRoutes, allowTo("admin"), getAllPayments);

// Search payments (Admin)
paymentRouter.get("/search", protectedRoutes, allowTo("admin"), searchPayments);

// GET /api/v1/payments/booking/:bookingId - دفعة حسب booking ID
paymentRouter.get("/booking/:bookingId", protectedRoutes, getPaymentByBookingId);

// GET /api/v1/payments/:id - دفعة محددة
paymentRouter.get("/:id", protectedRoutes, getPaymentById);

export default paymentRouter;
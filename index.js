import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { dbConnection } from "./Databases/db.connection.js";
import { allRoutes } from "./src/modules/routes.js";
import cors from "cors";
import { globalErrorHandler } from "./src/middleware/globalError.js";
import { stripeWebhook } from "./src/modules/payment/payment.controller.js";

const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
await dbConnection();

// Webhook Route - يجب أن يكون قبل express.json لضمان استلام البيانات الخام
app.post("/api/v1/payments/webhook",express.raw({ type: "application/json" }),stripeWebhook);
app.use(express.json());
allRoutes(app);
app.get("/", (req, res) => res.send("Hello World!"));
app.use(globalErrorHandler);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));







// Webhooks
//    المفروض ديه فوق ال  app.use(express.json())
// import Stripe from "stripe";
// const getStripe = () => {
//   if (!process.env.STRIPE_SECRET_KEY) {
//     throw new AppError("Stripe secret key is not configured in .env file", 500);
//   }
//   return new Stripe(process.env.STRIPE_SECRET_KEY);
// };
// app.post("/api/webhook",express.raw({ type: "application/json" }),catchError(async (req, res) => {
//   const sig = req.headers["stripe-signature"].toString();
//   let event = (event = Stripe.webhooks.constructEvent(req.body,sig,process.env.payment_stripe_webhook_secret,));
//   let checkoutSessionCompleted;
//   if (event.type == "checkout.session.completed") {
//     checkoutSessionCompleted = event.data.object;
//   }
//   // Return a 200 res to acknowledge receipt of the event
//   res.json({ message: "Success received webhook", checkoutSessionCompleted });
// }));

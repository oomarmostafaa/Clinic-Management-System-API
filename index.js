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
app.set('trust proxy', 1); // مفيد عند التعامل مع الروابط في Vercel
app.use(cors());
await dbConnection();

// Webhook Route - يجب أن يكون قبل express.json لضمان استلام البيانات الخام
app.post("/api/v1/payments/webhook",express.raw({ type: "application/json" }),stripeWebhook);
app.use(express.json());
allRoutes(app);
app.get("/", (req, res) => res.send("Hello World!"));
app.use(globalErrorHandler);
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

import Stripe from "stripe";
import PaymentModel from "../../../Databases/models/Payment.models.js";
import BookingModel from "../../../Databases/models/Booking.model.js";
import PatientModel from "../../../Databases/models/Patient.model.js";
import AppError from "../../utils/appError.js";
import catchError from "../../middleware/catchError.js";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new AppError("Stripe secret key is not configured in .env file", 500);
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// إنشاء رابط دفع Stripe Checkout
//المستخدم يفتح الرابط في المتصفح ويدخل بيانات الكارت ويدفع
export const createCheckoutSession = catchError(async (req, res, next) => {

  let stripe = getStripe()
  const { bookingId } = req.body;

  // 1. البحث عن الحجز
  const booking = await BookingModel.findById(bookingId).populate("doctorId");
  if (!booking) return next(new AppError("Booking not found", 404));

  // 2. التحقق من الصلاحية
  const patient = await PatientModel.findById(booking.patientId);
  const isPatient = patient && patient.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isAdmin && !isPatient)
    return next(new AppError("Not authorized", 403));

  // 3. الحجز لازم يكون confirmed
  if (booking.status !== "confirmed")
    return next(new AppError(`Cannot pay for a ${booking.status} booking`, 400));

  // 4. منع الدفع المكرر
  const existingPayment = await PaymentModel.findOne({ bookingId, paymentStatus: "completed" });
  if (existingPayment) return next(new AppError("Booking already paid", 400));

  // 5. إنشاء Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: `Booking - Dr. ${booking.doctorId.specialization}`,
            description: `Appointment on ${booking.date} at ${booking.time}`,
          },
          unit_amount: booking.doctorId.price * 100, // Stripe بالقرش
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId: booking._id.toString() },
    success_url: `${req.protocol}://${req.get("host")}/api/v1/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.protocol}://${req.get("host")}/api/v1/payments/cancel?bookingId=${booking._id}`,
  });

  // 6. حفظ الـ payment بـ status "pending" فور إنشاء الـ session
  await PaymentModel.create({
    bookingId: booking._id,
    amount: booking.doctorId.price,
    paymentStatus: "pending",
    transactionId: session.id, // session ID كـ transaction مؤقت
  });

  res.status(201).json({
    message: "Checkout session created",
    checkoutUrl: session.url, // ← اللي هترسله للمستخدم
    sessionId: session.id,
  });
});
// 2. Stripe Webhook - المنطق الأساسي لتحديث قاعدة البيانات
export const stripeWebhook = catchError(async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const bookingId = session.metadata.bookingId; 

    // تحديث سجل الدفع باستخدام session.id (الذي خزناه عند الإنشاء كـ transactionId مؤقت)
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: session.id }, 
      { paymentStatus: "completed", transactionId: session.payment_intent },
      { new: true }
    );

    // تحديث الحجز ليصبح "مدفوع" (نستخدم الـ ID من الـ metadata أو من السجل المحدث)
    const targetBookingId = bookingId || payment?.bookingId;
    if (targetBookingId) {
      await BookingModel.findByIdAndUpdate(targetBookingId, { paymentStatus: "paid" });
    }
  }

  res.status(200).json({ received: true });
});

// 3. صفحة نجاح الدفع - للعرض فقط للمستخدم
export const paymentSuccess = catchError(async (req, res) => {
  res.send(`
    <div style="text-align:center; padding-top: 50px; font-family: sans-serif;">
      <h1 style="color: green;">✅ Payment Successful!</h1>
      <p>Your booking is being confirmed. Thank you!</p>
      <a href="/" style="text-decoration: none; color: blue;">Back to Home</a>
    </div>
  `);
});
// 4. صفحة فشل الدفع - للعرض فقط للمستخدم
export const paymentCancel = catchError(async (req, res) => {
  const { bookingId } = req.query;

  if (bookingId) {
    // تحديث حالة الدفع في PaymentModel إلى failed
    await PaymentModel.findOneAndUpdate(
      { bookingId, paymentStatus: "pending" },
      { paymentStatus: "failed" }
    );
    // تحديث حالة الدفع في BookingModel إلى failed
    await BookingModel.findByIdAndUpdate(bookingId, { paymentStatus: "failed" });
  }

  res.send(`
    <h1>❌ Payment Cancelled</h1>
    <p>You cancelled the payment. You can try again later.</p>
    <a href="/">Go Home</a>
  `);
});


// جلب كل الدفعات (Admin) 
export const getAllPayments = catchError(async (req, res, next) => {
  const payments = await PaymentModel.find()
    .populate({ path: "bookingId", populate: [
      { path: "doctorId", select: "specialization price" },
      { path: "patientId", populate: { path: "userId", select: "name email" } },
    ]})
    .sort("-createdAt");

  res.status(200).json({ message: "Payments retrieved successfully", count: payments.length, payments });
});

// جلب دفعة عن طريق bookingId
export const getPaymentByBookingId = catchError(async (req, res, next) => {
  const { bookingId } = req.params;
  const payment = await PaymentModel.findOne({ bookingId })
    .populate({ path: "bookingId", populate: [
      { path: "doctorId", select: "specialization price" },
      { path: "patientId", populate: { path: "userId", select: "name email" } },
    ]});

  if (!payment) return next(new AppError("Payment not found for this booking", 404));
  res.status(200).json({ message: "Payment retrieved successfully", payment });
});

// جلب دفعة محددة
export const getPaymentById = catchError(async (req, res, next) => {
  const payment = await PaymentModel.findById(req.params.id)
    .populate({ path: "bookingId", populate: [
      { path: "doctorId", select: "specialization price" },
      { path: "patientId", populate: { path: "userId", select: "name email" } },
    ]});

  if (!payment) return next(new AppError("Payment not found", 404));
  res.status(200).json({ message: "Payment retrieved successfully", payment });
});

// Search Payments by transactionId or paymentStatus (Admin only)
export const searchPayments = catchError(async (req, res, next) => {
  let searchKey = req.query.keyword || req.query.transactionId || req.query.status;

  if (!searchKey) {
    return next(new AppError("Please provide a search keyword,transactionId=pending...completed...failed", 400));
  }

  const keyword = searchKey.replace(/['"]+/g, '');

  const payments = await PaymentModel.find({
    $or: [
      { transactionId: { $regex: keyword, $options: "i" } },
      { paymentStatus: { $regex: keyword, $options: "i" } },
    ],
  }).populate({ path: "bookingId", populate: [
    { path: "doctorId", select: "specialization price" },
    { path: "patientId", populate: { path: "userId", select: "name email" } },
  ]});

  res.status(200).json({ message: "Payments retrieved successfully", count: payments.length, payments });
});
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
// صفحة نجاح الدفع - بتستقبل session_id من Stripe وتسجل الدفع
export const paymentSuccess = catchError(async (req, res) => {
  const stripe = getStripe();
  const { session_id } = req.query;

  console.log("✅ paymentSuccess called, session_id:", session_id);

  if (!session_id) {
    return res.send(`
      <h1>⚠️ Missing session ID</h1>
      <p>No session ID provided.</p>
    `);
    
  }

  try {
    // 1. جلب الـ session من Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log("📦 Session retrieved, payment_status:", session.payment_status, "| payment_intent:", session.payment_intent);

    if (session.payment_status !== "paid") {
      return res.status(400).send(`
        <h1>⏳ Payment Not Completed</h1>
        <p>Your payment was not completed. Status: ${session.payment_status}</p>
      `);
    }

    // 2. تحديث سجل الدفع (PaymentModel)
    // ملاحظة: نستخدم session.id للبحث لأننا قمنا بتخزينه في البداية كـ transactionId
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionId: session.id },
      { paymentStatus: "completed", transactionId: session.payment_intent || session.id },
      { new: true }
    );

    if (payment) {
      // 3. تحديث سجل الحجز (BookingModel) ليصبح "paid"
      await BookingModel.findByIdAndUpdate(payment.bookingId, { paymentStatus: "paid" });
    }

    res.send(`
      <h1>✅ Payment Successful!</h1>
      <p>Your booking has been paid successfully.</p>
      <p>Amount: EGP ${session.amount_total / 100}</p>
      <a href="/">Go Home</a>
    `);
  } catch (err) {
    console.error("❌ Error in paymentSuccess:", err.message, err);
    res.send(`
      <h1>❌ Error</h1>
      <p>Could not verify payment: ${err.message}</p>
    `);
  }
});
//صفحة إلغاء الدفع   
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
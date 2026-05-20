import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  transactionId: {
    type: String,
    required: false,
    default: null,
  },
}, { timestamps: true });

const PaymentModel = mongoose.model("Payment", PaymentSchema);
export default PaymentModel;
import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending ", "confirmed", "completed"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
}, { timestamps: true });

BookingSchema.index({ doctorId: 1, date: 1, time: 1, status: 1 });

const BookingModel = mongoose.model("Booking", BookingSchema);
export default BookingModel;
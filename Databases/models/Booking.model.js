const BookingSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    required: true,
  },
    patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
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
  paymentstatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
}, { timestamps: true });
const BookingModel = mongoose.model("Booking", BookingSchema);
export default BookingModel;
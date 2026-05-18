const PrescriptionSchema = new mongoose.Schema({  
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
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
    },
    medications: {
        type: String,
    },
    instructions: {
        type: String,
    }
}, { timestamps: true });

const PrescriptionModel = mongoose.model("Prescription", PrescriptionSchema);
export default PrescriptionModel;
      
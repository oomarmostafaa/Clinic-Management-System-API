const PatientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  medicalHistory: {
    type: String,
    required: true,
  },
});
const PatientModel = mongoose.model("Patient", PatientSchema);
export default PatientModel;

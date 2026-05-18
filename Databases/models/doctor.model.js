import mongoose, { Schema } from "mongoose";

const doctorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    schedule: [
      {
        day: String, // "monday"
        from: String, // "09:00"
        to: String, // "15:00"
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
const doctorModel = mongoose.model("Doctor", doctorSchema);
export default doctorModel;

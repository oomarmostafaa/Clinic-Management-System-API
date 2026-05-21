import BookingModel from "../../../Databases/models/Booking.model.js";
import DoctorModel from "../../../Databases/models/doctor.model.js";
import PatientModel from "../../../Databases/models/Patient.model.js";
import AppError from "../../utils/appError.js";
import catchError from "../../middleware/catchError.js";

// Create a new booking
export const createBooking = catchError(async (req, res, next) => {
  const { doctorId, date, time } = req.body;

  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }

  const patient = await PatientModel.findOne({ userId: req.user._id });
  if (!patient) {
    return next(new AppError("Patient profile not found. Please create your patient profile first.", 404));
  }

  const bookingDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return next(new AppError("Cannot book appointments in the past", 400));
  }

  const existingBooking = await BookingModel.findOne({
    doctorId,
    date: bookingDate,
    time,
    status: { $in: ["pending", "confirmed"] },
  });
  if (existingBooking) {
    return next(new AppError("This time slot is already booked. Please choose another time.", 400));
  }

  const booking = await BookingModel.create({
    doctorId,
    patientId: patient._id,
    date: bookingDate,
    time,
    status: "pending",
    paymentStatus: "pending",
  });

  const populatedBooking = await BookingModel.findById(booking._id)
    .populate("doctorId", "specialization price schedule")
    .populate({ path: "patientId", populate: { path: "userId", select: "name email" } });

  res.status(201).json({ message: "Booking created successfully", booking: populatedBooking });
});

// Get all bookings (Admin only)
export const getAllBookings = catchError(async (req, res, next) => {
  const bookings = await BookingModel.find()
    .populate("doctorId", "specialization price")
    .populate({ path: "patientId", populate: { path: "userId", select: "name email" } })
    .sort("-createdAt");

  res.status(200).json({ message: "Bookings retrieved successfully", count: bookings.length, bookings });
});

// Get bookings for the current patient (my-bookings)
export const getMyBookings = catchError(async (req, res, next) => {
  const patient = await PatientModel.findOne({ userId: req.user._id });
  if (!patient) return next(new AppError("Patient profile not found", 404));

  const bookings = await BookingModel.find({ patientId: patient._id })
    .populate("doctorId", "specialization price")
    .populate({ path: "patientId", populate: { path: "userId", select: "name email" } })
    .sort("-date -time");

  res.status(200).json({ message: "My bookings retrieved successfully", count: bookings.length, bookings });
});

// Get bookings for a specific doctor
export const getDoctorBookings = catchError(async (req, res, next) => {
  const { doctorId } = req.params;

  const doctor = await DoctorModel.findById(doctorId);
  if (!doctor) return next(new AppError("Doctor not found", 404));
  if (req.user.role !== "admin" && doctor.userId.toString() !== req.user._id.toString())
    return next(new AppError("Not authorized to view these bookings", 403));

  const bookings = await BookingModel.find({ doctorId })
    .populate("doctorId", "specialization price schedule")
    .populate({ path: "patientId", populate: { path: "userId", select: "name email" } })
    .sort("-date -time");

  res.status(200).json({ message: "Doctor bookings retrieved successfully", count: bookings.length, bookings });
});

// Delete a booking (Admin / Doctor of the booking / Patient himself)
export const deleteBooking = catchError(async (req, res, next) => {
  const booking = await BookingModel.findById(req.params.id);
  if (!booking) return next(new AppError("Booking not found", 404));

  const patient = await PatientModel.findById(booking.patientId);
  const doctor = await DoctorModel.findById(booking.doctorId);

  const isAdmin = req.user.role === "admin";
  const isPatient = patient && patient.userId.toString() === req.user._id.toString();
  const isDoctor = doctor && doctor.userId.toString() === req.user._id.toString();

  if (!isAdmin && !isPatient && !isDoctor)
    return next(new AppError("Not authorized to delete this booking", 403));

  await booking.deleteOne();

  res.status(200).json({ message: "Booking deleted successfully" });
});

// Confirm a booking (Doctor or Admin only)
export const confirmBooking = catchError(async (req, res, next) => {
  const booking = await BookingModel.findById(req.params.id)
    .populate("doctorId")
    .populate({ path: "patientId", populate: { path: "userId" } });

  if (!booking) return next(new AppError("Booking not found", 404));
  if (booking.status !== "pending") return next(new AppError(`Cannot confirm a ${booking.status} booking`, 400));

  const isAdmin = req.user.role === "admin";
  const isDoctor = booking.doctorId.userId.toString() === req.user._id.toString();
  if (!isAdmin && !isDoctor) return next(new AppError("Not authorized to confirm this booking", 403));

  booking.status = "confirmed";
  await booking.save();

  const populatedBooking = await BookingModel.findById(booking._id)
    .populate("doctorId", "specialization price schedule")
    .populate({ path: "patientId", populate: { path: "userId", select: "name email" } });

  res.status(200).json({ message: "Booking confirmed successfully", booking: populatedBooking });
});

// Complete a booking (Doctor or Admin only - after examination)
export const completeBooking = catchError(async (req, res, next) => {
  const booking = await BookingModel.findById(req.params.id)
    .populate("doctorId")
    .populate({ path: "patientId", populate: { path: "userId" } });

  if (!booking) return next(new AppError("Booking not found", 404));
  if (booking.status !== "confirmed")
    return next(new AppError(`Cannot complete a ${booking.status} booking. Booking must be confirmed first.`, 400));

  const isAdmin = req.user.role === "admin";
  const isDoctor = booking.doctorId.userId.toString() === req.user._id.toString();
  if (!isAdmin && !isDoctor) return next(new AppError("Not authorized to complete this booking", 403));

  booking.status = "completed";
  booking.paymentStatus =  "pending";
  await booking.save();

  const populatedBooking = await BookingModel.findById(booking._id)
    .populate("doctorId", "specialization price schedule")
    .populate({ path: "patientId", populate: { path: "userId", select: "name email" } });

  res.status(200).json({ message: "Booking completed successfully", booking: populatedBooking });
});

// Search Bookings by status or paymentStatus (Admin only)
export const searchBookings = catchError(async (req, res, next) => {
  let searchKey = req.query.keyword || req.query.status || req.query.paymentStatus;

  if (!searchKey) {
    return next(new AppError(
      "Please provide a search keyword...status=pending...confirmed...completed", 400));
  }

  const keyword = searchKey.replace(/['"]+/g, '');

  const bookings = await BookingModel.find({
    $or: [
      { status: { $regex: keyword, $options: "i" } },
      { paymentStatus: { $regex: keyword, $options: "i" } },
    ],
  }).populate([
    { path: "doctorId", select: "specialization price" },
    { path: "patientId", populate: { path: "userId", select: "name email" } }
  ]);

  res.status(200).json({ message: "Bookings retrieved successfully", count: bookings.length, bookings });
});
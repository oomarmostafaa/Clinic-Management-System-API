import express from "express";
import mongoose from "mongoose";
import catchError from "../../middleware/catchError.js";
import AppError from "../../utils/appError.js";
import doctorModel from "../../../Databases/models/doctor.model.js";
import userModel from "../../../Databases/models/user.model.js";

export const createDoctor = catchError(async (req, res, next) => {
  const { userId } = req.body;
  const alreadyDoctor = await doctorModel.findOne({ userId });
  if (alreadyDoctor) {
    return next(new AppError("Doctor already exists", 400));
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const doctor = await doctorModel.create(
      [{ ...req.body, createdBy: req.user.id }],
      { session }
    );

    const user = await userModel.findByIdAndUpdate(
      userId,
      { role: "doctor" },
      { new: true, runValidators: true, session }
    );

    if (!user) {
      throw new Error("User not found");
    }

    await session.commitTransaction();
    res.status(201).json({ message: "Doctor created successfully", user, doctor: doctor[0] });
  } catch (error) {
    await session.abortTransaction();
    return next(new AppError(error.message, 400));
  } finally {
    session.endSession();
  }
});

export const getAllDoctors = catchError(async (req, res, next) => {
  const doctors = await doctorModel
    .find()
    .populate({ path: "userId", select: "name email" });
  res.status(200).json({ doctors });
});
export const getDoctorById = catchError(async (req, res, next) => {
  const doctor = await doctorModel
    .findById(req.params.id)
    .populate({ path: "userId", select: "name email" });
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }
  res.status(200).json({ doctor });
});
export const updateDoctor = catchError(async (req, res, next) => {
  const doctor = await doctorModel.findById(req.params.id);
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }
  if (req.user.role !== "admin" && doctor.userId.toString() !== req.user.id) {
    return next(new AppError("Not authorized", 403));
  }

  Object.assign(doctor, req.body);
  await doctor.save();
  res.status(200).json({ message: "Doctor updated successfully", doctor });
});
export const deleteDoctor = catchError(async (req, res, next) => {
  const doctor = await doctorModel.findById(req.params.id);
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }
  await doctor.deleteOne();
  res.status(200).json({ message: "Doctor deleted successfully" });
});
export const getSchedule = catchError(async (req, res, next) => {
  const doctor = await doctorModel.findById(req.params.id).populate({ path: "userId", select: "name " });
  if (!doctor) {
    return next(new AppError("Doctor not found", 404));
  }
  res.status(200).json({ doctorName: doctor.userId.name,specialization: doctor.specialization, schedule: doctor.schedule, });
});
export const filterBySpecialty = catchError(async (req, res, next) => {
   const { specialty } = req.params;
    const validSpecialties = ["children", "heart", "skin", "bone"];
  
  if (!validSpecialties.includes(specialty.toLowerCase())) {
    return next(new AppError("Invalid specialty", 400));
  }

  const doctors = await doctorModel.find({ specialization: specialty.toLowerCase() }).populate({ path: "userId", select: "name email" });

  if (doctors.length === 0) {
    return next(new AppError("No doctors found for this specialty", 404));
  }
  res.status(200).json({ results: doctors.length,doctors });
});

export const searchDoctors = catchError(async (req, res, next) => {
  let searchKey = req.query.keyword || req.query.name || req.query.email;
  if (!searchKey) return next(new AppError("Please provide a search keyword", 400));

  const keyword = searchKey.replace(/['"]+/g, '');
  const users = await userModel.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
    ],
  }).select("_id");

  const userIds = users.map(u => u._id);
  const doctors = await doctorModel.find({
    $or: [
      { userId: { $in: userIds } },
      { specialization: { $regex: keyword, $options: "i" } }
    ]
  }).populate({ path: "userId", select: "name email" });

  res.status(200).json({ count: doctors.length, doctors });
});
import express from "express";
import catchError from "../../middleware/catchError.js";
import AppError from "../../utils/appError.js";
import e from "express";
import PatientModel from "../../../Databases/models/Patient.model.js";

export const addPatient = catchError(async (req, res, next) => {

  const { medicalHistory } = req.body;
  if (req.user.role !== "admin" &&req.user.id.toString() !== req.params.id) {
    return next(new AppError("You are not authorized to add patient for this user", 403));}

  const userId = req.params.id;
  const existingPatient = await PatientModel.findOne({ userId });
  if (existingPatient) {return next(new AppError("Patient already exists", 400));}

  const patient = await PatientModel.create({userId,medicalHistory});

  res.status(201).json({
    status: "success add patient",
    data: patient,
  });
});
export const getAllPatients = catchError(async (req, res, next) => {
  const patients = await PatientModel.find().populate("userId", "name email");
  res.status(200).json({
    status: "success",
    data: patients,
  });
});
export const getPatientById = catchError(async (req, res, next) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }
  if (
    req.user.role !== "admin" &&
    req.user.id.toString() !== patient.userId.toString()
) {
    return next(new AppError("Not authorized", 403));
  }
  res.status(200).json({
    status: "success get patient",
    data: patient,
    user:req.user
  });
});
export const updatePatient = catchError(async (req, res, next) => {
  const patient = await PatientModel.findById(req.params.id);
  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }
  if (
    req.user.role !== "admin" &&
    req.user.id.toString() !== patient.userId.toString()
  ) {
    return next(new AppError("Not authorized", 403));
  }

  Object.assign(patient, req.body);
  await patient.save();

  res.status(200).json({
    status: "success update patient",
    data: patient
  });

});
export const deletePatient = catchError(async (req, res, next) => {

  const patient = await PatientModel.findById(req.params.id);

  if (!patient) {
    return next(new AppError("Patient not found", 404));
  }

  if (
    req.user.role !== "admin" &&
    req.user.id.toString() !== patient.userId.toString()
  ) {
    return next(new AppError("Not authorized", 403));
  }

  await patient.deleteOne();

  res.status(200).json({
    status: "success",
    message: "Patient deleted"
  });

});
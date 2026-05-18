import express from "express";
import catchError from "../../middleware/catchError.js";
import AppError from "../../utils/appError.js";
import doctorModel from "../../../Databases/models/doctor.model.js";

export const createDoctor = catchError(async (req, res, next) => {
  req.body.createdBy = req.user.id; // req.user is set by authentication middleware
  const doctor = await doctorModel.create(req.body);
  res.status(201).json({ message: "Doctor created successfully", doctor });
});
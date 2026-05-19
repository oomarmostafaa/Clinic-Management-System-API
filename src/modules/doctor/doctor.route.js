import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { validation } from "../../middleware/validation.js";
import { createDoctor, deleteDoctor, filterBySpecialty, getAllDoctors, getDoctorById, getSchedule, updateDoctor } from "./doctor.controller.js";
import { createDoctorValidation, updateDoctorValidation } from "./doctor.validation.js";

const doctorRouter = Router();

// (admin only) can create doctor
doctorRouter.post("/", protectedRoutes, allowTo("admin"), validation(createDoctorValidation), createDoctor);

// get all doctors (public)
doctorRouter.get("/", protectedRoutes , getAllDoctors);

// get doctor by ID (public)
doctorRouter.get("/:id", protectedRoutes, getDoctorById);

// update doctor (admin only, doctor can update their own profile)  
doctorRouter.put("/:id", protectedRoutes, validation(updateDoctorValidation), updateDoctor);

// Delete doctor (admin only, doctor can delete their own profile)  
doctorRouter.delete("/:id", protectedRoutes, allowTo("admin"), deleteDoctor);

// get doctor schedule (public)
doctorRouter.get("/:id/schedule",protectedRoutes, getSchedule);

// filter doctors by specialty (public)
doctorRouter.get("/specialty/:specialty",protectedRoutes, filterBySpecialty);

export default doctorRouter;

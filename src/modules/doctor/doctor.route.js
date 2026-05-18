import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { validation } from "../../middleware/validation.js";
import { createDoctor } from "./doctor.controller.js";

const doctorRouter = Router();

doctorRouter.post("/", protectedRoutes, allowTo("admin"), createDoctor);

// doctorRouter.get("/", getDoctors);

// doctorRouter.get("/:id", getDoctorById);

// doctorRouter.put("/:id", protectedRoutes, allowTo("admin"), updateDoctor);

// doctorRouter.delete("/:id", protectedRoutes, allowTo("admin"), deleteDoctor);

// doctorRouter.get("/specialty/:specialty", filterBySpecialty);

// doctorRouter.get("/:id/schedule", getSchedule);

// doctorRouter.put("/:id/schedule", protectedRoutes, allowTo("admin","doctor"), updateSchedule);

export default doctorRouter;

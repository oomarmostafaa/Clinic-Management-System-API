import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { addPatient, deletePatient, getAllPatients, getPatientById, updatePatient } from "./patient.controller.js";
import { addPatientValidation,  } from "./patient.validation.js";
import { validation } from "../../middleware/validation.js";

const patientRouter = Router();

patientRouter.get("/", protectedRoutes, allowTo("admin"), getAllPatients);
patientRouter.post("/:id", protectedRoutes, validation(addPatientValidation), addPatient);
patientRouter.get("/:id", protectedRoutes, getPatientById);
patientRouter.put("/:id", protectedRoutes, updatePatient);
patientRouter.delete("/:id", protectedRoutes, deletePatient);

export default patientRouter;

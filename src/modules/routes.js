import authRoutes from "./Auth/auth.route.js";
import { signUpSchema } from "./Auth/auth.validation.js";
import doctorRouter from "./doctor/doctor.route.js";
import patientRouter from "./patient/patient.route.js";
import userRouer from "./users/user.route.js";


export const allRoutes = (app) => {
  app.use("/api/v1/auth",authRoutes);
  app.use("/api/v1/users",userRouer);
  app.use("/api/v1/doctors", doctorRouter);
  app.use("/api/v1/patients", patientRouter);
};

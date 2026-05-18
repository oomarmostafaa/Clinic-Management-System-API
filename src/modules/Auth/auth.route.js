import  {Router} from "express";
import { changePassword, forgetPassword, protectedRoutes, resetPassword, signIn, signUp } from "./auth.controller.js";
import { validation } from "../../middleware/validation.js";
import { signInSchema, signUpSchema,forgetPasswordSchema,resetPasswordSchema, changePasswordSchema } from "./auth.validation.js";
const authRoutes = Router();

authRoutes.post("/signup",validation(signUpSchema),signUp);
authRoutes.post("/signin",validation(signInSchema),signIn);
authRoutes.post("/change-password",protectedRoutes,validation(changePasswordSchema),changePassword);
authRoutes.post("/forget-password",validation(forgetPasswordSchema),forgetPassword);
authRoutes.post("/reset-password/:token",validation(resetPasswordSchema), resetPassword);


export default authRoutes;

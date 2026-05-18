import { Router } from "express";
import {
  deleteUser,
  DeleteUserprofile,
  getAllUsers,
  getUserbyId,
  getUserProfile,
  updateUser,
  updateUserprofile,
} from "./user.controller.js";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { validation } from "../../middleware/validation.js";
import { updateUserProfileSchema, updateUserSchema } from "./user.validation.js";

const userRouter = Router();
userRouter.get("/", protectedRoutes, allowTo("admin"), getAllUsers); // Admin only

userRouter.get("/profile", protectedRoutes, getUserProfile); // All users

userRouter.put("/profile", protectedRoutes, validation(updateUserProfileSchema), updateUserprofile); // All users

userRouter.delete("/profile", protectedRoutes, DeleteUserprofile);

userRouter.get("/:id", protectedRoutes, allowTo("admin"), getUserbyId); // Admin only

userRouter.put("/:id",protectedRoutes,allowTo("admin"),validation(updateUserSchema),updateUser,); // Admin only

userRouter.delete("/:id", protectedRoutes, allowTo("admin"), deleteUser); // Admin only

export default userRouter;

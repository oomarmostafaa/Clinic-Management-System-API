import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { getDashboardStats, getTopDoctors } from "./dashboard.controller.js";

const dashboardRouter = Router();

// جميع مسارات الداشبورد محمية ومخصصة للآدمن فقط
dashboardRouter.get("/stats", protectedRoutes, allowTo("admin"), getDashboardStats);
dashboardRouter.get("/top-doctors", protectedRoutes, getTopDoctors);

export default dashboardRouter;
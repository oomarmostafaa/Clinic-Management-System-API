import { Router } from "express";
import { allowTo, protectedRoutes } from "../Auth/auth.controller.js";
import { validation } from "../../middleware/validation.js";
import {
  createBooking,
  getAllBookings,
  getBookingById,
  getMyBookings,
  getDoctorBookings,
  deleteBooking,
  confirmBooking,
  completeBooking,
} from "./booking.controller.js";
import { createBookingSchema } from "./booking.validation.js";

const bookingRouter = Router();

// POST /api/v1/bookings - Create a new booking (Patient only)
bookingRouter.post("/", protectedRoutes, validation(createBookingSchema), createBooking);

// GET /api/v1/bookings - Get all bookings (Admin only)
bookingRouter.get("/", protectedRoutes, allowTo("admin"), getAllBookings);

// GET /api/v1/bookings/my-bookings - Get current patient's bookings
bookingRouter.get("/my-bookings", protectedRoutes, getMyBookings);

// GET /api/v1/bookings/doctor/:doctorId - Get bookings for a specific doctor (Doctor or Admin)
bookingRouter.get("/doctor/:doctorId", protectedRoutes, getDoctorBookings);

// DELETE /api/v1/bookings/:id - Delete a booking (Patient, Doctor, or Admin)
bookingRouter.delete("/:id", protectedRoutes, deleteBooking);

// PUT /api/v1/bookings/:id/confirm - Confirm a booking (Doctor or Admin only)
bookingRouter.put("/:id/confirm", protectedRoutes, confirmBooking);

// PUT /api/v1/bookings/:id/complete - Complete a booking (Doctor or Admin only)
bookingRouter.put("/:id/complete", protectedRoutes, completeBooking);

export default bookingRouter;
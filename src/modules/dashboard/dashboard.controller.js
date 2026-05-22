import catchError from "../../middleware/catchError.js";
import AppError from "../../utils/appError.js";
import userModel from "../../../Databases/models/user.model.js";
import doctorModel from "../../../Databases/models/doctor.model.js";
import PatientModel from "../../../Databases/models/Patient.model.js";
import BookingModel from "../../../Databases/models/Booking.model.js";
import PaymentModel from "../../../Databases/models/Payment.models.js";


//إحصائيات عامة للنظام (Admin Only)
export const getDashboardStats = catchError(async (req, res, next) => {
  const usersCount = await userModel.countDocuments();
  const doctorsCount = await doctorModel.countDocuments();
  const patientsCount = await PatientModel.countDocuments();
  const bookingsCount = await BookingModel.countDocuments();

  // نجلب كل الدفعات الناجحة
  const successfulPayments = await PaymentModel.find({ paymentStatus: "completed" });
  
  // نجمع المبالغ باستخدام حلقة تكرار
  let totalRevenue = 0;
 successfulPayments.forEach((payment) => {
    totalRevenue += payment.amount;
  });

  res.status(200).json({
    message: "Dashboard statistics retrieved successfully",
    stats: {
      users: usersCount,
      doctors: doctorsCount,
      patients: patientsCount,
      bookings: bookingsCount,
      revenue: totalRevenue
    }
  });
});


// افضل دكتور 
export const getTopDoctors = catchError(async (req, res, next) => {
  const bookingCounts = await BookingModel.aggregate([
    { $group: { _id: "$doctorId", count: { $sum: 1 } } },
    { $sort: { numberOfBookings: -1 } }
  ]);

  // نمر على النتائج ونجلب تفاصيل كل دكتور يدوياً
  const topDoctors = [];
  for (const item of bookingCounts) {
    const doctor = await doctorModel.findById(item._id);
    if (doctor) {
      topDoctors.push({
        doctorId: doctor._id,
        specialization: doctor.specialization,
        numberOfBookings: item.count
      });
    }
  }

  res.status(200).json({
    message: "Top doctors retrieved successfully",
    topDoctors
  });
});
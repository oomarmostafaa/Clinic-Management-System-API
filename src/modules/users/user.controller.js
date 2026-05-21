import express from "express";
import userModel from "../../../Databases/models/user.model.js";
import catchError from "../../middleware/catchError.js";
import AppError from "../../utils/appError.js";


//  Admin only
export const getAllUsers = catchError(async (req, res) => {
  const users = await userModel.find();
  res.json(users);
});

export const getUserbyId = catchError(async (req, res, next) => {
  const user = await userModel.findById(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.json(user);
});

export const updateUser = catchError(async (req, res, next) => {
  // منع الأدمن من تغيير الباسورد عبر هذه الدالة لضمان عدم تخزينها نص عادي
  if (req.body.password) {
    delete req.body.password;
  }
  const user = await userModel.findByIdAndUpdate(req.params.id, req.body, {new: true,runValidators: true,});
  if (!user) return next (new AppError("No user found with this id", 404));
    res.json(user);
});

export const deleteUser = catchError(async (req, res, next) => {
  const user = await userModel.findByIdAndDelete(req.params.id);
  if (!user) return next (new AppError("No user found with this id", 404));
  res.json({ message: "User deleted successfully" });
});

// All users 
export const getUserProfile = catchError(async (req, res, next) => {
  // ال user الي جي من ال token من صفحةال auth.controller.js اسمها protectedRoutes
  res.json(req.user);
});

export const updateUserprofile = catchError(async (req, res, next) => {
  // منع تحديث كلمة المرور من هنا لضمان التشفير
  if (req.body.password) {
    delete req.body.password;
  }
  const user = await userModel.findByIdAndUpdate(req.user._id, req.body, {new: true,runValidators: true});
  if (user) user.password = undefined;
    res.json(user);
},);

export const DeleteUserprofile = catchError(async (req, res, next) => {
   await userModel.findByIdAndDelete(req.user._id);
  res.json({ message: "User profile deleted successfully" });
},
);

// Search users by name or email (admin only)
export const searchUsers = catchError(async (req, res, next) => {
  // البحث عن القيمة في keyword أو name أو email لزيادة المرونة
  let searchKey = req.query.keyword || req.query.name || req.query.email;

  if (!searchKey) {
    return next(new AppError("Please provide a search keyword", 400));
  }

  // تنظيف الكلمة من علامات التنصيص إذا وجدت (مثل "omar@gmail.com")
  const keyword = searchKey.replace(/['"]+/g, '');

  const users = await userModel.find({
    $or: [
      { name: { $regex: keyword, $options: "i" } }, // Case-insensitive search for name
      { email: { $regex: keyword, $options: "i" } }, // Case-insensitive search for email
    ],
  }).select("-password"); // Exclude password from results for security

  res.status(200).json({ message: "Users retrieved successfully", count: users.length, users });
});

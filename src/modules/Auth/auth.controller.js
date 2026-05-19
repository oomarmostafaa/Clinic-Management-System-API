import userModel from "../../../Databases/models/user.model.js";
import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import catchError from "../../middleware/catchError.js";
import AppError from "../../utils/appError.js";
import crypto from "crypto";
import { sendEmail } from "../../utils/nodemailer.sendEmail.js";

export const signUp = catchError(async (req, res, next) => {
  let user = new userModel(req.body);
  if (await userModel.findOne({ email: user.email })) {
    return next(new AppError("User already exists", 400));
  }
  // سيتم التشفير تلقائياً إذا كان هناك pre-save hook، أو يفضل التشفير هنا كما فعلت
  user.password = await bcrypt.hash(user.password, 8); 
  let addedUser = await user.save();
  addedUser.password = undefined; // إخفاء الباسورد من الرد
  let token = jwt.sign(
    { id: addedUser._id, role: addedUser.role },
    process.env.SECRET_KEY_jwt,
  );
  res
    .status(200)
    .json({ message: "User signed up successfully", user: addedUser, token });
});
export const signIn = catchError(async (req, res, next) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    let isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      let token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.SECRET_KEY_jwt,
      );
      res.status(200).json({ message: "User signed in successfully", token ,user });
    } else {
      next(new AppError("Invalid email or password", 400));
    }
  } else {
    next(new AppError("Invalid email or password", 400));
  }
});
export const forgetPassword = catchError(async (req, res, next) => {
  const email = req.body.email;

  const user = await userModel.findOne({ email });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetLink = `http://localhost:3000/v1/api/auth/reset-password/${token}`;

    await sendEmail(
      user.email,
      "Reset Password",
      `
      <h2>Reset Your Password</h2>
      <p>Click the link below:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 10 minutes</p>
    `,
    );

    res.json({ message: "Reset link sent to email", resetLink });
  } else {
    next(new AppError("User with this email does not exist", 404));
  }
});
export const resetPassword = catchError(async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await userModel.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Invalid or expired token", 400));
  }

  user.password = await bcrypt.hash(newPassword, 8);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
});
export const changePassword = catchError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

const user = await userModel.findById(req.user._id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) {
    return next(new AppError("Old password is incorrect", 400));
  }

  const hashedPassword = await bcrypt.hash(newPassword, 8);

  const updatedUser = await userModel.findByIdAndUpdate(
    req.user._id,
    {
      password: hashedPassword,
      changePasswordAt: Date.now(),
    },
    { new: true },
  );

  res.json({
    message: "Password updated successfully",
    user: updatedUser,
  });
});
export const protectedRoutes = catchError(async (req, res, next) => {
  // 1- token
  let token = req.header("token") || req.headers.authorization?.split(" ")[1];
  if (!token) return next(new AppError("you are not logged in", 401));
  // 2- verify token
  jwt.verify(token, process.env.SECRET_KEY_jwt, async (err, decoded) => {
    if (err) return next(new AppError(err.message, 401));
    let user = await userModel.findById(decoded.id);
    if (!user) return next(new AppError("user not found", 404));
    // 3- check if user exist
    // check when he change the password
    if (user.changePasswordAt) {
      let time = Math.round(user.changePasswordAt.getTime() / 1000);
      if (time > decoded.iat) return next(new AppError("token not valid", 401));
    }
    req.user = user;
    next();
  });
});
export const allowTo = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      next(new AppError("not allowed  (admin only)", 401));
    }
  };
};

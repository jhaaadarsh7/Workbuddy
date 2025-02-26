import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { buildProfile, forgotPassword, loginUser, registerUser, resendEmailVerification, resetPassword, sendOtpToEmail, verifyEmail, verifyOtp } from "../config/controller/authcontroller.js";
import { authLimiter, emailLimiter } from "../Utils/rateLimiter.js";
import { authorizedRoles, isAuthenticated } from "../middleware/authMiddleWare.js";

const router = express.Router();

router.post("/register", upload.single("profilePicture"), registerUser);
router.post("/verify-email", emailLimiter, verifyEmail); // Added rate limiter for email verification
router.post("/login", authLimiter, loginUser);
router.post("/forgotpassword", authLimiter, forgotPassword); // Optionally add limiter here as well
router.put("/resetPassword", authLimiter, resetPassword);
router.post("/resend-email-verification", authLimiter, resendEmailVerification); // Optionally add limiter here
router.post("/send-otp", authLimiter, sendOtpToEmail); // Apply rate limiter for OTP requests
router.post("/verify-otp", authLimiter, verifyOtp); // Apply rate limiter for OTP verification
router.put("/buildprofile",isAuthenticated,authorizedRoles("service-provider"),buildProfile)

export default router;

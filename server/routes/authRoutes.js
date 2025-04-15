import express from "express";
import { register, Login, Logout, verifyEmail, resendOtp, resetPassword } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-otp", resendOtp);
authRouter.post("/reset-password", resetPassword);

export default authRouter;
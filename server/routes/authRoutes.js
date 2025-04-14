import express from 'express';
import { Login, Logout, register, sendVerifyOtp, verifyEmail } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';

const authRouter = express.Router();

// Authentication routes
authRouter.post('/register', register);
authRouter.post('/login', Login);
authRouter.post('/logout', Logout);

// OTP and account verification routes
authRouter.post('/send-verify-otp', sendVerifyOtp); // Removed userAuth middleware
authRouter.post('/verify-account', verifyEmail); // Removed userAuth middleware

export default authRouter;
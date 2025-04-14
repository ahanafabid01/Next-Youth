import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";
import validator from "validator"; // Added for validation
dotenv.config();
import transporter from "../config/nodemailer.js";

// Reusable cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Registration Function
export const register = async (req, res) => {
    console.log("Request Body:", req.body);
    const { name, email, password } = req.body;

    // Validate input fields
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (user) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await userModel.create({
            name,
            email,
            password: hashedPassword,
        });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("token", token, cookieOptions);

        // Send verification email
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to Next Youth",
            text: `Hello ${name},\n\nWelcome to Next Youth! We're glad to have you on board.\n\nBest regards,\nThe Next Youth Team`,
        };

        
        await transporter.sendMail(mailOptions);
        console.log("Verification email sent successfully");

        return res.status(201).json({ success: true, message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Login Function
export const Login = async (req, res) => {
    console.log("Request Body:", req.body);
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("token", token, cookieOptions);

        return res.status(200).json({ success: true, message: "Login successful", user });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Logout Function
export const Logout = async (req, res) => {
    console.log("Request Body:", req.body);
    try {
        res.clearCookie("token", cookieOptions);
        return res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Verify Function

export const sendVerifyOtp = async (req, res) => {
    console.log("Request Body:", req.body);
    const { userId } = req.body;

    // Validate input fields
    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.isverified) {
            return res.status(400).json({ success: false, message: "Account already verified" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        user.verifyOtp = otp;
        user.VerifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            text: `Your OTP for account verification is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Verification OTP sent successfully");
        res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const verifyEmail = async (req, res) => {
    console.log("Request Body:", req.body);
    const { userId, otp } = req.body;

    // Validate input fields
    if (!userId || !otp) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    try {
        const user = await userModel.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user is already verified
        if (user.isverified) {
            return res.status(400).json({ success: false, message: "Account already verified" });
        }

        // Validate OTP
        if (user.verifyOtp !== otp || user.verifyOtp === '') {
            return res.status(400).json({ success: false, message: "Invalid OTP" });
        }

        // Check if OTP is expired
        if (user.verifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "OTP expired" });
        }

        // Mark user as verified and clear OTP
        user.isverified = true;
        user.verifyOtp = ''; // Clear OTP after verification
        user.verifyOtpExpireAt = 0; // Clear OTP expiration time

        await user.save();

        return res.status(200).json({ success: true, message: "Account verified successfully" });

    } catch (error) {
        console.error("Verification error:", error.message || error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

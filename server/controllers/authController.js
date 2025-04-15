import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";
import validator from "validator";
import transporter from "../config/nodemailer.js";

dotenv.config();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Registration Function
export const register = async (req, res) => {
    const { name, email, password, user_type } = req.body;

    // Validate input fields
    if (!name || !email || !password || !user_type) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }
    if (!["employee", "employer"].includes(user_type)) {
        return res.status(400).json({ success: false, message: "Invalid user type" });
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    try {
        // Check if the user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Generate a verification OTP (existing logic)
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

        // Temporarily store user details in memory or a temporary collection
        const tempUser = {
            name,
            email,
            password: await bcrypt.hash(password, 10), // Hash the password
            user_type, // Save the user type
            verifyOtp: otp,
            VerifyOtpExpireAt: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
        };

        // Send verification email (existing logic)
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Verify Your Email",
            text: `Your OTP for email verification is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        // Store temp user in a temporary collection or cache
        global.tempUsers = global.tempUsers || {};
        global.tempUsers[email] = tempUser;

        return res.status(201).json({ success: true, message: "OTP sent to your email. Please verify to complete registration." });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Login Function
export const Login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please provide email and password" });
    }

    try {
        // Check for hardcoded admin credentials
        if (email === "admin@example.com" && password === "admin123") {
            const token = jwt.sign({ user_type: "admin" }, process.env.JWT_SECRET, { expiresIn: "7d" });
            res.cookie("token", token, cookieOptions);
            return res.status(200).json({ success: true, message: "Admin login successful", user_type: "admin" });
        }

        // Check for registered users
        const user = await userModel.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        if (!user.isverified) {
            return res.status(400).json({ success: false, message: "Please verify your email before logging in" });
        }

        const token = jwt.sign({ id: user._id, user_type: user.user_type }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, cookieOptions);

        return res.status(200).json({ success: true, message: "Login successful", user_type: user.user_type });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Logout Function
export const Logout = (req, res) => {
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "none" });
    return res.status(200).json({ success: true, message: "Logged out successfully" });
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
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: "Please provide email and OTP" });
    }

    try {
        // Check if the user exists in the temporary storage
        const tempUser = global.tempUsers?.[email];

        if (!tempUser) {
            return res.status(404).json({ success: false, message: "User not found or OTP expired" });
        }

        // Validate OTP and expiration
        if (tempUser.verifyOtp !== otp || tempUser.VerifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Add the user to the database and set isverified to true
        const newUser = await userModel.create({
            name: tempUser.name,
            email: tempUser.email,
            password: tempUser.password, // Password is already hashed
            user_type: tempUser.user_type, // Save the user type
            isverified: true, // Mark the user as verified
        });

        // Remove the temporary user from memory
        delete global.tempUsers[email];

        return res.status(200).json({ success: true, message: "Email verified successfully. You can now log in." });
    } catch (error) {
        console.error("Verification error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resendVerifyOtp = async (req, res) => {
    console.log("Request Body:", req.body);
    const { email } = req.body;

    // Validate input fields
    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await userModel.findOne({ email });
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
            subject: "Resend Account Verification OTP",
            text: `Your OTP for account verification is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);
        console.log("Resend OTP sent successfully");
        res.status(200).json({ success: true, message: "OTP resent to your email" });
    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const tempUser = global.tempUsers?.[email];

        if (!tempUser) {
            return res.status(404).json({ success: false, message: "User not found or OTP expired" });
        }

        if (tempUser.lastOtpSentAt && Date.now() - tempUser.lastOtpSentAt < 60 * 1000) {
            return res.status(400).json({ success: false, message: "Please wait 1 minute before requesting a new OTP" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a new OTP
        tempUser.verifyOtp = otp;
        tempUser.VerifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        tempUser.lastOtpSentAt = Date.now();

        // Send the new OTP
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Resend OTP",
            text: `Your new OTP is ${otp}. It is valid for 10 minutes.`,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true, message: "OTP resent to your email" });
    } catch (error) {
        console.error("Resend OTP error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // If OTP and newPassword are not provided, send an OTP
        if (!otp && !newPassword) {
            const resetOtp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a reset OTP
            user.verifyOtp = resetOtp;
            user.VerifyOtpExpireAt = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
            await user.save();

            // Send the OTP
            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: "Password Reset OTP",
                text: `Your OTP for password reset is ${resetOtp}. It is valid for 10 minutes.`,
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({ success: true, message: "OTP sent to your email" });
        }

        // If OTP and newPassword are provided, validate and reset the password
        if (!otp || !newPassword) {
            return res.status(400).json({ success: false, message: "Please provide OTP and new password" });
        }

        // Validate OTP and expiration
        if (user.verifyOtp !== otp || user.VerifyOtpExpireAt < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password and clear OTP fields
        user.password = hashedPassword;
        user.verifyOtp = "";
        user.VerifyOtpExpireAt = 0;
        await user.save();

        return res.status(200).json({ success: true, message: "Password reset successfully. You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

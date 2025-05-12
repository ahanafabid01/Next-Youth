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
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict", // Important for cross-domain
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    domain: process.env.NODE_ENV === "production" ? ".vercel.app" : "localhost" // Set domain for production
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

        // Send verification email (updated logic)
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Verify Your Email",
            text: `Your OTP for email verification is ${otp}. It is valid for 10 minutes.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(to right, #f8f9fa, #e9ecef);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #0062cc; margin-bottom: 5px;">Email Verification</h1>
                    <p style="color: #6c757d; font-size: 16px;">Welcome to Next Youth!</p>
                </div>
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <p style="font-size: 16px; color: #343a40; margin-bottom: 20px;">Thank you for registering. Please verify your email address using the OTP below:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h2 style="letter-spacing: 5px; color: #0062cc; margin: 0; font-size: 28px;">${otp}</h2>
                    </div>
                    <p style="font-size: 14px; color: #6c757d;">This OTP is valid for 10 minutes only. If you didn't create an account, please ignore this email.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                </div>
            </div>
            `
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
    res.clearCookie("token", {
        httpOnly: true,
        secure: false, // ONLY FOR LOCAL DEVELOPMENT
        sameSite: "strict", // Or "lax"
    });
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
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(to right, #f8f9fa, #e9ecef);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #0062cc; margin-bottom: 5px;">Email Verification</h1>
                    <p style="color: #6c757d; font-size: 16px;">Your verification code has been resent</p>
                </div>
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <p style="font-size: 16px; color: #343a40; margin-bottom: 20px;">You requested a new verification code. Please use the OTP below to verify your email:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h2 style="letter-spacing: 5px; color: #0062cc; margin: 0; font-size: 28px;">${otp}</h2>
                    </div>
                    <p style="font-size: 14px; color: #6c757d;">This OTP is valid for 10 minutes only.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                </div>
            </div>
            `
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
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(to right, #f8f9fa, #e9ecef);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #0062cc; margin-bottom: 5px;">New Verification Code</h1>
                    <p style="color: #6c757d; font-size: 16px;">Your requested OTP</p>
                </div>
                <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <p style="font-size: 16px; color: #343a40; margin-bottom: 20px;">As requested, here is your new verification code:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                        <h2 style="letter-spacing: 5px; color: #0062cc; margin: 0; font-size: 28px;">${otp}</h2>
                    </div>
                    <p style="font-size: 14px; color: #6c757d;">This OTP is valid for 10 minutes only.</p>
                </div>
                <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                    <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                </div>
            </div>
            `
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
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(to right, #f8f9fa, #e9ecef);">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #0062cc; margin-bottom: 5px;">Password Reset</h1>
                        <p style="color: #6c757d; font-size: 16px;">Your security is important to us</p>
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; color: #343a40; margin-bottom: 20px;">We received a request to reset your password. Please use the OTP below to complete the process:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                            <h2 style="letter-spacing: 5px; color: #0062cc; margin: 0; font-size: 28px;">${resetOtp}</h2>
                        </div>
                        <p style="font-size: 14px; color: #6c757d;">This OTP is valid for 10 minutes only. If you didn't request this password reset, please ignore this email.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                        <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                    </div>
                </div>
                `
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

export const getUserProfile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select(
            "name email user_type profilePicture dateOfBirth linkedInId otherInfo"
        );
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        console.log("Request Body:", req.body); // Debugging line
        console.log("User ID:", req.user.id); // Debugging line

        const { name, email, profilePicture, dateOfBirth, linkedInId, otherInfo } = req.body;

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            { name, email, profilePicture, dateOfBirth, linkedInId, otherInfo },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const verifyIdentity = async (req, res) => {
    try {
        // Get the user from the database with verification information
        const user = await userModel.findById(req.user.id);
        
        // Only check if verification exists AND has both images AND status is pending or verified
        if (user.idVerification && 
            user.idVerification.frontImage && 
            user.idVerification.backImage && 
            (user.idVerification.status === 'pending' || user.idVerification.status === 'verified')) {
            return res.status(400).json({
                success: false,
                message: user.idVerification.status === 'pending'
                    ? "Your ID verification is already submitted and pending review. Please wait for our team to complete the verification process."
                    : "Your ID is already verified. No need to submit again."
            });
        }

        // Check if files exist in the request
        if (!req.files || !req.files.frontImage || !req.files.backImage) {
            return res.status(400).json({
                success: false,
                message: "Please upload both front and back images of your ID"
            });
        }

        const frontImagePath = req.files.frontImage[0].path;
        const backImagePath = req.files.backImage[0].path;

        // Convert local file path to URL
        const frontImageUrl = `${req.protocol}://${req.get("host")}/${frontImagePath.replace(/\\/g, '/')}`;
        const backImageUrl = `${req.protocol}://${req.get("host")}/${backImagePath.replace(/\\/g, '/')}`;

        // Update user's verification status in the database
        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            {
                idVerification: {
                    frontImage: frontImageUrl,
                    backImage: backImageUrl,
                    status: 'pending',
                    submittedAt: new Date()
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "ID verification submitted successfully. Our team will review it shortly."
        });
    } catch (error) {
        console.error("Error in ID verification:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getVerificationStatus = async (req, res) => {
    try {
        const user = await userModel.findById(req.user.id).select('idVerification');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            verification: user.idVerification || null
        });
    } catch (error) {
        console.error("Error fetching verification status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getEmployeeProfile = async (req, res) => {
    try {
        // Find user with complete profile information
        const user = await userModel.findById(req.user.id).select(
            "name bio profilePicture education skills languageSkills address country phoneNumber " +
            "email linkedInProfile socialMediaLink goals questions resume " +
            // Add these fields to include price preferences
            "freelanceExperience paymentType fixedRate hourlyRate weeklyAvailability openToContractToHire"
        );

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            profile: user 
        });
    } catch (error) {
        console.error("Error fetching employee profile:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

export const updateEmployeeProfile = async (req, res) => {
    try {
        // Use req.user.id instead of req.userId since that's how your auth middleware populates it
        const userId = req.user.id;
        
        // Extract all the fields from req.body
        const {
          name, bio, education, skills, languageSkills, address, country,
          phoneNumber, email, linkedInProfile, socialMediaLink, goals,
          questions, resumeUrl, freelanceExperience, paymentType,
          fixedRate, hourlyRate, weeklyAvailability, openToContractToHire,
          profilePicture, profilePic  // ADD THESE TWO FIELDS
        } = req.body;
        
        // Create update object with all possible fields
        const updateObject = {};
        
        // Add each field to the update object if it exists in the request
        if (name) updateObject.name = name;
        if (bio !== undefined) updateObject.bio = bio;
        if (education) updateObject.education = education;
        if (skills) updateObject.skills = skills;
        if (languageSkills) updateObject.languageSkills = languageSkills;
        if (address !== undefined) updateObject.address = address;
        if (country !== undefined) updateObject.country = country;
        if (phoneNumber !== undefined) updateObject.phoneNumber = phoneNumber;
        if (email) updateObject.email = email;
        if (linkedInProfile !== undefined) updateObject.linkedInProfile = linkedInProfile;
        if (socialMediaLink !== undefined) updateObject.socialMediaLink = socialMediaLink;
        if (goals !== undefined) updateObject.goals = goals;
        if (questions) updateObject.questions = questions;
        if (resumeUrl) updateObject.resume = resumeUrl;
        
        // ADD THESE LINES FOR PROFILE PICTURE
        if (profilePicture) updateObject.profilePicture = profilePicture;
        if (profilePic) updateObject.profilePic = profilePic;
        // If only one is provided, use it for both fields for consistency
        if (profilePicture && !profilePic) updateObject.profilePic = profilePicture;
        if (!profilePicture && profilePic) updateObject.profilePicture = profilePic;
        
        // Add price preference fields
        if (freelanceExperience !== undefined) updateObject.freelanceExperience = freelanceExperience;
        if (paymentType !== undefined) updateObject.paymentType = paymentType;
        if (fixedRate !== undefined) updateObject.fixedRate = fixedRate;
        if (hourlyRate !== undefined) updateObject.hourlyRate = hourlyRate;
        if (weeklyAvailability !== undefined) updateObject.weeklyAvailability = weeklyAvailability;
        if (openToContractToHire !== undefined) updateObject.openToContractToHire = openToContractToHire;
        
        // Update the user with userModel and the correct userId
        const updatedUser = await userModel.findByIdAndUpdate(userId, updateObject, { new: true });
        
        if (!updatedUser) {
          return res.status(404).json({ success: false, message: "User not found" });
        }
        
        res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          user: updatedUser
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ success: false, message: "Server error" });
      }
};

export const getAllUsers = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized. Only admin can access this resource." 
            });
        }
        
        // Find all users and select relevant fields
        const users = await userModel.find({})
            .select('name email phoneNumber user_type idVerification');
        
        console.log(`Retrieved ${users.length} users`); // Add logging for debugging
        
        return res.status(200).json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const verifyUserIdentity = async (req, res) => {
    try {
        const { userId, status, notes } = req.body;
        
        // Validate required fields
        if (!userId || !status) {
            return res.status(400).json({
                success: false,
                message: "User ID and verification status are required"
            });
        }
        
        // Check if status is valid
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification status"
            });
        }
        
        // Make sure the requester is an admin
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to perform this action"
            });
        }
        
        // Update the user's verification status
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            {
                'idVerification.status': status,
                'idVerification.notes': notes,
                'idVerification.verifiedAt': status === 'verified' ? new Date() : null
            },
            { new: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            message: `User verification ${status === 'verified' ? 'approved' : 'rejected'} successfully`
        });
    } catch (error) {
        console.error("Error updating verification status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        // For admin users, we only need to check the user_type
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ success: false, message: "Forbidden: Only admins can delete users." });
        }

        const { id } = req.params; // User ID to delete

        const userToDelete = await userModel.findById(id);
        if (!userToDelete) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        // Delete the user
        await userModel.findByIdAndDelete(id);

        return res.status(200).json({ success: true, message: "User deleted successfully." });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ success: false, message: "Internal server error during user deletion." });
    }
};

// Update the getUserProfileById function to populate ratings
export const getUserProfileById = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user and populate their ratings with job and employer information
        const user = await userModel.findById(userId)
            .select(
                "name email profilePicture bio country skills education languageSkills " + 
                "linkedInProfile resume socialMediaLink goals ratings " + 
                "freelanceExperience paymentType hourlyRate weeklyAvailability idVerification"
            )
            .populate({
                path: 'ratings.job',
                select: 'title scope budgetType fixedAmount hourlyFrom hourlyTo skills',
                model: 'job'
            })
            .populate({
                path: 'ratings.employer',
                select: 'name',
                model: 'user'
            });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        return res.status(200).json({ 
            success: true, 
            profile: user 
        });
    } catch (error) {
        console.error("Error fetching user profile by ID:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error" 
        });
    }
};

// Add this new controller function

export const getMyRatings = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await userModel.findById(userId)
            .populate({
                path: 'ratings.job',
                select: 'title scope budgetType fixedAmount hourlyFrom hourlyTo skills',
                model: 'job'
            })
            .populate({
                path: 'ratings.employer',
                select: 'name',
                model: 'user'
            });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Sort ratings by date, most recent first
        const sortedRatings = user.ratings.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        return res.status(200).json({
            success: true,
            ratings: sortedRatings
        });

    } catch (error) {
        console.error("Error fetching user ratings:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching ratings"
        });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Find user by ID
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password in database
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Add this new controller function
export const deleteMyAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        // Find the user
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"
            });
        }

        // Delete the user's account
        await userModel.findByIdAndDelete(userId);

        // Additionally, you might want to delete related data
        // such as job postings, applications, etc.

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
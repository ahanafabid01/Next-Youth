import express from "express";
import { register, Login, Logout, verifyEmail, resendOtp, resetPassword, getUserProfile, updateUserProfile, verifyIdentity,
    getVerificationStatus } from "../controllers/authController.js";
import userAuth from "../middleware/userAuth.js"; // Import userAuth middleware
import upload from "../middleware/uploadMiddleware.js"; // Import upload middleware

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", Login);
authRouter.post("/logout", Logout);
authRouter.post("/verify-email", verifyEmail);
authRouter.post("/resend-otp", resendOtp);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", userAuth, getUserProfile); // Use userAuth middleware here
authRouter.put("/profile", userAuth, updateUserProfile); // Add this route


// ID verification routes
authRouter.post(
    '/verify-identity', 
    userAuth, 
    upload.fields([
        { name: 'frontImage', maxCount: 1 }, 
        { name: 'backImage', maxCount: 1 }
    ]), 
    verifyIdentity
);
authRouter.get('/verification-status', userAuth, getVerificationStatus);

authRouter.post("/upload-profile-picture", userAuth, upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        res.status(200).json({ success: true, url: fileUrl });
    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

authRouter.put('/update-profile', userAuth, updateUserProfile); // Add this route

export default authRouter;
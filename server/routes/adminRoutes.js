import express from "express";
import multer from "multer";
import { sendMassEmail } from "../controllers/adminEmailController.js";
import userAuth from "../middleware/userAuth.js";
import transporter from "../config/nodemailer.js"; // Add this import for test route

const router = express.Router();

// Use memory storage for attachments
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Apply file upload middleware
router.post(
  "/send-mass-email",
  userAuth,
  upload.fields([
    { name: 'attachments', maxCount: 5 },
    { name: 'photos', maxCount: 5 }
  ]),
  sendMassEmail
);

// Test route to verify email functionality
router.post("/test-email", userAuth, async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "Test email address is required" 
      });
    }
    
    const info = await transporter.sendMail({
      from: `"Next Youth Test" <${process.env.SENDER_EMAIL}>`,
      to: testEmail,
      subject: "Test Email from Next Youth",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #3b82f6;">Email System Test</h2>
          <p>This is a test email from Next Youth platform.</p>
          <p>If you received this, the email system is working correctly!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Test email sent successfully",
      messageId: info.messageId 
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to send test email: ${error.message}` 
    });
  }
});

export default router;
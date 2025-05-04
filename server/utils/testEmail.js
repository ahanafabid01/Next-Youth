import transporter from "../config/nodemailer.js";
import dotenv from "dotenv";
dotenv.config();

const testEmail = async () => {
  try {
    // First verify the connection
    await transporter.verify();
    console.log("SMTP connection verified successfully");
    
    // Then try to send a test email
    const info = await transporter.sendMail({
      from: `"Next Youth Test" <${process.env.SENDER_EMAIL}>`,
      to: process.env.SENDER_EMAIL, // Send to yourself for testing
      subject: "SMTP Test Email",
      text: "If you receive this email, your SMTP configuration is working correctly.",
      html: "<p>If you receive this email, your SMTP configuration is working correctly.</p>"
    });
    
    console.log("Test email sent successfully:", info.messageId);
  } catch (error) {
    console.error("SMTP test failed:", error);
  }
};

// Run the test
testEmail();
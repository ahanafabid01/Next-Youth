import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendMassEmail = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Only admin can send mass emails." 
      });
    }

    const { subject, textContent, recipientType } = req.body;
    
    if (!subject || !textContent) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject and email content are required" 
      });
    }

    // Get recipient emails based on filter
    const filter = {};
    if (recipientType === 'active') {
      filter['idVerification.status'] = 'verified';
    } else if (recipientType === 'inactive') {
      filter['$or'] = [
        { 'idVerification.status': { $ne: 'verified' } },
        { 'idVerification': { $exists: false } }
      ];
    }

    const recipients = await userModel.find(filter).select('email name');
    
    if (!recipients.length) {
      return res.status(404).json({ 
        success: false, 
        message: "No recipients found matching the selected criteria" 
      });
    }

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Handle file attachments
    let attachments = [];
    
    // Add regular attachments
    if (req.files && req.files.attachments) {
      attachments = req.files.attachments.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }));
    }
    
    // Add photos (inline images)
    let htmlContent = textContent;
    if (req.files && req.files.photos) {
      const photos = req.files.photos;
      photos.forEach((photo, index) => {
        const cid = `photo${index}`;
        attachments.push({
          filename: photo.originalname,
          content: photo.buffer,
          cid: cid
        });
        htmlContent += `<br><img src="cid:${cid}" style="max-width:100%; margin:10px 0;">`;
      });
    }

    // Format HTML content with line breaks
    htmlContent = htmlContent.replace(/\n/g, '<br>');
    htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #3b82f6;">${subject}</h2>
        <div style="line-height: 1.6;">${htmlContent}</div>
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
          <p>This is an automated message from Next Youth. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send emails in batches of 10 to avoid rate limits
    const batchSize = 10;
    let successCount = 0;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const emailPromises = batch.map(recipient => {
        return transporter.sendMail({
          from: `"Next Youth" <${process.env.SENDER_EMAIL}>`,
          to: recipient.email,
          subject: subject,
          html: htmlContent,
          attachments: attachments
        });
      });
      
      const results = await Promise.allSettled(emailPromises);
      successCount += results.filter(result => result.status === "fulfilled").length;
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return res.status(200).json({
      success: true,
      message: `Emails sent successfully to ${successCount} out of ${recipients.length} recipients`,
      recipientCount: successCount
    });
    
  } catch (error) {
    console.error("Mass email sending error:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to send emails: ${error.message}`
    });
  }
};
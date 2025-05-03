import transporter from "../config/nodemailer.js";
import userModel from "../models/userModel.js";

export const sendMassEmail = async (req, res) => {
  try {
    const { subject, htmlContent, recipientType } = req.body;
    
    if (!subject || !htmlContent) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject and email content are required" 
      });
    }
    
    // Build query for finding users based on recipientType
    let query = {};
    if (recipientType === 'active') {
      query.isActive = true;
    } else if (recipientType === 'inactive') {
      query.isActive = false;
    }
    
    // Get all users or filtered users
    const users = await userModel.find(query).select('email name');
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No recipients found matching your criteria" 
      });
    }
    
    // Create email template with header/footer
    const createEmailContent = (userName) => {
      return `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
            <h1 style="color: #3b82f6; margin-bottom: 5px;">Next Youth</h1>
          </div>
          
          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #333;">Hello ${userName || 'there'},</p>
            
            <div style="margin: 20px 0;">
              ${htmlContent}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
          </div>
        </div>
      `;
    };
    
    // Counter for successful emails
    let successCount = 0;
    
    // Send email to each user
    for (const user of users) {
      try {
        await transporter.sendMail({
          from: `"Next Youth" <${process.env.SENDER_EMAIL}>`,
          to: user.email,
          subject: subject,
          html: createEmailContent(user.name),
        });
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError);
        // Continue with next user even if one email fails
      }
    }
    
    // If at least some emails were sent, consider it a success
    if (successCount > 0) {
      res.status(200).json({ 
        success: true, 
        message: `Successfully sent ${successCount} out of ${users.length} emails`, 
        recipientCount: successCount 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: "Failed to send any emails. Please check your email configuration." 
      });
    }
    
  } catch (error) {
    console.error('Error in send-mass-email:', error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send emails. Server error." 
    });
  }
};
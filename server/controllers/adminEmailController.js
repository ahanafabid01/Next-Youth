import transporter from "../config/nodemailer.js";
import userModel from "../models/userModel.js"; // Consistent import name
import EmailHistory from '../models/emailHistoryModel.js';

export const sendMassEmail = async (req, res) => {
  try {
    // Get data from request body
    const { subject, textContent, recipientType } = req.body;
    
    if (!subject || !textContent) {
      return res.status(400).json({ 
        success: false, 
        message: "Subject and email content are required" 
      });
    }
    
    console.log("Processing email request:", { subject, recipientType });
    
    // Build query for finding users based on recipientType
    let query = {};
    if (recipientType === 'active') {
      query.isverified = true;
    } else if (recipientType === 'inactive') {
      query.isverified = false;
    }
    
    // Get all users or filtered users - using consistent model name
    const users = await userModel.find(query).select('email name');
    console.log(`Found ${users.length} recipient users`);
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "No recipients found matching your criteria" 
      });
    }
    
    // Log first few recipients for debugging
    const sampleUsers = users.slice(0, 3).map(u => ({ name: u.name, email: u.email }));
    console.log(`Sample recipients: ${JSON.stringify(sampleUsers)}`);
    
    // Process attachments if any
    const attachments = [];
    const attachmentCids = [];
    if (req.files) {
      // Process regular attachments
      if (req.files.attachments) {
        req.files.attachments.forEach(file => {
          attachments.push({
            filename: file.originalname || file.filename,
            content: file.buffer,
            contentType: file.mimetype
          });
        });
      }
      
      // Process image attachments
      if (req.files.photos) {
        req.files.photos.forEach(file => {
          const cid = `image-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          attachments.push({
            filename: file.originalname || file.filename,
            content: file.buffer,
            contentType: file.mimetype,
            cid: cid
          });
          attachmentCids.push(cid);
        });
      }
    }
    
    // Define the email template function with improved design
    const createEmailContent = (userName, attachmentCids = []) => {
      // Base64 encoded Next Youth dark logo
      const logoBase64 = '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';
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
            <!-- Header with Next Youth logo -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); border-bottom: 3px solid #3b82f6;">
                <img src="data:image/png;base64,${logoBase64}" alt="Next Youth" style="max-height: 60px; width: auto; margin-bottom: 10px;">
                <h1 style="font-size: 24px; color: #1e40af; margin: 10px 0 0; letter-spacing: 1px; font-weight: 700;">NEXT YOUTH</h1>
              </td>
            </tr>
            
            <!-- Email content -->
            <tr>
              <td style="padding: 40px 30px;">
                <!-- Greeting with blue color as requested -->
                <p style="margin-top: 0; font-size: 18px; color: #3a86ff; font-weight: 500;">Hello ${userName || 'there'},</p>
                
                <!-- Email subject as a heading -->
                <h2 style="color: #1e40af; margin: 25px 0 20px; font-size: 22px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">${subject}</h2>
                
                <!-- Email content with improved spacing and readability -->
                <div style="font-size: 16px; line-height: 1.7; color: #4b5563; margin: 25px 0;">
                  ${textContent.split('\n').map(line => 
                    `<p style="margin-bottom: 16px;">${line || '<br>'}</p>`
                  ).join('')}
                </div>
                
                <!-- Inline images -->
                ${attachmentCids.map(cid => 
                  `<img src="cid:${cid}" alt="Image" style="max-width: 100%; height: auto; margin: 20px 0;">`
                ).join('')}
                
                <!-- Signature area with divider -->
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-size: 16px;">Best regards,</p>
                  <p style="margin: 5px 0 0; font-weight: 600; color: #3b82f6; font-size: 16px;">Next Youth Team</p>
                </div>
              </td>
            </tr>
            
            <!-- Footer with the tagline -->
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                <p style="color: #3b82f6; font-size: 14px; margin: 0; font-style: italic; font-weight: 500;">Find Your First Job. Build Your Best Future.</p>
              </td>
            </tr>
          </table>
          
          <!-- Space at the bottom for better viewing -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="height: 30px;"></td>
            </tr>
          </table>
        </body>
        </html>
      `;
    };
    
    // Send emails in batches to avoid rate limits
    let successCount = 0;
    let failedEmails = [];
    
    // Smaller batch size with delay to prevent overwhelming SMTP server
    const batchSize = 5; // Reduced batch size for better reliability
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} users`);
      
      // Use Promise.allSettled to continue even if some emails fail
      const results = await Promise.allSettled(
        batch.map(async (user) => {
          if (!user.email) {
            console.warn(`User ${user._id} has no email address`);
            return { status: 'failed', reason: 'No email address' };
          }
          
          try {
            // Create the email HTML using the recipient's name
            const emailHtml = createEmailContent(user.name, attachmentCids);
            
            const mailOptions = {
              from: `"Next Youth" <${process.env.SENDER_EMAIL}>`,
              to: user.email,
              subject: subject,
              html: emailHtml,
              attachments: attachments.length > 0 ? attachments : undefined
            };
            
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${user.email}: ${info.messageId}`);
            return { status: 'fulfilled', messageId: info.messageId };
          } catch (error) {
            console.error(`Failed to send email to ${user.email}:`, error);
            failedEmails.push(user.email);
            return { status: 'failed', reason: error.message };
          }
        })
      );
      
      // Count successful emails
      successCount += results.filter(r => r.status === 'fulfilled').length;
      
      // Add delay between batches
      if (i + batchSize < users.length) {
        console.log("Pausing before next batch...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Email sending complete: ${successCount} successful, ${failedEmails.length} failed`);
    
    // Save email history record
    const emailHistory = new EmailHistory({
      subject,
      textContent,
      recipientType: recipientType,
      recipientCount: users.length,
      attachmentCount: attachments.length || 0,
      sentAt: new Date(),
      sentBy: req.admin?._id, // If you track which admin sent it
      status: failedEmails.length > 0 ? (failedEmails.length === users.length ? 'failed' : 'partial') : 'success',
      failedCount: failedEmails.length
    });

    await emailHistory.save();

    if (successCount > 0) {
      return res.status(200).json({ 
        success: true, 
        message: `Successfully sent ${successCount} out of ${users.length} emails`, 
        recipientCount: successCount,
        failedCount: failedEmails.length,
        failedEmails: failedEmails.length > 0 ? failedEmails : []
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to send any emails. See server logs for details."
      });
    }
    
  } catch (error) {
    console.error('Error in send-mass-email:', error);
    return res.status(500).json({ 
      success: false, 
      message: `Server error: ${error.message}`
    });
  }
};
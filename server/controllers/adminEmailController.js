import transporter from "../config/nodemailer.js";
import userModel from "../models/userModel.js"; // Consistent import name

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
          attachments.push({
            filename: file.originalname || file.filename,
            content: file.buffer,
            contentType: file.mimetype,
            cid: `image-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
          });
        });
      }
    }
    
    // Create HTML email content with better styling and prominent Next Youth header
    const createEmailContent = (userName) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header with Next Youth prominently displayed -->
            <tr>
              <td style="padding: 30px 0; text-align: center; background-color: #f8fafc; border-bottom: 3px solid #3b82f6;">
                <h1 style="font-size: 32px; color: #3b82f6; margin: 0; letter-spacing: 1px; font-weight: 700;">NEXT YOUTH</h1>
              </td>
            </tr>
            
            <!-- Email content -->
            <tr>
              <td style="padding: 30px 25px;">
                <p style="margin-top: 0; font-size: 17px;">Hello ${userName || 'there'},</p>
                
                <div style="font-size: 16px; line-height: 1.6; color: #4b5563; margin: 25px 0;">
                  ${textContent.split('\n').map(line => 
                    `<p style="margin-bottom: 16px;">${line || '<br>'}</p>`
                  ).join('')}
                </div>
                
                <p style="margin-top: 30px; margin-bottom: 10px; font-size: 16px;">Best regards,</p>
                <p style="margin-top: 0; font-weight: 600; color: #3b82f6; font-size: 16px;">Next Youth Team</p>
              </td>
            </tr>
            
            <!-- Footer with the new text -->
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                <p style="color: #6b7280; font-size: 14px; margin: 8px 0; font-style: italic; font-weight: 500;">Find Your First Job. Build Your Best Future.</p>
              </td>
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
            const mailOptions = {
              from: `"Next Youth" <${process.env.SENDER_EMAIL}>`,
              to: user.email,
              subject: subject,
              html: createEmailContent(user.name),
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
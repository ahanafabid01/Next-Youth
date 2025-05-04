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
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            .header-title {
              font-size: 32px;
              font-weight: bold;
              color: #3b82f6;
              text-align: center;
              margin: 0;
              padding: 15px 0;
              letter-spacing: 1px;
              text-transform: uppercase;
            }
          </style>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <!-- Next Youth header at the top middle -->
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #e0e0e0; margin-bottom: 20px;">
            <h1 class="header-title">Next Youth</h1>
          </div>
          
          <div style="padding: 20px; background-color: #ffffff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <p style="margin-top: 0;">Hello ${userName || 'there'},</p>
            
            ${textContent.split('\n').map(line => 
              `<p style="margin-bottom: 16px;">${line || '<br>'}</p>`
            ).join('')}
            
            <p style="margin-bottom: 0;">Best regards,<br>Next Youth Team</p>
          </div>
          
          <div style="text-align: center; padding-top: 20px; font-size: 12px; color: #6c757d;">
            <p>© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
            <p>Find Your First Job. Build Your Best Future.</p>
          </div>
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
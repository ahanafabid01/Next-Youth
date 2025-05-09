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
    
    // Create HTML email content with professional design
    const createEmailContent = (userName) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body, table, td, a { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; }
          </style>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #334155; background-color: #f8fafc;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <!-- Modern Header with Logo -->
            <tr>
              <td style="padding: 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;">
                  <tr>
                    <td style="background: linear-gradient(90deg, #3a86ff, #4cc9f0); padding: 28px 24px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 1px; font-weight: 700; text-transform: uppercase;">
                        <span style="color: #ffffff; display: block; text-shadow: 0 2px 4px rgba(0,0,0,0.15);">NEXT YOUTH</span>
                        <span style="font-size: 14px; font-weight: 500; letter-spacing: 3px; margin-top: 5px; display: block; opacity: 0.9; text-transform: none;">Career Development Platform</span>
                      </h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Content Area with Modern Design -->
            <tr>
              <td style="padding: 40px 35px;">
                <!-- Greeting -->
                <p style="margin-top: 0; font-size: 18px; font-weight: 500; color: #1e293b;">Hello ${userName || 'there'},</p>
                
                <!-- Main Content -->
                <div style="font-size: 16px; line-height: 1.7; color: #4b5563; margin: 25px 0; background: #ffffff; padding: 5px 0;">
                  ${textContent.split('\n').map(line => 
                    `<p style="margin-bottom: 16px;">${line || '<br>'}</p>`
                  ).join('')}
                </div>
                
                <!-- Signature -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 20px; width: 100%;">
                  <tr>
                    <td>
                      <p style="margin: 0; font-size: 16px;">Best regards,</p>
                      <p style="margin: 10px 0 0; font-weight: 600; color: #3a86ff; font-size: 18px;">Next Youth Team</p>
                      <p style="margin: 5px 0 0; color: #64748b; font-size: 14px;">Empowering the next generation of professionals</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Call to Action Section -->
            <tr>
              <td style="padding: 0 35px 30px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-radius: 8px; overflow: hidden;">
                  <tr>
                    <td style="background-color: #f1f5f9; padding: 25px; text-align: center;">
                      <h3 style="margin: 0 0 15px; color: #1e293b; font-size: 18px; font-weight: 600;">Ready to take the next step in your career?</h3>
                      <a href="https://nextyouth.com/opportunities" style="display: inline-block; background: linear-gradient(90deg, #3a86ff, #4cc9f0); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 500; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15); transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; font-size: 14px;">Explore Opportunities</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            
            <!-- Modern Footer -->
            <tr>
              <td style="padding: 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0; padding: 0;">
                  <tr>
                    <td style="background-color: #1e293b; padding: 30px; text-align: center;">
                      <!-- Logo or Text -->
                      <p style="color: #e2e8f0; font-size: 18px; margin: 0 0 15px; font-weight: 600; letter-spacing: 1px;">NEXT YOUTH</p>
                      
                      <!-- Tagline -->
                      <p style="color: #e2e8f0; font-size: 14px; margin: 0 0 20px; font-style: italic; font-weight: 400;">Find Your First Job. Build Your Best Future.</p>
                      
                      <!-- Social Media Icons with better styling -->
                      <div style="margin: 25px 0 20px;">
                        <a href="https://facebook.com/nextyouth" style="display: inline-block; margin: 0 8px; text-decoration: none; background-color: #ffffff; border-radius: 50%; width: 36px; height: 36px; text-align: center; padding-top: 5px; box-sizing: border-box;">
                          <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Facebook_colored_svg_copy-512.png" width="24" height="24" alt="Facebook" style="border: 0;">
                        </a>
                        <a href="https://twitter.com/nextyouth" style="display: inline-block; margin: 0 8px; text-decoration: none; background-color: #ffffff; border-radius: 50%; width: 36px; height: 36px; text-align: center; padding-top: 5px; box-sizing: border-box;">
                          <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Twitter_colored_svg-512.png" width="24" height="24" alt="Twitter" style="border: 0;">
                        </a>
                        <a href="https://linkedin.com/company/nextyouth" style="display: inline-block; margin: 0 8px; text-decoration: none; background-color: #ffffff; border-radius: 50%; width: 36px; height: 36px; text-align: center; padding-top: 5px; box-sizing: border-box;">
                          <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Linkedin_unofficial_colored_svg-512.png" width="24" height="24" alt="LinkedIn" style="border: 0;">
                        </a>
                        <a href="https://instagram.com/nextyouth" style="display: inline-block; margin: 0 8px; text-decoration: none; background-color: #ffffff; border-radius: 50%; width: 36px; height: 36px; text-align: center; padding-top: 5px; box-sizing: border-box;">
                          <img src="https://cdn2.iconfinder.com/data/icons/social-media-2285/512/1_Instagram_colored_svg_1-512.png" width="24" height="24" alt="Instagram" style="border: 0;">
                        </a>
                      </div>
                      
                      <!-- Copyright and Unsubscribe -->
                      <p style="color: #cbd5e1; font-size: 13px; margin: 20px 0 5px; font-weight: 400;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                      
                      <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
                        If you'd prefer not to receive these emails, you can <a href="https://nextyouth.com/unsubscribe?email=${user.email}" style="color: #60a5fa; text-decoration: none; font-weight: 500;">unsubscribe here</a>.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <!-- Spacing at the bottom -->
          <div style="height: 30px;"></div>
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
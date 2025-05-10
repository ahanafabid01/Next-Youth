const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const Job = require('../models/jobModel');
const nodemailer = require('nodemailer'); // Make sure to install this: npm install nodemailer

// GET /api/notifications/recipient-counts - Get count of users for notification options
router.get('/recipient-counts', protect, admin, async (req, res) => {
  try {
    const { jobId } = req.query;
    
    // Get total users count
    const allUsersCount = await User.countDocuments();
    
    // Get verified users count
    const verifiedUsersCount = await User.countDocuments({ isVerified: true });
    
    // For users with matching skills, check the job skills
    let matchingSkillsCount = 0;
    
    if (jobId) {
      const job = await Job.findById(jobId);
      
      if (job && job.skills && job.skills.length > 0) {
        matchingSkillsCount = await User.countDocuments({ 
          skills: { $in: job.skills } 
        });
      }
    }
    
    res.json({
      success: true,
      counts: {
        allUsers: allUsersCount,
        verifiedUsers: verifiedUsersCount,
        matchingSkills: matchingSkillsCount
      }
    });
  } catch (err) {
    console.error('Error fetching recipient counts:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve recipient counts'
    });
  }
});

// GET /api/notifications/notification-recipients - Get list of recipients for notifications
router.get('/notification-recipients', protect, admin, async (req, res) => {
  try {
    // Convert string query params to boolean
    const allUsers = req.query.allUsers === 'true';
    const verifiedUsers = req.query.verifiedUsers === 'true';
    const matchingSkills = req.query.matchingSkills === 'true';
    const jobId = req.query.jobId;
    
    let query = {};
    
    // If verifiedUsers is selected but allUsers is not, only get verified users
    if (verifiedUsers && !allUsers) {
      query.isVerified = true;
    }
    
    // If matching skills is selected, get users with matching job skills
    if (matchingSkills && jobId) {
      const job = await Job.findById(jobId);
      
      if (job && job.skills && job.skills.length > 0) {
        query.skills = { $in: job.skills };
      } else {
        return res.status(400).json({
          success: false,
          message: 'The selected job has no skills specified'
        });
      }
    }
    
    // Find recipients based on query
    const recipients = await User.find(query).select('email name');
    
    return res.json({
      success: true,
      recipients
    });
  } catch (err) {
    console.error('Error fetching notification recipients:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve recipients'
    });
  }
});

// POST /api/notifications/send - Send notifications to selected users
router.post('/send', protect, admin, async (req, res) => {
  try {
    const { recipients, subject, message, jobId, jobTitle } = req.body;
    
    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No recipients specified'
      });
    }
    
    if (!subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Subject and message are required'
      });
    }
    
    // Create a nodemailer transporter (configure for your email service)
    // Example for Gmail:
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    // Prepare email content
    const emailPromises = recipients.map(recipient => {
      // Personalize message by replacing [Recipient] with user name
      let personalizedMessage = message;
      if (recipient.name) {
        personalizedMessage = message.replace("[Recipient]", recipient.name);
      }
      
      return transporter.sendMail({
        from: `"NextYouth" <${process.env.EMAIL_USER}>`,
        to: recipient.email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(90deg, #3a86ff, #4cc9f0); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">NextYouth Platform</h1>
            </div>
            <div style="border: 1px solid #e2e8f0; border-top: none; padding: 20px;">
              ${personalizedMessage.replace(/\n/g, '<br>')}
              <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <p style="color: #64748b; font-size: 14px;">
                  This email was sent to you because you are registered on the NextYouth platform.
                  <br>If you believe this was sent in error, please ignore this email.
                </p>
              </div>
            </div>
          </div>
        `
      });
    });
    
    // Send all emails
    await Promise.all(emailPromises);
    
    // Update activity log or metrics if needed
    
    res.json({
      success: true,
      message: `Successfully sent notifications to ${recipients.length} recipients`
    });
  } catch (err) {
    console.error('Error sending notifications:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notifications'
    });
  }
});

module.exports = router;
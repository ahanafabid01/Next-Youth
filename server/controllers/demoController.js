// controllers/demoController.js

import DemoRequest from '../models/DemoModel.js';
import nodemailer from 'nodemailer';
import { validationResult } from 'express-validator';

class DemoController {
  async requestDemo(req, res) {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { fullName, email, company, phone, businessSize, preferredDate, preferredTime, message, serviceType } = req.body;

    try {
      // Create a new demo request
      const demoRequest = new DemoRequest({
        fullName,
        email,
        company,
        phone,
        businessSize,
        preferredDate: new Date(preferredDate), // Ensure proper date conversion
        preferredTime,
        message,
        serviceType: serviceType || 'demo', // Default to 'demo' if not provided
      });

      console.log('Saving demo request:', demoRequest);
      
      // Save the demo request to the database
      await demoRequest.save();

      // Format date for email
      const formattedDate = new Date(preferredDate).toLocaleDateString('en-US', {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });

      // Format time slot for email
      const timeSlots = {
        'morning': '9:00 AM - 12:00 PM',
        'afternoon': '12:00 PM - 5:00 PM',
        'evening': '5:00 PM - 8:00 PM'
      };

      try {
        // Configure nodemailer
        const transporter = nodemailer.createTransport({
          host: 'smtp-relay.brevo.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        // Create beautiful HTML email
        const mailOptions = {
          from: `"Next Youth Team" <${process.env.SENDER_EMAIL}>`,
          to: email,
          subject: 'Your Demo Session Request - Next Youth',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #6e8efb, #a777e3); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Demo Request Confirmation</h1>
              </div>
              
              <div style="padding: 30px; background-color: #ffffff;">
                <p style="margin-bottom: 25px; font-size: 16px; color: #333;">Dear <strong>${fullName}</strong>,</p>
                
                <p style="margin-bottom: 25px; font-size: 16px; color: #333;">Thank you for requesting a demo session with Next Youth. We're excited to show you how our solutions can help your business grow.</p>
                
                <div style="background-color: #f9f9f9; border-left: 4px solid #6e8efb; padding: 15px; margin-bottom: 25px;">
                  <h2 style="color: #333; margin-top: 0; font-size: 18px;">Your Request Details:</h2>
                  <ul style="padding-left: 20px; color: #444;">
                    <li style="margin-bottom: 10px;"><strong>Company:</strong> ${company}</li>
                    <li style="margin-bottom: 10px;"><strong>Preferred Date:</strong> ${formattedDate}</li>
                    <li style="margin-bottom: 10px;"><strong>Preferred Time:</strong> ${timeSlots[preferredTime]}</li>
                    <li style="margin-bottom: 10px;"><strong>Business Size:</strong> ${businessSize} employees</li>
                    ${phone ? `<li style="margin-bottom: 10px;"><strong>Phone:</strong> ${phone}</li>` : ''}
                  </ul>
                </div>
                
                <p style="margin-bottom: 25px; font-size: 16px; color: #333;">Our team will contact you shortly to confirm the exact time for your 15-20 minute demo session.</p>
                
                <p style="margin-bottom: 25px; font-size: 16px; color: #333;">If you have any questions or need to reschedule, please don't hesitate to contact us at <a href="mailto:support@nextyouth.com" style="color: #6e8efb; text-decoration: none;">support@nextyouth.com</a>.</p>
                
                <p style="margin-bottom: 25px; font-size: 16px; color: #333;">We look forward to showing you our solutions in action!</p>
                
                <p style="margin-bottom: 10px; font-size: 16px; color: #333;">Best regards,</p>
                <p style="font-size: 16px; color: #333;"><strong>The Next Youth Team</strong></p>
              </div>
              
              <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0; color: #777; font-size: 14px;">&copy; ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
                <div style="margin-top: 15px;">
                  <a href="#" style="color: #6e8efb; margin: 0 10px; text-decoration: none;">Privacy Policy</a>
                  <a href="#" style="color: #6e8efb; margin: 0 10px; text-decoration: none;">Terms of Service</a>
                </div>
              </div>
            </div>
          `
        };

        // Send the beautiful email
        await transporter.sendMail(mailOptions);

        // Additionally, send an internal notification to the team
        const teamNotification = {
          from: `"Demo Request System" <${process.env.SENDER_EMAIL}>`,
          to: process.env.SENDER_EMAIL, // or your team's email address
          subject: `New Demo Request - ${company}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">New Demo Request Received</h2>
              <p><strong>Name:</strong> ${fullName}</p>
              <p><strong>Company:</strong> ${company}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
              <p><strong>Business Size:</strong> ${businessSize}</p>
              <p><strong>Preferred Date:</strong> ${formattedDate}</p>
              <p><strong>Preferred Time:</strong> ${timeSlots[preferredTime]}</p>
              <p><strong>Message:</strong> ${message || 'No specific requirements provided'}</p>
            </div>
          `
        };

        await transporter.sendMail(teamNotification);
      } catch (emailError) {
        console.error('Error sending emails, but request was saved:', emailError);
        // We continue since the demo request was saved successfully
      }

      // Send success response
      return res.status(201).json({ success: true, message: 'Demo request submitted successfully!' });
    } catch (error) {
      console.error('Error processing demo request:', error);
      return res.status(500).json({ success: false, message: 'Failed to submit demo request. Please try again.' });
    }
  }
}

export default new DemoController();
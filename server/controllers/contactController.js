import contactModel from "../models/contactModel.js";
import  transporter  from "../config/nodemailer.js"; // Import the nodemailer transporter

// Create new consultation request (public endpoint - no auth required)
export const createConsultation = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      company, 
      phone, 
      businessSize, 
      serviceType, 
      preferredDate, 
      preferredTime, 
      message 
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !company || !businessSize || !serviceType || !preferredDate || !preferredTime) {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide all required fields" 
      });
    }

    // Create new consultation request
    const newConsultation = await contactModel.create({
      fullName,
      email,
      company,
      phone: phone || "",
      businessSize,
      serviceType,
      preferredDate,
      preferredTime,
      message: message || "",
      status: "pending"
    });

    // Format the date and time for the email
    const formattedDate = new Date(preferredDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const timeSlot = preferredTime === "morning" ? "Morning (9AM - 12PM)" :
                    preferredTime === "afternoon" ? "Afternoon (12PM - 3PM)" :
                    "Evening (3PM - 6PM)";

    // Send confirmation email to the user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: "Your Consultation Request Confirmation",
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(to right, #f8f9fa, #e9ecef);">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
            <h1 style="color: #007bff; margin-bottom: 5px;">Consultation Request Received</h1>
            <p style="color: #6c757d; font-size: 16px;">Thank you for scheduling a consultation with us!</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #343a40;">Hello ${fullName},</p>
            <p style="font-size: 16px; color: #343a40; line-height: 1.5;">
              We've received your consultation request and are excited to connect with you. Our team will review your request and contact you shortly to confirm your appointment.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0;">
              <h3 style="color: #343a40; margin-top: 0;">Your Request Details:</h3>
              <p style="margin: 5px 0;"><strong>Company:</strong> ${company}</p>
              <p style="margin: 5px 0;"><strong>Service Interest:</strong> ${serviceType}</p>
              <p style="margin: 5px 0;"><strong>Preferred Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Preferred Time:</strong> ${timeSlot}</p>
            </div>
            
            <p style="font-size: 16px; color: #343a40; line-height: 1.5;">
              If you need to make any changes to your request or have any questions, please reply to this email or contact our support team.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f1f3f5; border-radius: 5px;">
            <p style="margin: 0 0 15px 0; font-size: 16px;">Looking forward to our consultation!</p>
            <a href="http://localhost:3000/business-solutions" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Explore Our Services</a>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Consultation confirmation email sent successfully");
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue with the response even if email fails
    }

    return res.status(201).json({
      success: true,
      message: "Consultation request submitted successfully",
      consultation: newConsultation
    });
    
  } catch (error) {
    console.error("Error creating consultation request:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Admin endpoints (with auth)
export const getAllConsultations = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Only admin can access this resource." 
      });
    }
    
    const consultations = await contactModel.find({}).sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: consultations.length,
      consultations
    });
    
  } catch (error) {
    console.error("Error getting consultations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const updateConsultationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, consultationNotes } = req.body;
    
    // Check if user is admin
    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Only admin can access this resource." 
      });
    }
    
    const updateData = {};
    if (status) updateData.status = status;
    if (consultationNotes !== undefined) updateData.consultationNotes = consultationNotes;
    
    const updatedConsultation = await contactModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    
    if (!updatedConsultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation request not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Consultation request updated successfully",
      consultation: updatedConsultation
    });
    
  } catch (error) {
    console.error("Error updating consultation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const notifyConsultationUpdate = async (req, res) => {
  try {
    const { 
      recipientEmail, 
      recipientName, 
      status, 
      preferredDate, 
      preferredTime, 
      serviceType,
      consultationNotes
    } = req.body;

    // Check if user is admin
    if (req.user?.user_type !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized. Only admin can send notifications." 
      });
    }

    // Format the date and time for the email
    const formattedDate = new Date(preferredDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const timeSlot = preferredTime === "morning" ? "Morning (9AM - 12PM)" :
                    preferredTime === "afternoon" ? "Afternoon (12PM - 3PM)" :
                    "Evening (3PM - 6PM)";

    // Get status text and color for the email
    let statusText, statusColor;
    switch(status) {
      case 'confirmed':
        statusText = "Confirmed";
        statusColor = "#28a745";
        break;
      case 'completed':
        statusText = "Completed";
        statusColor = "#0d6efd";
        break;
      case 'cancelled':
        statusText = "Cancelled";
        statusColor = "#dc3545";
        break;
      default:
        statusText = "Pending";
        statusColor = "#ffc107";
    }

    // Send status update email to the user
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: recipientEmail,
      subject: `Consultation Status Update: ${statusText}`,
      html: `
        <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: linear-gradient(to right, #f8f9fa, #e9ecef);">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
            <h1 style="color: #007bff; margin-bottom: 5px;">Consultation Update</h1>
            <p style="color: #6c757d; font-size: 16px;">Your consultation status has been updated</p>
          </div>

          <div style="padding: 20px 0;">
            <p style="font-size: 16px; color: #343a40;">Hello ${recipientName},</p>
            <p style="font-size: 16px; color: #343a40; line-height: 1.5;">
              We're writing to inform you that your consultation request has been updated.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0;">
              <h3 style="color: ${statusColor}; margin-top: 0;">Status: ${statusText}</h3>
              <p style="margin: 5px 0;"><strong>Appointment Date:</strong> ${formattedDate}</p>
              <p style="margin: 5px 0;"><strong>Appointment Time:</strong> ${timeSlot}</p>
              <p style="margin: 5px 0;"><strong>Service Type:</strong> ${serviceType}</p>
              ${consultationNotes ? `<p style="margin: 15px 0 5px 0;"><strong>Notes from our team:</strong></p>
              <p style="margin: 5px 0; font-style: italic;">${consultationNotes}</p>` : ''}
            </div>
            
            <p style="font-size: 16px; color: #343a40; line-height: 1.5;">
              ${status === 'confirmed' ? 'Please prepare for your consultation at the scheduled time. We look forward to speaking with you!' : 
                status === 'cancelled' ? 'If you would like to reschedule, please feel free to submit a new consultation request on our website.' :
                status === 'completed' ? 'Thank you for consulting with us. We hope it was valuable for your business needs.' :
                'Our team is reviewing your request and will confirm it shortly.'}
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f1f3f5; border-radius: 5px;">
            <p style="margin: 0 0 15px 0; font-size: 16px;">Need further assistance?</p>
            <a href="${process.env.CLIENT_URL}/contact" style="display: inline-block; background-color: #007bff; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold;">Contact Us</a>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    return res.status(200).json({
      success: true,
      message: "Status update notification sent successfully"
    });
    
  } catch (error) {
    console.error("Error sending notification email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification email"
    });
  }
};
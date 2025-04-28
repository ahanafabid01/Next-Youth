import contactModel from "../models/contactModel.js";

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
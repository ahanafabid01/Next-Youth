import express from "express";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import userAuth from "../middleware/userAuth.js";
import mongoose from 'mongoose';
import Job from '../models/jobModel.js';

// Helper function to create a unique conversation ID between two users
const router = express.Router();
const getConversationId = (user1Id, user2Id) => {
  return [user1Id.toString(), user2Id.toString()].sort().join('_');
};

// Check if users can message each other
const canInitiateConversation = async (senderId, recipientId) => {
  try {
    // Get user types
    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId)
    ]);
    
    if (!sender || !recipient) {
      return { allowed: false, message: "User not found" };
    }
    
    // If conversation already exists, allow messaging
    const conversationId = getConversationId(senderId, recipientId);
    const existingMessages = await Message.findOne({ conversationId });
    if (existingMessages) {
      return { allowed: true };
    }
    
    // Check if users are of different types
    if (sender.user_type === recipient.user_type) {
      return { 
        allowed: false, 
        message: `${sender.user_type === 'employer' ? 'Employers' : 'Candidates'} cannot message other ${sender.user_type === 'employers' ? 'employers' : 'candidates'}` 
      };
    }
    
    // Check if employee has applied to employer's job
    if (sender.user_type === 'employee' && recipient.user_type === 'employer') {
      // Check if employee has applied to any of employer's jobs
      const applications = await mongoose.model('application').findOne({
        applicantId: senderId,
        // Find jobs where the employer is the recipient
        jobId: { $in: await Job.find({ employer: recipientId }).select('_id') }
      });
      
      if (applications) {
        return { allowed: true };
      }
      
      return { 
        allowed: false, 
        message: "You can only message employers after applying to their jobs" 
      };
    }
    
    // Employer messaging an employee
    if (sender.user_type === 'employer' && recipient.user_type === 'employee') {
      // Check if employee has applied to any of employer's jobs
      const applications = await mongoose.model('application').findOne({
        applicantId: recipientId,
        // Find jobs where the employer is the sender
        jobId: { $in: await Job.find({ employer: senderId }).select('_id') }
      });
      
      if (applications) {
        return { allowed: true };
      }
      
      return { 
        allowed: false, 
        message: "You can only message candidates who have applied to your jobs" 
      };
    }
    
    // Default: block messaging
    return { 
      allowed: false, 
      message: "Messaging not allowed between these users" 
    };
  } catch (error) {
    console.error("Error checking messaging permission:", error);
    return { allowed: false, message: "Error checking messaging permission" };
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;
    
    if (!recipientId || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Recipient ID and message content are required" 
      });
    }

    // Check if messaging is allowed
    const permission = await canInitiateConversation(senderId, recipientId);
    if (!permission.allowed) {
      return res.status(403).json({
        success: false,
        message: permission.message
      });
    }
    
    const conversationId = getConversationId(senderId, recipientId);
    
    const newMessage = new Message({
      sender: senderId,
      receiver: recipientId,
      content,
      conversationId,
    });
    
    await newMessage.save();
    
    // Populate sender and receiver info for the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name profilePicture user_type')
      .populate('receiver', 'name profilePicture user_type');
    
    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId).emit('new-message', populatedMessage);
    }

    return res.status(201).json({ 
      success: true, 
      message: "Message sent successfully", 
      message: populatedMessage 
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send message" 
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    
    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }
    
    const conversationId = getConversationId(currentUserId, otherUserId);
    
    // Mark all messages from the other user as read
    await Message.updateMany({
      conversationId,
      sender: otherUserId,
      read: false
    }, { read: true });
    
    // Get all messages between the two users
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');
    
    return res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Find all messages where the current user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture');
    
    // Group messages by conversation and extract the most recent one for each conversation
    const conversationsMap = new Map();
    
    for (const message of messages) {
      const isCurrentUserSender = message.sender._id.toString() === currentUserId;
      const otherUserId = isCurrentUserSender ? message.receiver._id.toString() : message.sender._id.toString();
      const otherUser = isCurrentUserSender ? message.receiver : message.sender;
      
      if (!conversationsMap.has(otherUserId)) {
        // Count unread messages for this conversation
        const unreadCount = await Message.countDocuments({
          conversationId: message.conversationId,
          sender: otherUserId,
          receiver: currentUserId,
          read: false
        });
        
        conversationsMap.set(otherUserId, {
          _id: message._id,
          participant: {
            _id: otherUserId,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture
          },
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            read: message.read
          },
          unreadCount
        });
      }
    }
    
    // Convert map values to array
    const conversations = Array.from(conversationsMap.values());
    
    return res.status(200).json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Count total unread messages for the current user
    const count = await Message.countDocuments({
      receiver: currentUserId,
      read: false
    });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread message count"
    });
  }
};

// Add this new function to messageController.js
export const checkMessagePermission = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recipientId } = req.params;
    
    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required"
      });
    }
    
    const permission = await canInitiateConversation(senderId, recipientId);
    
    return res.status(200).json({
      success: true,
      canMessage: permission.allowed,
      message: permission.message || null
    });
  } catch (error) {
    console.error("Error checking message permission:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check messaging permission"
    });
  }
};

// Add these new functions to the existing file

export const getEmployerApplicants = async (req, res) => {
  try {
    const employerId = req.user.id;
    
    // First, get all jobs posted by this employer
    const jobs = await Job.find({ employer: employerId }).select('_id title');
    
    if (jobs.length === 0) {
      return res.status(200).json({ success: true, applicants: [] });
    }
    
    // Get job IDs
    const jobIds = jobs.map(job => job._id);
    
    // Get all applications for these jobs
    const applicationModel = await mongoose.model('application');
    const applications = await applicationModel.find({ job: { $in: jobIds } })
      .populate('applicant', 'name email profilePicture')
      .populate('job', 'title');
    
    // Format the data for the frontend
    const applicants = applications.map(app => ({
      _id: app.applicant._id,
      name: app.applicant.name,
      profilePicture: app.applicant.profilePicture,
      email: app.applicant.email,
      jobTitle: app.job ? app.job.title : 'Unknown Job',
      jobId: app.job ? app.job._id : null,
      applicationId: app._id,
      status: app.status,
      appliedAt: app.createdAt
    }));
    
    return res.status(200).json({
      success: true,
      applicants: applicants
    });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applicants'
    });
  }
};

export const getEmployeeEmployers = async (req, res) => {
  try {
    const employeeId = req.user.id;
    
    // Get all applications by this employee
    const applicationModel = await mongoose.model('application');
    const applications = await applicationModel.find({ applicant: employeeId })
      .populate({
        path: 'job',
        populate: {
          path: 'employer',
          select: 'name email profilePicture companyName'
        },
        select: 'title'
      });
    
    // Format the data for the frontend
    const employers = applications.map(app => ({
      _id: app.job?.employer?._id,
      name: app.job?.employer?.name || 'Unknown Employer',
      profilePicture: app.job?.employer?.profilePicture,
      email: app.job?.employer?.email,
      companyName: app.job?.employer?.companyName,
      jobTitle: app.job?.title || 'Unknown Job',
      jobId: app.job?._id,
      applicationId: app._id,
      status: app.status,
      appliedAt: app.createdAt
    })).filter(employer => employer._id); // Filter out any null employers
    
    return res.status(200).json({
      success: true,
      employers: employers
    });
  } catch (error) {
    console.error('Error fetching employers:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employers'
    });
  }
};

// Add these two new functions to the messageController.js file

// Get detailed information about an applicant (for employer's messaging)
export const getApplicantDetails = async (req, res) => {
  try {
    const employerId = req.user.id;
    const applicantId = req.params.applicantId;
    
    if (!mongoose.Types.ObjectId.isValid(applicantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid applicant ID format"
      });
    }
    
    // Get the applicant's basic info
    const applicant = await User.findById(applicantId).select('name email profilePicture');
    
    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: "Applicant not found"
      });
    }
    
    // Find jobs posted by this employer
    const jobs = await Job.find({ employer: employerId });
    const jobIds = jobs.map(job => job._id);
    
    // Find applications by this applicant to the employer's jobs
    const applicationModel = await mongoose.model('application');
    const applications = await applicationModel.find({
      applicant: applicantId,
      job: { $in: jobIds }
    }).populate('job', 'title');
    
    // Add job information to the user details
    const jobInfo = applications.length > 0 ? {
      jobTitle: applications[0].job.title,
      jobId: applications[0].job._id,
      applicationId: applications[0]._id,
      applicationStatus: applications[0].status
    } : {};
    
    return res.status(200).json({
      success: true,
      user: {
        ...applicant.toObject(),
        ...jobInfo
      }
    });
  } catch (error) {
    console.error('Error fetching applicant details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applicant details'
    });
  }
};

// Get detailed information about an employer (for employee's messaging)
export const getEmployerDetails = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employerId = req.params.employerId;
    
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employer ID format"
      });
    }
    
    // Get the employer's basic info
    const employer = await User.findById(employerId).select('name email profilePicture companyName');
    
    if (!employer) {
      return res.status(404).json({
        success: false,
        message: "Employer not found"
      });
    }
    
    // Find applications by this employee to the employer's jobs
    const applicationModel = await mongoose.model('application');
    const applications = await applicationModel.find({
      applicant: employeeId,
      job: { $in: await Job.find({ employer: employerId }).select('_id') }
    }).populate('job', 'title');
    
    // Add job information to the user details
    const jobInfo = applications.length > 0 ? {
      jobTitle: applications[0].job.title,
      jobId: applications[0].job._id,
      applicationId: applications[0]._id,
      applicationStatus: applications[0].status
    } : {};
    
    return res.status(200).json({
      success: true,
      user: {
        ...employer.toObject(),
        ...jobInfo
      }
    });
  } catch (error) {
    console.error('Error fetching employer details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch employer details'
    });
  }
};

router.post("/", userAuth, sendMessage);
router.get("/conversations", userAuth, getConversations);
router.get("/unread/count", userAuth, getUnreadCount);
router.get("/:userId", userAuth, getMessages);

export default router;
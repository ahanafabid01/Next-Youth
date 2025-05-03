import mongoose from "mongoose";
import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Application from "../models/applicationModel.js";
import fs from "fs";
import path from "path";

// Helper function to get or create a conversation
const getOrCreateConversation = async (userId, employerId, jobId, applicationId) => {
  // Find existing conversation
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, employerId] },
    jobId: jobId,
    applicationId: applicationId,
    isActive: true
  });
  
  // Create new conversation if not exists
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [userId, employerId],
      jobId: jobId,
      applicationId: applicationId,
      unreadCount: new Map([[employerId.toString(), 0], [userId.toString(), 0]])
    });
  }
  
  return conversation;
};

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    })
      .populate({
        path: "participants",
        select: "name profilePicture email role"
      })
      .populate({
        path: "jobId",
        select: "title"
      })
      .populate({
        path: "lastMessage",
        select: "content createdAt isRead sender"
      })
      .sort({ updatedAt: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conversation => {
      // Find the other participant (not current user)
      const otherParticipant = conversation.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      return {
        _id: conversation._id,
        otherUser: otherParticipant,
        jobId: conversation.jobId,
        jobTitle: conversation.jobId?.title || "Job Discussion",
        applicationId: conversation.applicationId,
        lastMessage: conversation.lastMessage,
        unreadCount: conversation.unreadCount.get(userId.toString()) || 0,
        updatedAt: conversation.updatedAt
      };
    });

    return res.status(200).json({
      success: true,
      conversations: formattedConversations
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
};

// Get messages for a specific conversation
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you don't have permission"
      });
    }

    // Get messages for the conversation
    const messages = await Message.find({
      $or: [
        { sender: conversation.participants[0], recipient: conversation.participants[1] },
        { sender: conversation.participants[1], recipient: conversation.participants[0] }
      ],
      jobId: conversation.jobId,
      applicationId: conversation.applicationId
    })
      .populate({
        path: "sender",
        select: "name profilePicture role"
      })
      .sort({ createdAt: 1 });

    // Mark messages as read if current user is recipient
    await Message.updateMany(
      {
        recipient: userId,
        isRead: false
      },
      { isRead: true }
    );

    // Reset unread count for this user in conversation
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    return res.status(200).json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { recipientId, jobId, applicationId, content } = req.body;
    const attachments = req.body.attachments || [];

    // Validate required fields
    if (!recipientId || !jobId || !applicationId) {
      return res.status(400).json({
        success: false,
        message: "Recipient, job, and application IDs are required"
      });
    }

    // Create or find conversation between these users
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      jobId: jobId,
      applicationId: applicationId,
      isActive: true
    }).session(session);

    if (!conversation) {
      conversation = new Conversation({
        participants: [userId, recipientId],
        jobId,
        applicationId,
        unreadCount: new Map([[recipientId.toString(), 1]])
      });
    } else {
      // Increment unread count for recipient
      const currentCount = conversation.unreadCount.get(recipientId.toString()) || 0;
      conversation.unreadCount.set(recipientId.toString(), currentCount + 1);
    }

    // Create new message
    const newMessage = new Message({
      sender: userId,
      recipient: recipientId,
      jobId,
      applicationId,
      content,
      attachments,
      isRead: false
    });

    await newMessage.save({ session });

    // Update conversation with last message
    conversation.lastMessage = newMessage._id;
    await conversation.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate sender info for the response
    await newMessage.populate({
      path: "sender",
      select: "name profilePicture role"
    });

    return res.status(201).json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // Clean up any uploaded files if there's an error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error(`Failed to delete file: ${file.path}`);
        });
      });
    }

    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
};

// Start a new conversation from an application
export const startConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { recipientId, jobId, applicationId } = req.body;

    // Check if application has been accepted
    const application = await mongoose.model("Application").findOne({
      _id: applicationId,
      job: jobId,
      status: "accepted" // Only allow messaging if application is accepted
    });

    if (!application) {
      return res.status(400).json({
        success: false,
        message: "Cannot start conversation. Application must be accepted first."
      });
    }

    // Check if either user is the job poster or applicant
    const job = await mongoose.model("Job").findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const isEmployer = job.employer.toString() === userId.toString();
    const isApplicant = application.applicant.toString() === userId.toString();

    if (!isEmployer && !isApplicant) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to start this conversation"
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, recipientId] },
      jobId,
      applicationId,
      isActive: true
    });

    if (conversation) {
      return res.status(200).json({
        success: true,
        conversation: conversation._id,
        message: "Conversation already exists"
      });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: [userId, recipientId],
      jobId,
      applicationId,
      unreadCount: new Map()
    });

    await conversation.save();

    return res.status(201).json({
      success: true,
      conversation: conversation._id,
      message: "Conversation started successfully"
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start conversation"
    });
  }
};

// Get unread message count for current user
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all conversations for this user
    const conversations = await Conversation.find({
      participants: userId,
      isActive: true
    });

    // Sum up unread counts
    let totalUnread = 0;
    conversations.forEach(conversation => {
      totalUnread += conversation.unreadCount.get(userId.toString()) || 0;
    });

    return res.status(200).json({
      success: true,
      unreadCount: totalUnread
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread message count"
    });
  }
};
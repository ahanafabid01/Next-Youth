import { Message, Conversation } from "../models/MessageModel.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Add filter to exclude conversations marked as deleted for this user
    const conversations = await Conversation.find({
      participants: { $in: [userId] },
      deletedFor: { $nin: [userId] }  // This line excludes deleted conversations
    })
      .populate({
        path: "participants",
        select: "name email profilePicture",
      })
      .populate("job", "title")
      .populate({
        path: "lastMessage",
        select: "content attachment createdAt read",
      })
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this conversation",
      });
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total messages for pagination, excluding deleted messages
    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
      deletedFor: { $nin: [userId] } // Don't count messages deleted for this user
    });

    // Get messages with pagination and populate sender information
    // Filter out messages that have been deleted for this user
    const messages = await Message.find({ 
      conversation: conversationId,
      deletedFor: { $nin: [userId] } // Don't return messages deleted for this user
    })
      .populate('sender', 'name email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark unread messages as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      messages,
      hasMore: skip + messages.length < totalMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, receiverId } = req.body;
    const senderId = req.user.id;

    // Check if conversation exists or create a new one
    let conversation;

    if (conversationId) {
      // If conversationId provided, verify the sender is part of it
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [senderId] },
      });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to send messages to this conversation",
        });
      }
    } else {
      // Create a new conversation if one doesn't exist
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: "Receiver ID is required to start a new conversation",
        });
      }

      // Check if conversation already exists
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }
    }

    // Create the message
    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      content,
    });

    // Update the conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate the sender info for response
    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email profilePicture');

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Send a message with attachment
export const sendAttachment = async (req, res) => {
  try {
    const { conversationId, receiverId } = req.body;
    const senderId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Check if conversation exists or create a new one
    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        participants: { $in: [senderId] },
      });

      if (!conversation) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to send messages to this conversation",
        });
      }
    } else {
      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: "Receiver ID is required to start a new conversation",
        });
      }

      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }
    }

    // Determine file type
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/messages/${file.filename}`;
    const fileType = file.mimetype;
    const filename = file.originalname;

    // Create the message with attachment
    const message = await Message.create({
      conversation: conversation._id,
      sender: senderId,
      content: "",
      attachment: {
        url: fileUrl,
        type: fileType,
        filename,
      },
    });

    // Update the conversation's last message
    conversation.lastMessage = message._id;
    await conversation.save();

    // Populate the sender info for response
    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email profilePicture');

    return res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    console.error("Error sending attachment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark a message as read
export const markMessageAsRead = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;

    // Find the message and check if user is part of the conversation
    const message = await Message.findById(messageId).populate("conversation");

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: message.conversation,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this conversation",
      });
    }

    // Mark message as read if user is not the sender
    if (message.sender.toString() !== userId) {
      message.read = true;
      await message.save();
    }

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Mark all messages in a conversation as read
export const markConversationAsRead = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this conversation",
      });
    }

    // Mark all messages from other participants as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false,
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "All messages marked as read",
    });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get unread message count for a conversation
export const getUnreadCount = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;

    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to access this conversation",
      });
    }

    // Count unread messages from other participants
    const count = await Message.countDocuments({
      conversation: conversationId,
      sender: { $ne: userId },
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create conversation when application is accepted
export const createConversationFromApplication = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const userId = req.user.id;

    // Get application details
    const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
    const application = await applicationModel.findById(applicationId)
      .populate("applicant")
      .populate({
        path: "job",
        populate: {
          path: "employer"
        }
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Check if user is either the employer or the applicant
    const isEmployer = application.job.employer._id.toString() === userId;
    const isApplicant = application.applicant._id.toString() === userId;

    if (!isEmployer && !isApplicant) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create a conversation for this application",
      });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findOne({
      participants: {
        $all: [application.job.employer._id, application.applicant._id],
      },
      job: application.job._id,
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        conversation: existingConversation,
        message: "Conversation already exists",
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [application.job.employer._id, application.applicant._id],
      job: application.job._id,
    });

    // Populate conversation for response
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "name email profilePicture")
      .populate("job", "title");

    return res.status(201).json({
      success: true,
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error("Error creating conversation from application:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.user.id;
    const deleteFor = req.query.deleteFor || "me";
    
    // Validate messageId format
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID format",
      });
    }
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }
    
    // Check if user is part of the conversation
    const conversationId = message.conversation;
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });
    
    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this message",
      });
    }
    
    // Handle delete for different scenarios
    if (deleteFor === "everyone") {
      // Check if user is the sender
      const isSender = message.sender.toString() === userId.toString();
      
      if (!isSender) {
        return res.status(403).json({
          success: false,
          message: "Only the sender can delete messages for everyone",
        });
      }
      
      // Mark message as deleted for everyone
      message.isDeleted = true;
      message.content = "This message was deleted";
      message.attachment = null;
      await message.save();
      
      // Emit socket event to notify other users
      const io = req.app.get("io");
      if (io) {
        io.to(conversation._id.toString()).emit("message_deleted", {
          messageId,
          deleteFor: "everyone"
        });
      }
    } else {
      // Delete for me - add to deletedFor array
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      
      // Add user to deletedFor if not already there
      if (!message.deletedFor.map(id => id.toString()).includes(userId.toString())) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `Message deleted ${deleteFor === "everyone" ? "for everyone" : "for you"}`,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.user.id;
    
    // Check if conversation exists and user is part of it
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: { $in: [userId] },
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you don't have access",
      });
    }
    
    // For personal deletion, we don't actually delete the conversation
    // Instead, we mark all messages as deleted for this user
    await Message.updateMany(
      { conversation: conversationId },
      { $addToSet: { deletedFor: userId } }
    );
    
    // Add user to the conversation's deletedFor array
    if (!conversation.deletedFor) {
      conversation.deletedFor = [];
    }
    
    if (!conversation.deletedFor.includes(userId)) {
      conversation.deletedFor.push(userId);
      await conversation.save();
    }
    
    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
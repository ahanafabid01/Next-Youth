import express from "express";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import userAuth from "../middleware/userAuth.js";

// Helper function to create a unique conversation ID between two users
const router = express.Router();
const getConversationId = (user1Id, user2Id) => {
  return [user1Id, user2Id].sort().join('_');
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const senderId = req.user.id;
    
    if (!recipientId || !content) {
      return res.status(400).json({ success: false, message: "Recipient ID and message content are required" });
    }
    
    const conversationId = getConversationId(senderId, recipientId);
    
    const newMessage = new Message({
      sender: senderId,
      receiver: recipientId,
      content,
      conversationId,
    });
    
    await newMessage.save();
    
    // Populate sender and receiver info for the socket event
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');
    
    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    io.to(recipientId).emit('new-message', {
      message: populatedMessage,
      sender: {
        _id: req.user.id,
        name: req.user.name,
        profilePicture: req.user.profilePicture
      }
    });
    
    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    
    const conversationId = getConversationId(currentUserId, userId);
    
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');
    
    // Mark messages as read
    await Message.updateMany(
      { conversationId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );
    
    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });
    
    // Create a map of conversations
    const conversationMap = new Map();
    
    for (const message of messages) {
      // Determine the other user in conversation
      const otherUserId = message.sender.equals(userId) 
        ? message.receiver.toString() 
        : message.sender.toString();
      
      // If conversation not in map yet, add it
      if (!conversationMap.has(otherUserId)) {
        // Fetch user info
        const otherUser = await User.findById(otherUserId).select('name profilePicture user_type');
        
        if (!otherUser) continue; // Skip if user not found
        
        // Count unread messages
        const unreadCount = await Message.countDocuments({
          sender: otherUserId,
          receiver: userId,
          read: false
        });
        
        // Get latest message with populated fields
        const latestMessage = await Message.findOne({
          conversationId: message.conversationId
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'name profilePicture')
        .populate('receiver', 'name profilePicture');
        
        conversationMap.set(otherUserId, {
          conversationId: message.conversationId,
          otherUser: {
            _id: otherUser._id,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture,
            userType: otherUser.user_type
          },
          unreadCount,
          latestMessage
        });
      }
    }
    
    // Convert map to array
    const conversations = Array.from(conversationMap.values());
    
    res.status(200).json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Message.countDocuments({
      receiver: userId,
      read: false
    });
    
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

router.post("/", userAuth, sendMessage);
router.get("/conversations", userAuth, getConversations);
router.get("/unread/count", userAuth, getUnreadCount);
router.get("/:userId", userAuth, getMessages);

export default router;
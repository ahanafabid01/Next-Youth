import express from "express";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/MessageMiddleware.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  sendAttachment,
  markMessageAsRead,
  markConversationAsRead,
  getUnreadCount,
  createConversationFromApplication,
} from "../controllers/MessageController.js";

const router = express.Router();

// Get all conversations for a user
router.get("/conversations", userAuth, getConversations);

// Get messages for a conversation
router.get("/:conversationId", userAuth, getMessages);

// Send a new message
router.post("/", userAuth, sendMessage);

// Send a message with attachment
router.post("/attachment", userAuth, upload.single("file"), sendAttachment);

// Mark a message as read
router.put("/mark-read/:messageId", userAuth, markMessageAsRead);

// Mark all messages in a conversation as read
router.put("/mark-conversation-read/:conversationId", userAuth, markConversationAsRead);

// Get unread message count for a conversation
router.get("/unread-count/:conversationId", userAuth, getUnreadCount);

// Create conversation when application is accepted
router.post("/create-from-application", userAuth, createConversationFromApplication);

export default router;
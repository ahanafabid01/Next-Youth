import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import * as messageController from "../controllers/messageController.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Configure file upload using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/messages");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, "msg-" + uniqueSuffix + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image, PDF, and document files are allowed!"), false);
    }
  }
});

// Get all conversations for the current user
router.get("/conversations", verifyToken, messageController.getConversations);

// Get messages for a specific conversation
router.get("/conversations/:conversationId", verifyToken, messageController.getMessages);

// Send a new message
router.post("/send", verifyToken, upload.array("attachments", 5), (req, res, next) => {
  // Add file attachments to request body
  if (req.files && req.files.length > 0) {
    req.body.attachments = req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    }));
  }
  next();
}, messageController.sendMessage);

// Start a new conversation from an application
router.post("/start", verifyToken, messageController.startConversation);

// Get unread message count
router.get("/unread", verifyToken, messageController.getUnreadCount);

export default router;
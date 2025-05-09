import express from "express";
import { sendMessage, getMessages, getConversations, getUnreadCount } from "../controllers/messageController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/", userAuth, sendMessage);
router.get("/conversations", userAuth, getConversations);
router.get("/unread/count", userAuth, getUnreadCount);
router.get("/:userId", userAuth, getMessages);

export default router;
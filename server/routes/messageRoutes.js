import express from "express";
import { 
  sendMessage, 
  getMessages, 
  getConversations, 
  getUnreadCount, 
  checkMessagePermission,
  getEmployerApplicants,
  getEmployeeEmployers,
  getApplicantDetails,
  getEmployerDetails
} from "../controllers/messageController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

router.post("/", userAuth, sendMessage);
router.get("/conversations", userAuth, getConversations);
router.get("/unread/count", userAuth, getUnreadCount);
router.get("/:userId", userAuth, getMessages);
router.get("/permission/:recipientId", userAuth, checkMessagePermission); // Check permission
router.get("/applicants", userAuth, getEmployerApplicants); // For employers
router.get("/employers", userAuth, getEmployeeEmployers); // For employees
router.get("/applicant-details/:applicantId", userAuth, getApplicantDetails); // New endpoint
router.get("/employer-details/:employerId", userAuth, getEmployerDetails); // New endpoint

export default router;
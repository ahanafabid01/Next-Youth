import express from "express";
import { getJobs, addJob } from "../controllers/jobController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getJobs); // Fetch jobs for the logged-in employer
router.post("/", protect, addJob); // Add a new job posting

export default router;
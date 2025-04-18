import express from "express";
import { addJob, getJobs, deleteJob, updateJobStatus } from "../controllers/jobController.js";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", userAuth, getJobs); // Protect the GET /api/jobs route
router.post("/", userAuth, upload.array("files", 5), addJob); // Protect the POST /api/jobs route
router.delete("/:id", userAuth, deleteJob); // Add DELETE /api/jobs/:id route
router.put("/:id/status", userAuth, updateJobStatus); // Add PUT /api/jobs/:id/status route

export default router;
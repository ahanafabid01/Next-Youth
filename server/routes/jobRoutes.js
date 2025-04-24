import express from "express";
import { addJob, getJobs, deleteJob, updateJobStatus, getAvailableJobs, saveJob, applyForJob, getSavedJobs, getAppliedJobs } from "../controllers/jobController.js";
import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", userAuth, getJobs); // Get employer's own jobs
router.get("/available", userAuth, getAvailableJobs); // Get all available jobs
router.post("/", userAuth, upload.array("files", 5), addJob);
router.delete("/:id", userAuth, deleteJob);
router.put("/:id/status", userAuth, updateJobStatus);
router.post("/:id/save", userAuth, saveJob); // Save a job endpoint
router.post("/:id/apply", userAuth, applyForJob);
router.get("/saved", userAuth, getSavedJobs);
router.get("/applied", userAuth, getAppliedJobs);

export default router;
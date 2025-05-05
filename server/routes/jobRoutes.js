import express from "express";
import { addJob, getJobs, deleteJob, updateJobStatus, getAvailableJobs, saveJob, applyForJob, getSavedJobs, getAppliedJobs, removeSavedJob, applyWithDetails, getApplicationById, deleteApplication, getUserApplications, getApplicationByJobId, getEmployerApplications, updateApplicationStatus, getAllJobs, isAdmin, rateApplicant, updateApplication } from "../controllers/jobController.js";
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
router.post('/:id/save/remove', userAuth, removeSavedJob);
router.post("/apply-with-details", userAuth, upload.array("attachments", 5), applyWithDetails);
router.get("/application/:id", userAuth, getApplicationById); // Get application by ID
router.delete("/application/:id", userAuth, deleteApplication); // Delete application by ID
router.get("/applications", userAuth, getUserApplications);
router.get("/job-application/:jobId", userAuth, getApplicationByJobId); // Get application by Job ID
router.get("/employer-applications", userAuth, getEmployerApplications);
router.put("/application/:id/status", userAuth, updateApplicationStatus);
router.put("/application/:id", userAuth, upload.array("attachments", 5), updateApplication);
router.get("/admin/all-jobs", userAuth, isAdmin, getAllJobs); // Get all jobs for admin
router.post('/rate-applicant', userAuth, rateApplicant); // Rate an applicant

export default router;
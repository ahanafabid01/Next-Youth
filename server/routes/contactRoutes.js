import express from "express";
import { createConsultation, getAllConsultations, updateConsultationStatus } from "../controllers/contactController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// Public route - no auth required
router.post("/create", createConsultation);

// Admin-only routes (protected)
router.get("/all", userAuth, getAllConsultations);
router.patch("/update/:id", userAuth, updateConsultationStatus);

export default router;
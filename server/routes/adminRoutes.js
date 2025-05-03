import express from "express";
import userAuth from "../middleware/userAuth.js";
import { sendMassEmail } from "../controllers/adminEmailController.js";

const router = express.Router();

// Connect the controller to the route
router.post("/send-mass-email", userAuth, sendMassEmail);

export default router;
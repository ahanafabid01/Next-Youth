import express from 'express';
import { sendMassEmail } from '../controllers/adminEmailController.js';
import adminAuth from '../middleware/adminAuth.js';

const router = express.Router();

// Add this to your existing admin routes
router.post('/send-mass-email', adminAuth, sendMassEmail);

// ...your existing routes...

export default router;
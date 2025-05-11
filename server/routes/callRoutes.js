import express from 'express';
import userAuth from '../middleware/userAuth.js';  // Changed from named import to default import
import * as callController from '../controllers/callController.js';

const router = express.Router();

// Create a new call record
router.post('/', userAuth, callController.createCall);  // Changed authenticate to userAuth

// Update call status
router.put('/status/:callId', userAuth, callController.updateCallStatus);  // Changed authenticate to userAuth

// Get call history
router.get('/history', userAuth, callController.getCallHistory);  // Changed authenticate to userAuth

export default router;
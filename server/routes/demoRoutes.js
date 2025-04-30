import express from "express";
import { check } from "express-validator";
import demoController from "../controllers/demoController.js"; // Fixed case sensitivity

const router = express.Router();

// Validation array for demo request
const demoRequestValidation = [
  check('fullName', 'Full name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('company', 'Company name is required').not().isEmpty(),
  check('businessSize', 'Business size is required').isIn(['1-10', '11-50', '51-200', '201-500', '501+']),
  check('preferredDate', 'Preferred date is required').not().isEmpty().isDate(),
  check('preferredTime', 'Preferred time is required').isIn(['morning', 'afternoon', 'evening'])
];

// POST route for demo requests
router.post('/demo-request', demoRequestValidation, demoController.requestDemo);

// GET route for all demo requests
router.get('/requests', demoController.getAllDemoRequests);

// Add this new route for status updates
router.put('/requests/:id/status', demoController.updateDemoStatus);

export default router;
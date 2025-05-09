import express from "express";
import { 
    getUserPaymentMethods,
    addCardPaymentMethod,
    addMobilePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getPaymentHistory
} from "../controllers/EmployeePaymentController.js";
import userAuth from "../middleware/userAuth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(userAuth);

// Payment methods routes
router.get("/methods", getUserPaymentMethods);
router.post("/methods/card", addCardPaymentMethod);
router.post("/methods/mobile", addMobilePaymentMethod);
router.delete("/methods/:methodId", deletePaymentMethod);
router.patch("/methods/:methodId/default", setDefaultPaymentMethod);

// Payment history
router.get("/history", getPaymentHistory);

export default router;
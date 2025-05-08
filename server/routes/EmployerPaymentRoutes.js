import express from "express";
import { 
    getUserPaymentMethods,
    addCardPaymentMethod,
    addMobilePaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    getPaymentHistory,
    createPaymentTransaction
} from "../controllers/EmployerPaymentController.js";
import userAuth from "../middleware/userAuth.js";  // FIXED: Use the correct middleware file

const router = express.Router();

// Apply authentication middleware to all routes
router.use(userAuth);

// Payment methods routes
router.get("/methods", getUserPaymentMethods);
router.post("/methods/card", addCardPaymentMethod);
router.post("/methods/mobile", addMobilePaymentMethod);
router.delete("/methods/:methodId", deletePaymentMethod);
router.patch("/methods/:methodId/default", setDefaultPaymentMethod);

// Payment history and transactions
router.get("/history", getPaymentHistory);
router.post("/transaction", createPaymentTransaction);

export default router;
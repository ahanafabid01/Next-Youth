import { PaymentMethod, PaymentTransaction } from "../models/paymentModel.js";
import mongoose from "mongoose";

// Get all payment methods for the current employee
export const getUserPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const methods = await PaymentMethod.find({ userId });
    
    // Mask sensitive data for security
    const sanitizedMethods = methods.map(method => {
      const sanitized = method.toObject();
      
      if (sanitized.type === "card" && sanitized.cardNumber) {
        // Keep only last 4 digits visible
        sanitized.cardNumber = sanitized.cardNumber.replace(/\d(?=\d{4})/g, "*");
      }
      
      return sanitized;
    });
    
    return res.status(200).json({
      success: true,
      methods: sanitizedMethods
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods"
    });
  }
};

// Add a new card payment method
export const addCardPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardNumber, cardHolderName, expiryDate, cardType } = req.body;
    
    // Basic validation
    if (!cardNumber || !cardHolderName || !expiryDate || !cardType) {
      return res.status(400).json({
        success: false,
        message: "All card details are required"
      });
    }
    
    // Check if this is the first payment method for the user
    const existingMethods = await PaymentMethod.countDocuments({ userId });
    const isDefault = existingMethods === 0;
    
    // Create new card payment method
    const newMethod = new PaymentMethod({
      userId,
      type: "card",
      cardNumber: cardNumber.replace(/\s/g, ''), // Remove spaces
      cardHolderName,
      expiryDate,
      cardType,
      isDefault
    });
    
    await newMethod.save();
    
    // Mask card number for the response
    const responseMethod = newMethod.toObject();
    responseMethod.cardNumber = responseMethod.cardNumber.replace(/\d(?=\d{4})/g, "*");
    
    return res.status(201).json({
      success: true,
      method: responseMethod,
      message: "Card payment method added successfully"
    });
  } catch (error) {
    console.error("Error adding card payment method:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add card payment method"
    });
  }
};

// Add a new mobile banking payment method
export const addMobilePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider, mobileNumber, accountType } = req.body;
    
    // Basic validation
    if (!provider || !mobileNumber || !accountType) {
      return res.status(400).json({
        success: false,
        message: "Provider, mobile number, and account type are required"
      });
    }
    
    // Check if this is the first payment method for the user
    const existingMethods = await PaymentMethod.countDocuments({ userId });
    const isDefault = existingMethods === 0;
    
    // Create new mobile payment method
    const newMethod = new PaymentMethod({
      userId,
      type: "mobile",
      provider,
      mobileNumber,
      accountType,
      isDefault
    });
    
    await newMethod.save();
    
    return res.status(201).json({
      success: true,
      method: newMethod,
      message: "Mobile banking payment method added successfully"
    });
  } catch (error) {
    console.error("Error adding mobile payment method:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add mobile payment method"
    });
  }
};

// Delete a payment method
export const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { methodId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method ID"
      });
    }
    
    // Find the method and check if it belongs to the user
    const method = await PaymentMethod.findOne({
      _id: methodId,
      userId
    });
    
    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found or unauthorized"
      });
    }
    
    // Check if it's the default method
    if (method.isDefault) {
      // Find another method to set as default
      const alternativeMethod = await PaymentMethod.findOne({
        userId,
        _id: { $ne: methodId }
      });
      
      if (alternativeMethod) {
        alternativeMethod.isDefault = true;
        await alternativeMethod.save();
      }
    }
    
    // Delete the payment method
    await PaymentMethod.findByIdAndDelete(methodId);
    
    return res.status(200).json({
      success: true,
      message: "Payment method deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete payment method"
    });
  }
};

// Set a payment method as default
export const setDefaultPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { methodId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(methodId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method ID"
      });
    }
    
    // Find the method and check if it belongs to the user
    const method = await PaymentMethod.findOne({
      _id: methodId,
      userId
    });
    
    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found or unauthorized"
      });
    }
    
    // Remove default flag from all other methods
    await PaymentMethod.updateMany(
      { userId, _id: { $ne: methodId } },
      { $set: { isDefault: false } }
    );
    
    // Set this method as default
    method.isDefault = true;
    await method.save();
    
    return res.status(200).json({
      success: true,
      message: "Payment method set as default successfully"
    });
  } catch (error) {
    console.error("Error setting default payment method:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set default payment method"
    });
  }
};

// Get payment history for the current user
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get payment transactions with populated payment method details
    const transactions = await PaymentTransaction.find({ userId })
      .populate({
        path: 'paymentMethodId',
        select: 'type cardNumber cardType provider mobileNumber'
      })
      .sort({ date: -1 }); // Most recent first
    
    // Transform data to include payment method details directly
    const formattedTransactions = transactions.map(transaction => {
      const formattedTransaction = transaction.toObject();
      
      // Restructure to make payment method information more accessible
      if (formattedTransaction.paymentMethodId) {
        formattedTransaction.paymentMethod = formattedTransaction.paymentMethodId;
        
        // Mask card number if present
        if (formattedTransaction.paymentMethod.cardNumber) {
          formattedTransaction.paymentMethod.cardNumber = 
            formattedTransaction.paymentMethod.cardNumber.replace(/\d(?=\d{4})/g, "*");
        }
        
        delete formattedTransaction.paymentMethodId;
      }
      
      return formattedTransaction;
    });
    
    return res.status(200).json({
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment history"
    });
  }
};
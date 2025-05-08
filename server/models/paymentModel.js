import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  type: {
    type: String,
    enum: ["card", "mobile"],
    required: true
  },
  // Card specific fields
  cardNumber: {
    type: String,
    sparse: true
  },
  cardHolderName: {
    type: String
  },
  cardType: {
    type: String,
    enum: ["visa", "mastercard", "amex"]
  },
  expiryDate: {
    type: String
  },
  // Mobile banking specific fields
  provider: {
    type: String,
    enum: ["bkash", "nagad", "rocket", "upay"]
  },
  mobileNumber: {
    type: String
  },
  accountType: {
    type: String,
    enum: ["personal", "merchant"]
  },
  // Common fields
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const paymentTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "paymentMethod",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "BDT"
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  transactionId: {
    type: String
  },
  metadata: {
    type: Object
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create models or get them if they exist
const PaymentMethod = mongoose.models.paymentMethod || mongoose.model("paymentMethod", paymentMethodSchema);
const PaymentTransaction = mongoose.models.paymentTransaction || mongoose.model("paymentTransaction", paymentTransactionSchema);

export { PaymentMethod, PaymentTransaction };
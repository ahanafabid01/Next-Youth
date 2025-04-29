import mongoose from 'mongoose';

const demoRequestSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  businessSize: {
    type: String,
    required: true,
    enum: ['1-10', '11-50', '51-200', '201-500', '501+']
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true,
    enum: ['morning', 'afternoon', 'evening']
  },
  message: {
    type: String
  },
  serviceType: {
    type: String,
    default: 'demo'
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "cancelled"],
    default: "pending"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DemoModel = mongoose.models.DemoRequest || mongoose.model('DemoRequest', demoRequestSchema);
export default DemoModel;
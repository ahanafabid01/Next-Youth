import mongoose from 'mongoose';

const emailHistorySchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  textContent: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['all', 'active', 'inactive'],
    default: 'all'
  },
  recipientCount: {
    type: Number,
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  attachmentCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['success', 'partial', 'failed'],
    default: 'success'
  },
  failedCount: {
    type: Number,
    default: 0
  }
});

const EmailHistory = mongoose.model('EmailHistory', emailHistorySchema);
export default EmailHistory;
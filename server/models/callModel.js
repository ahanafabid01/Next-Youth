import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  caller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  callType: {
    type: String,
    enum: ['audio', 'video'],
    required: true
  },
  status: {
    type: String,
    enum: ['initiated', 'accepted', 'declined', 'missed', 'connected', 'ended'],
    default: 'initiated'
  },
  duration: {
    type: Number,
    default: 0
  },
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  answeredAt: {
    type: Date
  },
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const CallModel = mongoose.model('Call', callSchema);

export default CallModel;
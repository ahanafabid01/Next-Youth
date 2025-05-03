import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // Store unread count for each participant
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for faster query performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ jobId: 1, applicationId: 1 });
conversationSchema.index({ updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
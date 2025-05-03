import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    content: {
      type: String,
      trim: true,
      default: "",
    },
    attachments: [
      {
        filename: String,
        path: String,
        mimetype: String,
      },
    ],
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster message retrieval
messageSchema.index({ sender: 1, recipient: 1 });
messageSchema.index({ jobId: 1, applicationId: 1 });
messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
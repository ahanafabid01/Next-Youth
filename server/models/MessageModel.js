import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // Changed from "User" to "user" to match userModel
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    attachment: {
      type: Object,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create a new model for conversations
const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user", // Changed from "User" to "user" to match userModel
      },
    ],
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job", // Changed from "Job" to "job" to match jobModel
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);

export { Message, Conversation };
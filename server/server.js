import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import connectDB from './config/mongodb.js';
import authRouter from "./routes/authRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import employerPaymentRoutes from "./routes/EmployerPaymentRoutes.js";
import employeePaymentRoutes from "./routes/EmployeePaymentRoutes.js";
import messageRouter from "./routes/MessageRoutes.js"; // Add this
import path from "path";
import bodyParser from "body-parser";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from 'http'; // Add this
import { Server } from 'socket.io'; // Add this
import { Message } from "./models/MessageModel.js"; // Add this
import userModel from "./models/userModel.js"; // Add this
import callRoutes from './routes/callRoutes.js'; // Add this
import CallModel from './models/callModel.js'; // Add this

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const httpServer = createServer(app); // Add this

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

// Include this after initializing io
app.set('io', io); // Make io available to controllers

// Ensure proper UTF-8 encoding for emoji support
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Validate environment variables
if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in the environment variables.");
    process.exit(1);
}

// MongoDB connection
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL || "http://localhost:3000",
}));

// Use body-parser for JSON requests only
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Static file serving middleware
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use('/uploads/messages', express.static(path.join(__dirname, 'uploads/messages')));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payment", employerPaymentRoutes);
app.use("/api/employee-payment", employeePaymentRoutes);
app.use("/api/messages", messageRouter); // Add this
app.use('/api/calls', callRoutes); // Add this

// Track online users: userId -> socketId
const onlineUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  
  // Handle user connection
  socket.on('user_connected', async (userId) => {
    try {
      if (!userId) return;
      
      // Store the user's online status
      onlineUsers.set(userId, socket.id);
      
      // Update user status in database (optional)
      await userModel.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      
      // Broadcast to all users that this user is online
      socket.broadcast.emit('user_status_changed', {
        userId: userId,
        isOnline: true
      });
      
      console.log(`User ${userId} is now online. Socket: ${socket.id}`);
      
      // Send the current online users list to the connected user
      const onlineUserIds = [...onlineUsers.keys()];
      socket.emit('online_users', onlineUserIds);
    } catch (err) {
      console.error("Error handling user connection:", err);
    }
  });

  // Join a conversation
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    }
  });

  // Leave a conversation
  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
      console.log(`User ${socket.id} left conversation: ${conversationId}`);
    }
  });
  
  // Send a message
  socket.on('send_message', async (message) => {
    try {
      console.log("Received message to broadcast:", message);
      
      // Get the conversation ID from either direct property or nested object
      const conversationId = message.conversationId || 
        (message.conversation && 
          (typeof message.conversation === 'object' ? 
            message.conversation._id?.toString() : message.conversation.toString()));
      
      if (!conversationId) {
        console.error("Missing conversationId in message:", message);
        return;
      }
      
      // Populate sender information before broadcasting
      let messageToSend;
      
      if (message._id) {
        try {
          const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email profilePicture');
            
          if (populatedMessage) {
            messageToSend = populatedMessage.toObject();
          } else {
            messageToSend = {...message};
          }
        } catch (err) {
          console.error("Error populating message:", err);
          messageToSend = {...message};
        }
      } else {
        messageToSend = {...message};
      }
      
      // Always ensure the conversationId is included
      messageToSend.conversationId = conversationId;
      
      console.log(`Broadcasting message to conversation ${conversationId}`);
      io.to(conversationId).emit('new_message', messageToSend);
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  });
  
  // Update the socket.on("delete_message") handler
  socket.on('delete_message', async (data) => {
    try {
      const { messageId, conversationId, deleteFor } = data;
      console.log("Received delete_message event:", { messageId, conversationId, deleteFor });
      
      if (!messageId || !conversationId) {
        console.error("Missing messageId or conversationId in delete_message event");
        return;
      }
      
      if (deleteFor === 'everyone') {
        try {
          // Find the message to verify it exists
          const message = await Message.findById(messageId);
          
          if (message) {
            // Broadcast the deletion to all clients in the conversation room
            io.to(conversationId.toString()).emit('message_deleted', {
              messageId,
              deleteFor: 'everyone'
            });
            
            console.log(`Message ${messageId} marked as deleted for everyone in conversation ${conversationId}`);
          } else {
            console.log(`Message ${messageId} not found when processing delete_message event`);
          }
        } catch (err) {
          console.error(`Error finding message ${messageId}:`, err);
        }
      }
    } catch (error) {
      console.error("Error in delete_message socket event:", error);
    }
  });
  
  // Handle user disconnection
  socket.on('disconnect', async () => {
    try {
      // Find which user this socket belongs to
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }
      
      if (disconnectedUserId) {
        // Remove from online users
        onlineUsers.delete(disconnectedUserId);
        
        // Update user status in database (optional)
        await userModel.findByIdAndUpdate(disconnectedUserId, { 
          isOnline: false,
          lastSeen: new Date()
        });
        
        // Broadcast to all users that this user is offline
        socket.broadcast.emit('user_status_changed', {
          userId: disconnectedUserId,
          isOnline: false
        });
        
        console.log(`User ${disconnectedUserId} is now offline`);
      }
      
      console.log('user disconnected', socket.id);
    } catch (err) {
      console.error("Error handling disconnection:", err);
    }
  });

  // Call signaling events
  socket.on('call_offer', async (data) => {
    try {
      const { callerId, callerName, callerAvatar, receiverId, sdp, conversationId, isVideoCall } = data;
      
      // Validate required fields
      if (!callerId || !receiverId || !conversationId) {
        console.error('Missing required fields for call_offer:', { callerId, receiverId, conversationId });
        return;
      }
      
      // Save call to database
      const newCall = new CallModel({
        caller: callerId,
        receiver: receiverId,
        conversationId,
        callType: isVideoCall ? 'video' : 'audio',
        status: 'initiated',
      });
      
      const savedCall = await newCall.save();
      
      // Add call ID to the data
      data.callId = savedCall._id.toString();
      
      // Forward the offer to the receiver
      const receiverSocket = getSocketByUserId(receiverId);
      if (receiverSocket) {
        receiverSocket.emit('call_offer', data);
      } else {
        console.log(`Receiver socket not found for user ${receiverId}`);
        // Update call status to missed if receiver is offline
        await CallModel.findByIdAndUpdate(savedCall._id, { status: 'missed' });
      }
    } catch (err) {
      console.error('Error handling call offer:', err);
    }
  });

  socket.on('call_answer', (data) => {
    const { calleeId, callerId, sdp, accepted } = data;
    const callerSocket = getSocketByUserId(callerId);
    if (callerSocket) {
      callerSocket.emit('call_answer', data);
    }
  });

  socket.on('ice_candidate', (data) => {
    const { candidate, receiverId } = data;
    const receiverSocket = getSocketByUserId(receiverId);
    if (receiverSocket) {
      receiverSocket.emit('ice_candidate', data);
    }
  });

  socket.on('call_end', (data) => {
    const { receiverId } = data;
    const receiverSocket = getSocketByUserId(receiverId);
    if (receiverSocket) {
      receiverSocket.emit('call_end');
    }
  });
});

// Helper function to get socket by user ID
const getSocketByUserId = (userId) => {
  if (!userId) return null;
  
  const socketId = onlineUsers.get(userId);
  if (!socketId) return null;
  
  return io.sockets.sockets.get(socketId);
};

// Default route
app.get('/', (req, res) => {
    res.status(200).send('API is running...');
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start the server (change this to use httpServer instead of app)
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


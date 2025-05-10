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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const httpServer = createServer(app); // Add this

// Socket.IO setup
const io = new Server(httpServer, { // Add this
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
});

// Include this after initializing io
app.set('io', io); // Make io available to controllers

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

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API routes
app.use("/api/auth", authRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/contact", contactRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payment", employerPaymentRoutes);
app.use("/api/employee-payment", employeePaymentRoutes);
app.use("/api/messages", messageRouter); // Add this

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('a user connected', socket.id);
  
  // Join a conversation
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    }
  });
  
  // Send a message
  socket.on('send_message', async (message) => {
    try {
      if (message.conversation) {
        const conversationId = typeof message.conversation === 'object' ? 
          message.conversation.toString() : message.conversation.toString();
        
        // Populate sender information before broadcasting
        let messageToSend;
        
        if (message._id) {
          const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name email profilePicture');
            
          if (populatedMessage) {
            messageToSend = populatedMessage.toObject();
          } else {
            messageToSend = message;
          }
        } else {
          messageToSend = message;
        }
        
        // Add conversationId field for client-side processing
        messageToSend.conversationId = conversationId;
        
        io.to(conversationId).emit('new_message', messageToSend);
        console.log(`Message sent to conversation: ${conversationId}`);
      }
    } catch (error) {
      console.error("Error broadcasting message:", error);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected', socket.id);
  });
});

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


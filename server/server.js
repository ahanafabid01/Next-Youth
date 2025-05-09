import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import connectDB from './config/mongodb.js';

// Import message router
import messageRouter from './routes/messageRoutes.js';

import authRouter from "./routes/authRoutes.js";
import jobRouter from "./routes/jobRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import employerPaymentRoutes from "./routes/EmployerPaymentRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Make io accessible within request object
app.set('io', io);

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
app.use("/api/messages", messageRouter);

// Default route
app.get('/', (req, res) => {
    res.status(200).send('API is running...');
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New socket connection:', socket.id);
  
  // Join user to their personal room for receiving messages
  socket.on('join-user-room', (userId) => {
    if (userId) {
      console.log(`User ${userId} joined personal room`);
      socket.join(userId);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Start the server with http server instead of express app
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cookieParser from 'cookie-parser'; // Fixed typo
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Validate environment variables
if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in the environment variables.");
    process.exit(1); // Exit process with failure
}

// MongoDB connection
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.CLIENT_URL || '*' })); // Allow credentials and specify origin

// API routes
app.use('/api/auth', authRouter);

// Default route
app.get('/', (req, res) => {
    res.status(200).send('API is running...');
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
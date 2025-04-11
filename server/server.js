import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import cokkieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/mongodb.js';
import authRouter from './routes/authRoutes.js'; // Correct relative path

const app = express();
const PORT = process.env.PORT || 4000;
// MongoDB connection
connectDB();


app.use(express.json());
app.use(cors());
app.use(cokkieParser());
app.use(cors({credentials: true}));
app.use('/api/auth', authRouter);
// API routes
app.get('/', (req, res) => {
  res.send('Hello World!!!');
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
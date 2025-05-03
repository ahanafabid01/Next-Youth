import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/messages", messageRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
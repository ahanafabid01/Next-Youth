import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Connect to MongoDB
        const conn = await mongoose.connect(`${process.env.MONGODB_URI}/next-youth`);

        // Log successful connection
        console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    } catch (error) {
        // Log connection error
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;
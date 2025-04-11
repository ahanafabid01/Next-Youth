import bcrypt from "bcryptjs";
 import jwt from "jsonwebtoken"; // Import the default export
 import userModel from "../models/userModel.js"; // Import the user model
 import nodemailer from "nodemailer"; // Import nodemailer for sending emails
 import crypto from "crypto"; // Import crypto for generating random strings
 import dotenv from "dotenv"; // Import dotenv for environment variables
 dotenv.config(); // Load environment variables from .env file
 
 
 //  Registration Function
 export const register = async (req, res) => {
     const { name, email, password } = req.body;
     if (!name || !email || !password) {
         return res.json({success: false, message: "Please fill all the fields" });
     }   
     if (password.length < 8) {
         return res.status(400).json({ message: "Password must be at least 6 characters" });
     }
     try {
         const user = await userModel.findOne({ email });
         if (user) {
             return res.status(400).json({success: false, message: "User already exists" });
         }
         const hashedPassword = await bcrypt.hash(password, 10);
         const newUser = await userModel.create({
             name,
             email,
             password: hashedPassword,
         });
         await newUser.save();
         const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
             expiresIn: "7d",
         });
         res.cookie("token", token, {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         });
 
         return res.status(201).json({ message: "User created successfully", newUser });
     } catch (error) {
         return res.json({ message: error.message });
     }
 } 
 //  Login Function
 export const Login = async (req, res) => {
     const { email, password } = req.body;
     if (!email || !password) {
         return res.status(400).json({success: false, message: "Please fill all the fields" });
     }
     try {
         const user = await userModel.findOne({ email });
         if (!user) {
             return res.status(400).json({success: false, message: "User not found" });
         }
         const isMatch = await bcrypt.compare(password, user.password);
         if (!isMatch) {
             return res.status(400).json({ message: "Invalid password" });
         }
         const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
             expiresIn: "7d",
         });
         res.cookie("token", token, {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
             maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
         });
 
         return res.status(200).json({ message: "Login successful", user });
     } catch (error) {
         return res.status(500).json({ message: error.message });
     }
 }
 
 //  Logout Function
 export const Logout = async (req, res) => {
     try {
         res.clearCookie("token", {
             httpOnly: true,
             secure: process.env.NODE_ENV === "production",
             sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
         });
         return res.status(200).json({ message: "Logout successful" });
     } catch (error) {
         return res.status(500).json({ message: error.message });
     }
 }
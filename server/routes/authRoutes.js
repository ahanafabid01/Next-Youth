import express from 'express';
 import { Login, Logout, register } from '../controllers/authController.js';
 
 const authRouter = express.Router();
 
 authRouter.post('/register', register);
 authRouter.post('/login', Login);
 authRouter.post('/logout', Logout);
 
 export default authRouter; // Add this line
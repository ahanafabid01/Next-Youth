import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create and configure the transporter with better error handling
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com', // Use Brevo's relay server
  port: 587, // Standard secure SMTP port
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug logs in development
  logger: process.env.NODE_ENV === 'development' // Enable logger in development
});

// Verify connection
transporter.verify()
  .then(() => {
    console.log('SMTP server connection established successfully');
  })
  .catch((err) => {
    console.error('Failed to connect to SMTP server:', err);
  });

export default transporter;
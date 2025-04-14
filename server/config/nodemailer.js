import nodemailer from 'nodemailer';

console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS);

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // Use STARTTLS for port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Optional: Verify the transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Error configuring Nodemailer transporter:", error);
    } else {
        console.log("Nodemailer transporter is configured and ready to send emails.");
    }
});

export default transporter;
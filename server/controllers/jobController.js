import jobModel from "../models/jobModel.js";

export const getJobs = async (req, res) => {
    try {
        const jobs = await jobModel.find({ employer: req.user.id });
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error("Error fetching jobs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const addJob = async (req, res) => {
    const { title, skills, scope, budgetType, hourlyFrom, hourlyTo, fixedAmount, description } = req.body;

    // Validate required fields
    if (!title || !description) {
        return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    if (!skills || !Array.isArray(JSON.parse(skills)) || JSON.parse(skills).length === 0) {
        return res.status(400).json({ success: false, message: "At least one skill is required." });
    }

    if (!scope) {
        return res.status(400).json({ success: false, message: "Project scope is required." });
    }

    if (!budgetType || (budgetType === "hourly" && (!hourlyFrom || !hourlyTo)) || (budgetType === "fixed" && !fixedAmount)) {
        return res.status(400).json({ 
            success: false, 
            message: "Budget details are required. Provide hourly rate range or fixed amount." 
        });
    }

    try {
        // Handle file uploads
        const files = req.files?.map(file => ({
            filename: file.filename,
            path: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        })) || [];

        // Create the job
        const job = await jobModel.create({
            title,
            skills: JSON.parse(skills), // Parse skills if sent as a string
            scope,
            budgetType,
            hourlyFrom,
            hourlyTo,
            fixedAmount,
            description,
            files,
            employer: req.user.id, // Automatically set from logged-in user
        });

        res.status(201).json({ success: true, job });
    } catch (error) {
        console.error("Error adding job:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteJob = async (req, res) => {
    try {
        const job = await jobModel.findByIdAndDelete(req.params.id);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        res.status(200).json({ success: true, message: "Job deleted successfully" });
    } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateJobStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const job = await jobModel.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        res.status(200).json({ success: true, job });
    } catch (error) {
        console.error("Error updating job status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Add this new controller function
export const getAvailableJobs = async (req, res) => {
    try {
        // Find jobs that are marked as "Available" status
        const jobs = await jobModel.find({ status: "Available" })
            .select('-employer') // Exclude employer details for security
            .sort({ createdAt: -1 }); // Sort by newest first
        
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error("Error fetching available jobs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Add these new functions

export const applyForJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id;
        
        // Check if job exists
        const job = await jobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        
        // Check if user has already applied
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user.appliedJobs) {
            user.appliedJobs = [];
        }
        
        if (user.appliedJobs.includes(jobId)) {
            return res.status(400).json({ success: false, message: "You have already applied to this job" });
        }
        
        // Add job to user's applied jobs
        user.appliedJobs.push(jobId);
        await user.save();
        
        return res.status(200).json({ success: true, message: "Successfully applied for job" });
    } catch (error) {
        console.error("Error applying for job:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const saveJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id;
        
        // Check if job exists
        const job = await jobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        
        // Check if user has already saved this job
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user.savedJobs) {
            user.savedJobs = [];
        }
        
        if (user.savedJobs.includes(jobId)) {
            return res.status(400).json({ success: false, message: "Job already saved" });
        }
        
        // Add job to user's saved jobs
        user.savedJobs.push(jobId);
        await user.save();
        
        return res.status(200).json({ success: true, message: "Job saved successfully" });
    } catch (error) {
        console.error("Error saving job:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getSavedJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's saved jobs
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user.savedJobs || user.savedJobs.length === 0) {
            return res.status(200).json({ success: true, jobs: [] });
        }
        
        // Fetch all saved job details
        const savedJobs = await jobModel.find({ _id: { $in: user.savedJobs } });
        
        return res.status(200).json({ success: true, jobs: savedJobs });
    } catch (error) {
        console.error("Error fetching saved jobs:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAppliedJobs = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user's applied jobs
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user.appliedJobs || user.appliedJobs.length === 0) {
            return res.status(200).json({ success: true, jobs: [] });
        }
        
        // Fetch all applied job details
        const appliedJobs = await jobModel.find({ _id: { $in: user.appliedJobs } });
        
        return res.status(200).json({ success: true, jobs: appliedJobs });
    } catch (error) {
        console.error("Error fetching applied jobs:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const removeSavedJob = async (req, res) => {
    try {
        const jobId = req.params.id;
        const userId = req.user.id;
        
        // Check if job exists
        const job = await jobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        
        // Get user and remove job from savedJobs array
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user.savedJobs || !user.savedJobs.includes(jobId)) {
            return res.status(400).json({ success: false, message: "Job is not in saved list" });
        }
        
        // Remove job from user's saved jobs
        user.savedJobs = user.savedJobs.filter(id => id.toString() !== jobId);
        await user.save();
        
        return res.status(200).json({ success: true, message: "Job removed from saved list" });
    } catch (error) {
        console.error("Error removing saved job:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Add this function to your existing jobController.js

export const applyWithDetails = async (req, res) => {
    try {
        const { jobId, bid, receivedAmount, duration, coverLetter } = req.body;
        const userId = req.user.id;
        
        // Check if job exists
        const job = await jobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        
        // Check if user has already applied
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user.appliedJobs) {
            user.appliedJobs = [];
        }
        
        if (user.appliedJobs.includes(jobId)) {
            return res.status(400).json({ success: false, message: "You have already applied to this job" });
        }
        
        // Handle uploaded files
        const files = req.files?.map(file => ({
            filename: file.filename,
            path: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        })) || [];
        
        // Create application record
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const application = await applicationModel.create({
            job: jobId,
            applicant: userId,
            bid: parseFloat(bid),
            receivedAmount: parseFloat(receivedAmount),
            duration,
            coverLetter,
            attachments: files,
            status: "pending" // Default status
        });
        
        // Add job to user's applied jobs
        user.appliedJobs.push(jobId);
        await user.save();
        
        return res.status(200).json({ 
            success: true, 
            message: "Application submitted successfully", 
            application 
        });
        
    } catch (error) {
        console.error("Error applying for job with details:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
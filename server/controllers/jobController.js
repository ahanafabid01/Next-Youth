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

export const applyWithDetails = async (req, res) => {
    try {
        const { jobId, bid, receivedAmount, duration, coverLetter } = req.body;
        const userId = req.user.id;
        
        console.log("Received application data:", { 
            jobId, 
            bid, 
            receivedAmount, 
            duration, 
            coverLetterProvided: !!coverLetter,
            filesProvided: req.files && req.files.length > 0
        });
        
        // Check if job exists
        const job = await jobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }
        
        // Check if user has already applied
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        if (!user.appliedJobs) {
            user.appliedJobs = [];
        }
        
        if (user.appliedJobs.includes(jobId)) {
            return res.status(400).json({ success: false, message: "You have already applied to this job" });
        }
        
        // Handle uploaded files (if any)
        const files = req.files?.map(file => ({
            filename: file.filename,
            path: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        })) || [];
        
        // Create application record with optional fields
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        
        const application = await applicationModel.create({
            job: jobId,
            applicant: userId,
            bid: parseFloat(bid),
            receivedAmount: parseFloat(receivedAmount),
            duration,
            coverLetter: coverLetter || "", // Handle empty cover letter
            attachments: files, // Empty array if no files
            status: "pending"
        });
        
        // Add job to user's applied jobs
        user.appliedJobs.push(jobId);
        await user.save();
        
        console.log("Application created successfully:", application._id);
        
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

export const getApplicationById = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;
        
        // Find the application
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const application = await applicationModel.findById(applicationId)
            .populate('job');
        
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        // Check if the application belongs to the current user
        if (application.applicant.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You don't have permission to view this application" });
        }
        
        return res.status(200).json({ 
            success: true, 
            application
        });
        
    } catch (error) {
        console.error("Error fetching application details:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const userId = req.user.id;
        
        // Find the application
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const application = await applicationModel.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        // Check if the application belongs to the current user
        if (application.applicant.toString() !== userId) {
            return res.status(403).json({ success: false, message: "You don't have permission to delete this application" });
        }
        
        // Only allow deleting if application is still pending
        if (application.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: "Only pending applications can be withdrawn" 
            });
        }
        
        // Remove the application
        await applicationModel.findByIdAndDelete(applicationId);
        
        // Remove the job from user's applied jobs
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const user = await userModel.findById(userId);
        user.appliedJobs = user.appliedJobs.filter(jobId => jobId.toString() !== application.job.toString());
        await user.save();
        
        return res.status(200).json({ success: true, message: "Application withdrawn successfully" });
        
    } catch (error) {
        console.error("Error withdrawing application:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getUserApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Find all applications for this user WITH populated job data
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const applications = await applicationModel.find({ applicant: userId })
            .populate('job');
        
        return res.status(200).json({ 
            success: true, 
            applications
        });
        
    } catch (error) {
        console.error("Error fetching user applications:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getApplicationByJobId = async (req, res) => {
    try {
        const { jobId } = req.params;
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const application = await applicationModel.findOne({ job: jobId })
            .populate('applicant', 'name email'); // Add any other fields you need

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "No application found for this job"
            });
        }

        res.status(200).json({
            success: true,
            application
        });
    } catch (error) {
        console.error("Error fetching application:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const getEmployerApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // First, get all jobs posted by this employer
        const employerJobs = await jobModel.find({ employer: userId });
        
        if (employerJobs.length === 0) {
            return res.status(200).json({ success: true, applications: [] });
        }
        
        // Get job IDs
        const jobIds = employerJobs.map(job => job._id);
        
        // Find all applications for these jobs
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const applications = await applicationModel.find({ job: { $in: jobIds } })
            .populate('job')
            .populate('applicant', 'name email profilePicture'); // Just get basic applicant info
        
        return res.status(200).json({ 
            success: true, 
            applications
        });
        
    } catch (error) {
        console.error("Error fetching employer applications:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        
        // Validate the status value
        const validStatuses = ["pending", "accepted", "rejected", "withdrawn"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value"
            });
        }
        
        // Find the application
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        
        // First, find the application to check if it exists and get job info
        const application = await applicationModel.findById(id);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }
        
        // Get job info to check if current user is the job owner
        const job = await jobModel.findById(application.job);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Associated job not found"
            });
        }
        
        // Check if the current user is the employer of the job
        if (job.employer.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this application"
            });
        }
        
        // Update the application status
        const updatedApplication = await applicationModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
        
        return res.status(200).json({
            success: true,
            message: `Application status updated to ${status} successfully`,
            application: updatedApplication
        });
        
    } catch (error) {
        console.error("Error updating application status:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { bid, receivedAmount, duration, coverLetter } = req.body;
        const userId = req.user.id;

        // Find the application
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        const application = await applicationModel.findById(id);
        
        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found"
            });
        }
        
        // Check if the application belongs to the current user
        if (application.applicant.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You don't have permission to update this application"
            });
        }
        
        // Check if the application is still in pending status
        if (application.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: "Only pending applications can be edited"
            });
        }
        
        // Handle uploaded files (if any)
        const files = req.files?.map(file => ({
            filename: file.filename,
            path: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
        })) || [];
        
        // Update application fields
        application.bid = parseFloat(bid);
        application.receivedAmount = parseFloat(receivedAmount);
        application.duration = duration;
        application.coverLetter = coverLetter || "";
        
        // Add new files if provided
        if (files.length > 0) {
            application.attachments = [...application.attachments, ...files];
        }
        
        await application.save();
        
        return res.status(200).json({
            success: true,
            message: "Application updated successfully",
            application
        });
        
    } catch (error) {
        console.error("Error updating application:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Add admin middleware check
export const isAdmin = async (req, res, next) => {
    if (req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied: Admin only" });
    }
};

// Add this function
export const getAllJobs = async (req, res) => {
    try {
        const jobs = await jobModel.find().populate('employer', 'name email');
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        console.error("Error fetching all jobs:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Add this new controller function
export const rateApplicant = async (req, res) => {
    try {
        const { jobId, applicantId, rating, review } = req.body;
        const employerId = req.user.id;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Invalid rating value"
            });
        }

        // Validate review
        if (!review || review.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Review is required"
            });
        }

        // Get the job to verify employer
        const job = await jobModel.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found"
            });
        }

        // Verify employer owns this job
        if (job.employer.toString() !== employerId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to rate for this job"
            });
        }

        // Add rating to user's ratings array
        const userModel = await import("../models/userModel.js").then(module => module.default);
        const applicant = await userModel.findById(applicantId);
        
        if (!applicant) {
            return res.status(404).json({
                success: false,
                message: "Applicant not found"
            });
        }

        // Add the new rating
        applicant.ratings.push({
            job: jobId,
            employer: employerId,
            rating,
            review
        });

        await applicant.save();

        return res.status(200).json({
            success: true,
            message: "Rating submitted successfully"
        });

    } catch (error) {
        console.error("Error submitting rating:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Add this new controller function
export const getAllApplications = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.user_type !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: "Unauthorized. Only admin can access this resource." 
            });
        }
        
        const applicationModel = await import("../models/applicationModel.js").then(module => module.default);
        
        // Get all applications with populated job and applicant details
        const applications = await applicationModel.find()
            .populate('job', 'title description')
            .populate('applicant', 'name email')
            .sort({ createdAt: -1 });
        
        return res.status(200).json({
            success: true,
            applications
        });
    } catch (error) {
        console.error("Error fetching all applications:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
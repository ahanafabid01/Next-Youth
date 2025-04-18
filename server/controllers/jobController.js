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
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
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, message: "Job title is required" });
    }

    try {
        const job = await jobModel.create({
            title,
            employer: req.user.id,
        });
        res.status(201).json({ success: true, job });
    } catch (error) {
        console.error("Error adding job:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
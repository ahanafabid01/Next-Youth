import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash, FaRegFileAlt, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import "./MyJobs.css";

const MyJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs", { 
                    withCredentials: true 
                });
                if (response.data.success) {
                    setJobs(response.data.jobs);
                } else {
                    setError("Failed to fetch jobs.");
                }
            } catch (err) {
                console.error("Error fetching jobs:", err);
                setError("An error occurred while fetching jobs.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const response = await axios.delete(
                `http://localhost:4000/api/jobs/${jobId}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setJobs(jobs.filter((job) => job._id !== jobId));
                alert("Job deleted successfully!");
            } else {
                alert(response.data.message || "Failed to delete the job.");
            }
        } catch (error) {
            console.error("Error deleting job:", error.response?.data || error.message);
            alert(error.response?.data?.message || "An error occurred while deleting the job.");
        }
    };

    const handleUpdateJobStatus = async (jobId, newStatus) => {
        try {
            const response = await axios.put(
                `http://localhost:4000/api/jobs/${jobId}/status`, // Corrected endpoint
                { status: newStatus },
                { withCredentials: true }
            );
            if (response.data.success) {
                setJobs(jobs.map((job) =>
                    job._id === jobId ? { ...job, status: newStatus } : job
                ));
                alert("Job status updated successfully!");
            } else {
                alert(response.data.message || "Failed to update job status.");
            }
        } catch (error) {
            console.error("Error updating job status:", error.response?.data || error.message);
            alert(error.response?.data?.message || "An error occurred while updating the job status.");
        }
    };

    if (loading) {
        return (
            <div className="loading">
                <FaSpinner className="spin" />
                Loading jobs...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error">
                <FaExclamationCircle />
                {error}
            </div>
        );
    }

    return (
        <div className="my-jobs-container">
            <div className="header">
                <h1>My Posted Jobs</h1>
                <span className="job-count">{jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}</span>
            </div>

            {jobs.length === 0 ? (
                <div className="empty-state">
                    <img src="/empty-jobs.svg" alt="No jobs" />
                    <p>You haven't posted any jobs yet</p>
                </div>
            ) : (
                <div className="job-grid">
                    {jobs.map((job) => (
                        <div key={job._id} className="job-card">
                            <div className="card-header">
                                <h3>{job.title}</h3>
                                <span className={`status ${job.status?.toLowerCase()}`}>
                                    {job.status || "Available"}
                                </span>
                            </div>
                            
                            <p className="description">{job.description}</p>
                            
                            <div className="job-details">
                                <div className="detail-item">
                                    <span>Skills:</span>
                                    <div className="skills">
                                        {job.skills?.map((skill, index) => (
                                            <span key={index} className="skill-tag">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span>Scope:</span>
                                        <span className="highlight">{job.scope}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span>Budget:</span>
                                        <span className="highlight">
                                            {job.budgetType === "hourly"
                                                ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
                                                : `$${job.fixedAmount} Fixed`}
                                        </span>
                                    </div>
                                </div>

                                {job.files?.length > 0 && (
                                    <div className="detail-item">
                                        <span>Attachments:</span>
                                        <div className="attachments">
                                            {job.files.map((file, index) => (
                                                <a 
                                                    key={index}
                                                    href={file.path} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="file-link"
                                                >
                                                    <FaRegFileAlt />
                                                    {file.filename}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="card-footer">
                                <select
                                    value={job.status || "Available"}
                                    onChange={(e) => handleUpdateJobStatus(job._id, e.target.value)}
                                    className="status-select"
                                >
                                    <option value="Available">Available</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="On Hold">On Hold</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                
                                <button 
                                    onClick={() => handleDeleteJob(job._id)}
                                    className="delete-btn"
                                >
                                    <FaTrash /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyJobs;
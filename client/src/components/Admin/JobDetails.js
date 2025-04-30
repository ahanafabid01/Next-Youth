import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./AdminDashboard.css";
import "./JobDetails.css";
import axios from "axios";
import { FaTrash, FaEdit, FaRegFileAlt } from "react-icons/fa";

const JobDetails = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            // Use the regular jobs endpoint instead of admin-only endpoint
            const response = await axios.get("http://localhost:4000/api/jobs/available", {
                withCredentials: true
            });

            if (response.data && response.data.success) {
                console.log("Jobs data received:", response.data.jobs);
                setJobs(response.data.jobs);
            } else {
                throw new Error(response.data?.message || "Failed to fetch jobs");
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching jobs:", err);
            setError(`Failed to load jobs: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    // Format budget display based on budget type
    const formatBudget = (job) => {
        if (!job || !job.budgetType) return "N/A";
        
        if (job.budgetType === "hourly") {
            return `$${job.hourlyFrom || 0} - $${job.hourlyTo || 0}/hr`;
        } else if (job.budgetType === "fixed") {
            return `$${job.fixedAmount || 0} fixed`;
        }
        return "N/A";
    };

    // Format date to be more readable
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Truncate long text
    const truncateText = (text, maxLength = 100) => {
        if (!text) return "";
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    // Handle job deletion
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;
        
        try {
            setLoading(true); // Show loading indicator
            const response = await axios.delete(`http://localhost:4000/api/jobs/${jobId}`, { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                setJobs(jobs.filter(job => job._id !== jobId));
                alert("Job deleted successfully");
            } else {
                alert(response.data.message || "Failed to delete job");
            }
        } catch (err) {
            console.error("Error deleting job:", err);
            
            // More specific error message based on status code
            if (err.response?.status === 403) {
                alert("You don't have permission to delete this job. Admin access required.");
            } else if (err.response?.status === 404) {
                alert("Job not found. It may have been already deleted.");
            } else {
                alert(`Error: ${err.response?.data?.message || err.message}`);
            }
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    if (loading) return <div className="loading">Loading jobs data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="main-content">
                <div className="dashboard-container">
                    <h1>Job Details Dashboard</h1>
                    <div className="jobs-table-container">
                        <h2>Job Management ({jobs.length} Jobs)</h2>
                        <table className="jobs-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    {/* Description column removed */}
                                    {/* Skills column removed */}
                                    <th>Scope</th>
                                    <th>Budget</th>
                                    <th>Status</th>
                                    <th>Posted Date</th>
                                    <th>Files</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length > 0 ? (
                                    jobs.map(job => (
                                        <tr key={job._id}>
                                            <td className="job-title">{job.title}</td>
                                            {/* Description cell removed */}
                                            {/* Skills cell removed */}
                                            <td>{job.scope}</td>
                                            <td>{formatBudget(job)}</td>
                                            <td>
                                                <span className={`status-badge ${job.status.toLowerCase()}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td>{formatDate(job.createdAt)}</td>
                                            <td>
                                                {job.files && job.files.length > 0 ? (
                                                    <span className="files-count">
                                                        <FaRegFileAlt /> {job.files.length}
                                                    </span>
                                                ) : (
                                                    "None"
                                                )}
                                            </td>
                                            <td className="action-buttons-cell">
                                                <button className="action-btn edit-btn">
                                                    <FaEdit /> Edit
                                                </button>
                                                <button 
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDeleteJob(job._id)}
                                                >
                                                    <FaTrash /> Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-data">No jobs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDetails;
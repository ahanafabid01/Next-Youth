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
            // Get all available jobs first - this is accessible by all authenticated users
            const availableResponse = await axios.get("http://localhost:4000/api/jobs/available", {
                withCredentials: true
            });

            // Get employer's own jobs to include all job statuses
            const employerResponse = await axios.get("http://localhost:4000/api/jobs", {
                withCredentials: true
            });

            if (availableResponse.data.success && employerResponse.data.success) {
                // Combine results, removing duplicates by ID
                const allJobs = [...availableResponse.data.jobs];
                
                // Add employer's jobs that aren't already in the list
                employerResponse.data.jobs.forEach(job => {
                    if (!allJobs.some(j => j._id === job._id)) {
                        allJobs.push(job);
                    }
                });
                
                setJobs(allJobs);
                console.log("Combined jobs data:", allJobs);
            } else {
                throw new Error("Failed to fetch complete job data");
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
            alert(`Error: ${err.response?.data?.message || err.message}`);
        }
    };

    // Handle job status update
    const handleStatusChange = async (jobId, newStatus) => {
        try {
            const response = await axios.put(`http://localhost:4000/api/jobs/${jobId}/status`, 
                { status: newStatus },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                setJobs(jobs.map(job => 
                    job._id === jobId ? { ...job, status: newStatus } : job
                ));
            } else {
                alert(response.data.message || "Failed to update status");
            }
        } catch (err) {
            console.error("Error updating job status:", err);
            alert(`Error: ${err.response?.data?.message || err.message}`);
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
                                            <td>{job.scope}</td>
                                            <td>{formatBudget(job)}</td>
                                            <td>
                                                <select
                                                    value={job.status || "Available"}
                                                    onChange={(e) => handleStatusChange(job._id, e.target.value)}
                                                    className="status-select"
                                                >
                                                    <option value="Available">Available</option>
                                                    <option value="In Progress">In Progress</option>
                                                    <option value="On Hold">On Hold</option>
                                                    <option value="Completed">Completed</option>
                                                </select>
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
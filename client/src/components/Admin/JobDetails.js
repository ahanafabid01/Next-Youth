import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./AdminDashboard.css";
import "./JobDetails.css";
import axios from "axios";

const JobDetails = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await axios.get("http://localhost:4000/api/jobs", {
                withCredentials: true
            });

            if (response.data && response.data.success) {
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

    if (loading) return <div className="loading">Loading jobs data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="main-content">
                <div className="dashboard-container">
                    <h1>Job Details Dashboard</h1>
                    <div className="jobs-table-container">
                        <h2>Job Management</h2>
                        <table className="jobs-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Skills</th>
                                    <th>Scope</th>
                                    <th>Budget Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length > 0 ? (
                                    jobs.map(job => (
                                        <tr key={job._id}>
                                            <td>{job.title}</td>
                                            <td>{job.description}</td>
                                            <td>{job.skills.join(", ")}</td>
                                            <td>{job.scope}</td>
                                            <td>{job.budgetType}</td>
                                            <td className="action-buttons-cell">
                                                <button className="action-btn edit-btn">Edit</button>
                                                <button className="action-btn delete-btn">Delete</button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">No jobs found</td>
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
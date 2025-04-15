import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EmployerDashboard.css"; // Import the CSS file

const EmployerDashboard = () => {
    const [jobPostings, setJobPostings] = useState([]);
    const [newJob, setNewJob] = useState("");

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs", { withCredentials: true });
                setJobPostings(response.data.jobs);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };

        fetchJobs();
    }, []);

    const handleAddJob = async () => {
        if (!newJob) return alert("Please enter a job title!");

        try {
            const response = await axios.post(
                "http://localhost:4000/api/jobs",
                { title: newJob },
                { withCredentials: true }
            );
            if (response.data.success) {
                setJobPostings([...jobPostings, response.data.job]);
                setNewJob("");
            }
        } catch (error) {
            console.error("Error adding job:", error);
        }
    };

    return (
        <div className="dashboard-container">
            <h1>Welcome to the Employer Dashboard</h1>
            <p>Here you can manage your job postings and find the best candidates.</p>

            <div className="job-postings">
                <h2>Your Job Postings</h2>
                <ul>
                    {jobPostings.length > 0 ? (
                        jobPostings.map((job) => <li key={job._id}>{job.title}</li>)
                    ) : (
                        <p>No job postings yet.</p>
                    )}
                </ul>

                <div style={{ marginTop: "20px" }}>
                    <input
                        type="text"
                        value={newJob}
                        onChange={(e) => setNewJob(e.target.value)}
                        placeholder="Enter job title"
                    />
                    <button onClick={handleAddJob}>Add Job</button>
                </div>
            </div>
        </div>
    );
};

export default EmployerDashboard;
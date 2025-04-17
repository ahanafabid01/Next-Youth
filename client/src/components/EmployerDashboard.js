import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FaBars, 
  FaHome, 
  FaBriefcase, 
  FaUserFriends, 
  FaFileUpload, 
  FaEnvelope, 
  FaCog, 
  FaSignOutAlt,
  FaBell,
  FaUserCircle,
  FaPlus
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";

const EmployerDashboard = () => {
    const [jobPostings, setJobPostings] = useState([]);
    const [newJob, setNewJob] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState(""); // State to store the user's name
    const sidebarRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs", { withCredentials: true });
                setJobPostings(response.data.jobs);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };

        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/auth/me", { withCredentials: true });
                if (response.data.success) {
                    setUserName(response.data.user.name); // Set the user's name
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchJobs();
        fetchUserProfile();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                if (window.innerWidth <= 768) {
                    setMenuOpen(false);
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddJob = async () => {
        if (!newJob.trim()) return alert("Please enter a valid job title!");
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
        <div className="dashboard-wrapper">
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    <FaBars />
                </button>
                <div className="logo">Next Youth</div>
                <div className="mobile-profile">
                    <div className="profile-icon">
                        {userName ? userName.charAt(0).toUpperCase() : <FaUserCircle />}
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${menuOpen ? "open" : ""}`} ref={sidebarRef}>
                <div className="sidebar-header">
                    <h2 className="logo">Next Youth</h2>
                </div>
                
                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li className="nav-item active">
                            <FaHome className="nav-icon" />
                            <span className="nav-text">Dashboard</span>
                        </li>
                        
                        <li className="nav-item">
                            <FaBriefcase className="nav-icon" />
                            <span className="nav-text">My Jobs</span>
                            <span className="notification-badge">5</span>
                        </li>

                        <li className="nav-item">
                            <FaUserFriends className="nav-icon" />
                            <span className="nav-text">Applications</span>
                            <span className="notification-badge">12</span>
                        </li>

                        <li className="nav-item">
                            <FaFileUpload className="nav-icon" />
                            <span className="nav-text">Post a Job</span>
                        </li>

                        <li className="nav-item">
                            <FaEnvelope className="nav-icon" />
                            <span className="nav-text">Messages</span>
                            <span className="notification-badge">3</span>
                        </li>

                        <li className="nav-item">
                            <FaCog className="nav-icon" />
                            <span className="nav-text">Settings</span>
                        </li>

                        <li className="nav-item logout-item">
                            <FaSignOutAlt className="nav-icon" />
                            <span className="nav-text">Logout</span>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

                <header className="content-header">
                    <div className="header-left">
                        <h1>Welcome back, Employer!</h1>
                        <p>Manage your job postings and applicant pipeline</p>
                    </div>
                    <div className="header-right">
                        <button className="notification-btn">
                            <FaBell />
                            <span className="notification-counter">2</span>
                        </button>
                        <div
                            className="profile-icon"
                            onClick={() => navigate("/profile")}
                            style={{ cursor: "pointer" }}
                        >
                            {userName ? userName.charAt(0).toUpperCase() : <FaUserCircle />}
                        </div>
                    </div>
                </header>

                <div className="dashboard-stats">
                    <div className="stat-card">
                        <h3>Active Jobs</h3>
                        <p className="stat-value">{jobPostings.length}</p>
                        <div className="stat-progress">
                            <div className="progress-bar" style={{ width: `${(jobPostings.length / 15) * 100}%` }}></div>
                        </div>
                    </div>
                    <div className="stat-card">
                        <h3>New Applications</h3>
                        <p className="stat-value">24</p>
                        <span className="stat-trend positive">+12%</span>
                    </div>
                    <div className="stat-card">
                        <h3>Open Positions</h3>
                        <p className="stat-value">8</p>
                        <span className="stat-trend negative">-5%</span>
                    </div>
                </div>

                <div className="job-postings">
                    <div className="section-header">
                        <h2>Job Postings</h2>
                        <div className="job-input-container">
                            <input
                                type="text"
                                value={newJob}
                                onChange={(e) => setNewJob(e.target.value)}
                                placeholder="Enter new job title"
                                className="job-input"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddJob()}
                            />
                            <button onClick={handleAddJob} className="add-job-btn">
                                <FaPlus /> Create Job
                            </button>
                        </div>
                    </div>
                    
                    <div className="jobs-grid">
                        {jobPostings.length > 0 ? (
                            jobPostings.map((job) => (
                                <div key={job._id} className="job-card">
                                    <div className="job-header">
                                        <h3>{job.title}</h3>
                                        <span className="job-status active">Active</span>
                                    </div>
                                    <div className="job-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Applications</span>
                                            <span className="meta-value">24</span>
                                        </div>
                                        <div className="meta-item">
                                            <span className="meta-label">Posted</span>
                                            <span className="meta-value">3d ago</span>
                                        </div>
                                    </div>
                                    <div className="job-actions">
                                        <button className="view-btn">View Details</button>
                                        <button className="edit-btn">Edit</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <p>No active job postings. Create your first job!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployerDashboard;
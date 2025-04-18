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
  FaUser,
  FaPlus,
  FaTimes
} from "react-icons/fa";
import { useNavigate, Routes, Route } from "react-router-dom";
import "./EmployerDashboard.css";

const EmployerDashboard = () => {
    const [jobPostings, setJobPostings] = useState([]);
    const [newJob, setNewJob] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState("");
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
                    setUserName(response.data.user.name);
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
                if (window.innerWidth <= 1024) {
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

    const handleLogout = async () => {
        try {
            await axios.post("http://localhost:4000/api/auth/logout", null, { withCredentials: true });
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const handleNavigation = (path) => {
        navigate(path);
        if (window.innerWidth <= 1024) {
            setMenuOpen(false);
        }
    };

    return (
        <div className="dashboard-wrapper">
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FaTimes className="hamburger-icon" /> : <FaBars className="hamburger-icon" />}
                </button>
                <div className="logo">Next Youth</div>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${menuOpen ? "open" : ""}`} ref={sidebarRef}>
                <div className="sidebar-header">
                    <h2 className="logo">Next Youth</h2>
                    <div className="sidebar-profile-info">
                        <FaUser className="profile-icon" />
                        <span className="profile-name">{userName || "Employer"}</span>
                    </div>
                </div>
                
                <nav className="sidebar-nav">
                    <ul className="nav-list">
                        <li className="nav-item" onClick={() => handleNavigation("/dashboard")}>
                            <FaHome className="nav-icon" />
                            <span className="nav-text">Dashboard</span>
                        </li>

                        <li className="nav-item" onClick={() => handleNavigation("/profile")}>
                            <FaUser className="nav-icon" />
                            <span className="nav-text">My Profile</span>
                        </li>
                        
                        <li className="nav-item" onClick={() => handleNavigation("/jobs")}>
                            <FaBriefcase className="nav-icon" />
                            <span className="nav-text">My Jobs</span>
                        </li>

                        <li className="nav-item" onClick={() => handleNavigation("/applications")}>
                            <FaUserFriends className="nav-icon" />
                            <span className="nav-text">Applications</span>
                        </li>

                        <li className="nav-item" onClick={() => handleNavigation("/post-job")}>
                            <FaFileUpload className="nav-icon" />
                            <span className="nav-text">Post a Job</span>
                        </li>

                        <li className="nav-item" onClick={() => handleNavigation("/messages")}>
                            <FaEnvelope className="nav-icon" />
                            <span className="nav-text">Messages</span>
                        </li>

                        <li className="nav-item" onClick={() => handleNavigation("/settings")}>
                            <FaCog className="nav-icon" />
                            <span className="nav-text">Settings</span>
                        </li>

                        <li className="nav-item logout-item" onClick={handleLogout}>
                            <FaSignOutAlt className="nav-icon" />
                            <span className="nav-text">Logout</span>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main Content */}
            <div className="dashboard-content">
                {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)}></div>}

                <Routes>
                    <Route 
                        path="/" 
                        element={
                            <>
                                <header className="content-header">
                                    <div className="header-left">
                                        <h1>Welcome back, {userName || "Employer"}!</h1>
                                        <p>Manage your job postings and applicant pipeline</p>
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
                            </>
                        } 
                    />
                </Routes>
            </div>
        </div>
    );
};

export default EmployerDashboard;
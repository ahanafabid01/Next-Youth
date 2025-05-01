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
  FaTimes,
  FaMoon,
  FaSun
} from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";
import Profile from "./Profile";
import PostJob from "./PostJob";
import MyJobs from "./MyJobs";
import ClientDashboard from "./ClientDashboard";
import Applications from "./Applications";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const EmployerDashboard = () => {
    const [jobPostings, setJobPostings] = useState([]);
    const [newJob, setNewJob] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const [userName, setUserName] = useState("");
    const sidebarRef = useRef(null);
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [jobStats, setJobStats] = useState(null);
    const [monthlyTrends, setMonthlyTrends] = useState(null);
    const [darkMode, setDarkMode] = useState(false);

    // Check for saved theme preference when component mounts
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setDarkMode(true);
            document.body.classList.add("dark-mode");
        }
    }, []);

    // Apply theme changes when darkMode state changes
    useEffect(() => {
        if (darkMode) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("theme", "dark");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    const toggleTheme = () => {
        setDarkMode(prevMode => !prevMode);
    };

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs", { withCredentials: true });
                setJobPostings(response.data.jobs); // Update job postings state
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };

        fetchJobs();
    }, []);

    useEffect(() => {
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

        fetchUserProfile();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setMenuOpen(false);
            }
        };
        
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/dashboard", { withCredentials: true });
                setJobStats(response.data.jobStats);
                setMonthlyTrends(response.data.monthlyTrends);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchDashboardData();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (window.innerWidth <= 1024) {
            setMenuOpen(false);
        }
    };

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

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <ClientDashboard />;
            case "profile":
                return <Profile />;
            case "post-job":
                return <PostJob />;
            case "jobs":
                return <MyJobs onPostJobClick={() => handleTabChange("post-job")} />;
            case "applications":
                return <Applications />;
            case "messages":
            case "settings":
            default:
                return <div className="dashboard-main">Default Content</div>;
        }
    };

    return (
        <div className={`dashboard-wrapper ${darkMode ? 'dark-theme' : 'light-theme'}`}>
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
                <div className="logo">Next Youth</div>
                <div className="theme-toggle-mobile" onClick={toggleTheme}>
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </div>
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
                        <li 
                            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`} 
                            onClick={() => handleTabChange("dashboard")}
                        >
                            <FaHome className="nav-icon" />
                            <span className="nav-text">Dashboard</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "profile" ? "active" : ""}`} 
                            onClick={() => handleTabChange("profile")}
                        >
                            <FaUser className="nav-icon" />
                            <span className="nav-text">My Profile</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "jobs" ? "active" : ""}`} 
                            onClick={() => handleTabChange("jobs")}
                        >
                            <FaBriefcase className="nav-icon" />
                            <span className="nav-text">My Jobs</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "applications" ? "active" : ""}`} 
                            onClick={() => handleTabChange("applications")}
                        >
                            <FaUserFriends className="nav-icon" />
                            <span className="nav-text">Applications</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "post-job" ? "active" : ""}`} 
                            onClick={() => handleTabChange("post-job")}
                        >
                            <FaFileUpload className="nav-icon" />
                            <span className="nav-text">Post a Job</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "messages" ? "active" : ""}`} 
                            onClick={() => handleTabChange("messages")}
                        >
                            <FaEnvelope className="nav-icon" />
                            <span className="nav-text">Messages</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "settings" ? "active" : ""}`} 
                            onClick={() => handleTabChange("settings")}
                        >
                            <FaCog className="nav-icon" />
                            <span className="nav-text">Settings</span>
                        </li>

                        <li className="theme-toggle-item" onClick={toggleTheme}>
                            {darkMode ? <FaSun className="nav-icon" /> : <FaMoon className="nav-icon" />}
                            <span className="nav-text">{darkMode ? "Light Mode" : "Dark Mode"}</span>
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
                {renderContent()}
            </div>
        </div>
    );
};

export default EmployerDashboard;
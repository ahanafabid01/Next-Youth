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
  FaTimes,
  FaMoon,
  FaSun,
  FaIdCard,
  FaArrowRight,
  FaShieldAlt,
  FaEye,
  FaChartBar,
  FaChartPie,
  FaClipboardList,
  FaLightbulb,
  FaFileAlt,
  FaClock,
  FaStar,
  FaSpinner,
  FaCreditCard // Add this import for the payment icon
} from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { useNavigate } from "react-router-dom";
import "./EmployerDashboard.css";
import Profile from "./Profile";
import PostJob from "./PostJob";
import MyJobs from "./MyJobs";
import Applications from "./Applications";
import EmployerVerification from './EmployerVerification';
import EmployerSettings from './EmployerSettings'; // Add this import
import EmployerPayment from './EmployerPayment'; // Add this import
import EmployerMessage from './EmployerMessage'; // Add this import
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

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
    const [verificationStatus, setVerificationStatus] = useState(null);
    const overlayRef = useRef(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [recentApplications, setRecentApplications] = useState([]);
    const [applicationSources, setApplicationSources] = useState(null);
    const [dashboardStats, setDashboardStats] = useState({
        activeJobs: 0,
        applications: 0,
        interviews: 0,
        viewRate: 0
    });

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

    // Fetch jobs posted by the employer
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs", { withCredentials: true });
                if (response.data.success) {
                    setJobPostings(response.data.jobs);
                }
            } catch (error) {
                console.error("Error fetching jobs:", error);
            }
        };

        fetchJobs();
    }, []);

    // Fetch user profile and verification status
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const [profileResponse, verificationResponse] = await Promise.all([
                    axios.get("http://localhost:4000/api/auth/me", { withCredentials: true }),
                    axios.get("http://localhost:4000/api/auth/verification-status", { withCredentials: true })
                ]);
                
                if (profileResponse.data.success) {
                    setUserName(profileResponse.data.user.name);
                }
                
                // Set verification status
                if (verificationResponse.data.success) {
                    setVerificationStatus(verificationResponse.data.verification?.status || null);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchUserProfile();
    }, []);

    // Handle responsive sidebar
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setMenuOpen(false);
            }
        };
        
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Add animation to overlay
    useEffect(() => {
        if (overlayRef.current) {
            if (menuOpen) {
                overlayRef.current.style.display = 'block';
                setTimeout(() => {
                    if (overlayRef.current) overlayRef.current.classList.add('visible');
                }, 10);
            } else {
                overlayRef.current.classList.remove('visible');
                setTimeout(() => {
                    if (overlayRef.current) overlayRef.current.style.display = 'none';
                }, 300);
            }
        }
    }, [menuOpen]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setDashboardLoading(true);
                
                // Get jobs data
                const jobsResponse = await axios.get("http://localhost:4000/api/jobs", { 
                    withCredentials: true 
                });
                
                // Get applications data
                const applicationsResponse = await axios.get("http://localhost:4000/api/jobs/employer-applications", { 
                    withCredentials: true 
                });
                
                if (jobsResponse.data.success) {
                    const jobs = jobsResponse.data.jobs;
                    
                    // Set job statistics
                    setJobStats({
                        total: jobs.length,
                        available: jobs.filter(job => job.status === "Available").length,
                        inProgress: jobs.filter(job => job.status === "In Progress").length,
                        completed: jobs.filter(job => job.status === "Completed").length,
                        onHold: jobs.filter(job => job.status === "On Hold").length
                    });
                    
                    // Calculate monthly trends for job applications
                    const last6Months = generateLast6MonthsLabels();
                    const monthlyData = countJobsByMonth(jobs);
                    
                    setMonthlyTrends({
                        labels: last6Months,
                        data: last6Months.map(month => monthlyData[month] || 0)
                    });
                }
                
                if (applicationsResponse.data.success) {
                    const applications = applicationsResponse.data.applications;
                    
                    // Filter out applications with null applicant or job
                    const validApplications = applications.filter(app => app.applicant && app.job);
                    
                    // Recent applications (newest first, limit to 3)
                    const sortedApplications = [...validApplications]
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                        .slice(0, 3);
                    
                    setRecentApplications(sortedApplications);
                    
                    // Application sources distribution (mock data as we don't have this info yet)
                    setApplicationSources({
                        labels: ['Direct', 'Search', 'Referral', 'Social Media'],
                        data: [
                            applications.length * 0.45,
                            applications.length * 0.3,  
                            applications.length * 0.15,
                            applications.length * 0.1
                        ]
                    });
                    
                    // Set dashboard stats
                    setDashboardStats({
                        activeJobs: jobsResponse.data.jobs.filter(job => job.status === "Available").length,
                        applications: applications.length,
                        interviews: applications.filter(app => app.status === "accepted").length,
                        viewRate: calculateViewRate(applications.length, jobsResponse.data.jobs.length)
                    });
                }
                
                setDashboardLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setDashboardLoading(false);
            }
        };

        fetchDashboardData();
    }, [jobPostings.length]);

    // Helper function to generate labels for the last 6 months
    const generateLast6MonthsLabels = () => {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const month = new Date(currentDate);
            month.setMonth(currentDate.getMonth() - i);
            months.push(month.toLocaleString('default', { month: 'short' }));
        }
        
        return months;
    };
    
    // Helper function to count jobs by month
    const countJobsByMonth = (jobs) => {
        const counts = {};
        const today = new Date();
        
        jobs.forEach(job => {
            const createdAt = new Date(job.createdAt);
            // Only count jobs from the last 6 months
            if ((today - createdAt) <= 180 * 24 * 60 * 60 * 1000) {
                const month = createdAt.toLocaleString('default', { month: 'short' });
                counts[month] = (counts[month] || 0) + 1;
            }
        });
        
        return counts;
    };
    
    // Helper function to calculate view rate
    const calculateViewRate = (applications, jobs) => {
        if (jobs === 0) return 0;
        return Math.round((applications / jobs) * 100);
    };

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

    const renderDashboardOverview = () => {
        if (dashboardLoading) {
            return (
                <div className="dashboard-loading">
                    <FaSpinner className="spin-animation" size={40} />
                    <p>Loading dashboard data...</p>
                </div>
            );
        }
        
        return (
            <>
                <div className="dashboard-welcome">
                    <h1>Welcome back, {userName || "Employer"}</h1>
                    <p>Here's an overview of your recruitment activities and performance</p>
                </div>
                
                <div className="stats-grid">
                    <div className="stats-card">
                        <div className="stats-icon">
                            <FaBriefcase />
                        </div>
                        <div className="stats-label">Active Jobs</div>
                        <div className="stats-value">{dashboardStats.activeJobs}</div>
                        <div className="stats-change positive">
                            <span>↑ 12%</span> from last month
                        </div>
                    </div>
                    
                    <div className="stats-card">
                        <div className="stats-icon">
                            <FaUserFriends />
                        </div>
                        <div className="stats-label">Applications</div>
                        <div className="stats-value">{dashboardStats.applications}</div>
                        <div className="stats-change positive">
                            <span>↑ 8%</span> from last month
                        </div>
                    </div>
                    
                    <div className="stats-card">
                        <div className="stats-icon">
                            <FaIdCard />
                        </div>
                        <div className="stats-label">Interviews</div>
                        <div className="stats-value">{dashboardStats.interviews}</div>
                        <div className="stats-change">
                            <span>↑ 5%</span> from last month
                        </div>
                    </div>
                    
                    <div className="stats-card">
                        <div className="stats-icon">
                            <FaEye />
                        </div>
                        <div className="stats-label">Profile View Rate</div>
                        <div className="stats-value">{dashboardStats.viewRate}%</div>
                        <div className="stats-change positive">
                            <span>↑ 15%</span> from last month
                        </div>
                    </div>
                </div>
                
                <div className="dashboard-row">
                    <div className="dashboard-column">
                        <div className="card chart-card">
                            <h2>
                                <FaChartBar className="card-icon" /> 
                                Application Trends
                            </h2>
                            <p>Monthly application trends for your job postings</p>
                            {monthlyTrends && (
                                <div className="chart-container">
                                    <Bar 
                                        data={{
                                            labels: monthlyTrends.labels,
                                            datasets: [
                                                {
                                                    label: 'Applications',
                                                    data: monthlyTrends.data,
                                                    backgroundColor: 'rgba(58, 134, 255, 0.6)',
                                                    borderColor: '#3a86ff',
                                                    borderWidth: 1,
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="dashboard-column">
                        <div className="card">
                            <h2>
                                <FaChartPie className="card-icon" /> 
                                Application Sources
                            </h2>
                            <p>Where your job applications are coming from</p>
                            {applicationSources && (
                                <div className="chart-container">
                                    <Pie
                                        data={{
                                            labels: applicationSources.labels,
                                            datasets: [
                                                {
                                                    data: applicationSources.data,
                                                    backgroundColor: [
                                                        '#3a86ff', 
                                                        '#4cc9f0', 
                                                        '#ff6b6b', 
                                                        '#f59e0b'
                                                    ]
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="dashboard-row">
                    <div className="dashboard-column">
                        <div className="card">
                            <h2>
                                <FaClipboardList className="card-icon" /> 
                                Recent Applications
                            </h2>
                            <p>Latest candidates who applied to your jobs</p>
                            <div className="recent-applications">
                                {recentApplications.length > 0 ? (
                                    recentApplications.map(application => (
                                        <div className="application-item" key={application._id}>
                                            <div className="application-avatar">
                                                {application.applicant && application.applicant.profilePicture ? (
                                                    <img 
                                                        src={application.applicant.profilePicture} 
                                                        alt={application.applicant.name} 
                                                        style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover'}}
                                                    />
                                                ) : (
                                                    <FaUser />
                                                )}
                                            </div>
                                            <div className="application-details">
                                                <h4>{application.applicant ? application.applicant.name : 'Unknown User'}</h4>
                                                <p>Applied for: <strong>{application.job ? application.job.title : 'Unknown Job'}</strong></p>
                                                <span className="application-time">{new Date(application.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <button 
                                                className="action-button"
                                                onClick={() => handleTabChange("applications")}
                                            >
                                                View
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p>No recent applications.</p>
                                )}
                            </div>
                            {recentApplications.length > 0 && (
                                <div className="card-footer">
                                    <button className="view-all-btn" onClick={() => handleTabChange("applications")}>
                                        View All Applications <FaArrowRight size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="dashboard-column">
                        <div className="card">
                            <h2>
                                <FaLightbulb className="card-icon" /> 
                                Improve Your Hiring
                            </h2>
                            <p>Tips to attract better candidates and improve your hiring process</p>
                            <div className="tips-list">
                                <div className="tip-item">
                                    <div className="tip-icon"><FaFileAlt /></div>
                                    <div className="tip-content">
                                        <h4>Write Clear Job Descriptions</h4>
                                        <p>Be specific about requirements and responsibilities to attract qualified candidates.</p>
                                    </div>
                                </div>
                                
                                <div className="tip-item">
                                    <div className="tip-icon"><FaClock /></div>
                                    <div className="tip-content">
                                        <h4>Respond Quickly</h4>
                                        <p>Fast response times increase candidate engagement and reduce dropoffs.</p>
                                    </div>
                                </div>
                                
                                <div className="tip-item">
                                    <div className="tip-icon"><FaStar /></div>
                                    <div className="tip-content">
                                        <h4>Complete Your Profile</h4>
                                        <p>Profiles with company details and photos get 35% more applications.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return renderDashboardOverview();
            case "profile":
                return <Profile />;
            case "post-job":
                return <PostJob />;
            case "jobs":
                return <MyJobs onPostJobClick={() => handleTabChange("post-job")} />;
            case "applications":
                return <Applications />;
            case "verification":
                return <EmployerVerification onComplete={() => handleTabChange("dashboard")} />;
            case "settings":
                return <EmployerSettings />;
            case "payment":
                return <EmployerPayment />;
            case "messages":
                return <EmployerMessage darkMode={darkMode} />; // Add this case
            default:
                return (
                    <div className="dashboard-main">
                        <div className="card">
                            <h2>Welcome to the {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Section</h2>
                            <p>This feature is coming soon. We're working on making your experience even better!</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className={`dashboard-wrapper ${darkMode ? 'dark-theme' : 'light-theme'}`}>
            {/* Mobile Header */}
            <div className="mobile-header">
                <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                </button>
                <div className="logo">
                    <img 
                        src={darkMode ? logoDark : logoLight} 
                        alt="Next Youth"
                    />
                </div>
                <div className="theme-toggle-mobile" onClick={toggleTheme}>
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                </div>
            </div>

            {/* Sidebar */}
            <div className={`sidebar ${menuOpen ? "open" : ""}`} ref={sidebarRef}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <img 
                            src={darkMode ? logoDark : logoLight}
                            alt="Next Youth"
                            className="sidebar-logo"
                        />
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
                            className={`nav-item ${activeTab === "payment" ? "active" : ""}`} 
                            onClick={() => handleTabChange("payment")}
                        >
                            <FaCreditCard className="nav-icon" />
                            <span className="nav-text">Payment Methods</span>
                        </li>

                        <li 
                            className={`nav-item ${activeTab === "settings" ? "active" : ""}`} 
                            onClick={() => handleTabChange("settings")}
                        >
                            <FaCog className="nav-icon" />
                            <span className="nav-text">Settings</span>
                        </li>
                    </ul>
                    
                    <ul className="nav-list" style={{ marginTop: 'auto' }}>
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
                <div className="sidebar-overlay" ref={overlayRef} onClick={() => setMenuOpen(false)}></div>
                
                {(!verificationStatus || verificationStatus === 'rejected') && (
                    <div className="verification-banner">
                        <div className="verification-banner-content">
                            <div className="verification-banner-icon">
                                <FaShieldAlt />
                            </div>
                            <div className="verification-banner-text">
                                <h3>Verify Your Account</h3>
                                <p>Complete ID verification to unlock full platform features and build trust with clients</p>
                            </div>
                        </div>
                        <button 
                            className="verification-banner-btn"
                            onClick={() => setActiveTab('verification')}
                        >
                            Verify Now <FaArrowRight size={14} />
                        </button>
                    </div>
                )}
                
                {renderContent()}
            </div>
        </div>
    );
};

export default EmployerDashboard;
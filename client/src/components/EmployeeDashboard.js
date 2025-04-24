import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaRegFileAlt, FaChevronDown, FaCheckCircle, FaSun, FaMoon, FaUserCircle, FaBell, FaHome, FaQuestionCircle } from 'react-icons/fa';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [showJobsDropdown, setShowJobsDropdown] = useState(false);
    const [availableJobs, setAvailableJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const jobsDropdownRef = useRef(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationsRef = useRef(null);

    // State to store user data
    const [user, setUser] = useState({ 
        name: '', 
        profilePicture: '',
        isVerified: false 
    });

    // State for dark mode
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("dashboard-theme") === "dark";
    });

    // API base URL
    const API_BASE_URL = 'http://localhost:4000/api';

    // Fetch user data from the server
    const fetchUserData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true });
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            // Handle unauthorized access
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [navigate]);

    // Fetch available jobs
    const fetchAvailableJobs = useCallback(async () => {
        setLoading(true);
        try {
            // Get available jobs and applied jobs in parallel for efficiency
            const [jobsResponse, appliedResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/jobs/available`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/jobs/applied`, { withCredentials: true })
            ]);
            
            if (jobsResponse.data.success) {
                const allJobs = jobsResponse.data.jobs;
                
                // Get list of applied job IDs
                const appliedJobIds = appliedResponse.data.success 
                    ? appliedResponse.data.jobs.map(job => job._id)
                    : [];
                
                // Filter out jobs that have been applied to
                const unappliedJobs = allJobs.filter(job => !appliedJobIds.includes(job._id));
                
                // Display only the first 3 available jobs that haven't been applied to
                setAvailableJobs(unappliedJobs.slice(0, 3));
            } else {
                setError("Failed to fetch available jobs.");
            }
        } catch (err) {
            console.error("Error fetching jobs:", err);
            setError("An error occurred while fetching available jobs.");
            
            // Handle unauthorized access
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (jobsDropdownRef.current && !jobsDropdownRef.current.contains(event.target)) {
                setShowJobsDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    // Initial data loading
    useEffect(() => {
        fetchUserData();
        fetchAvailableJobs();
    }, [fetchUserData, fetchAvailableJobs]);

    // Handle dark mode changes
    useEffect(() => {
        // Apply dark mode class to body
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // Store preference
        localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
        
        return () => {
            // Cleanup - this prevents the dark mode from affecting other pages
            document.body.classList.remove('dark-mode');
        };
    }, [isDarkMode]);

    const toggleJobsDropdown = (e) => {
        e.stopPropagation(); // Prevent the outside click handler from firing
        setShowJobsDropdown(!showJobsDropdown);
    };

    const toggleNotifications = (e) => {
        e.stopPropagation();
        setShowNotifications(!showNotifications);
    };

    // Navigate to job details page
    const viewJobDetails = (jobId) => {
        navigate(`/find-jobs/details/${jobId}`);
    };

    // Handle navigation to different job sections
    const navigateToJobSection = (section) => {
        setShowJobsDropdown(false);
        switch(section) {
            case 'find-work':
                navigate('/find-jobs');
                break;
            case 'saved-jobs':
                navigate('/find-jobs/saved');
                break;
            case 'proposals':
                navigate('/find-jobs/proposals');
                break;
            default:
                navigate('/find-jobs');
        }
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
            if (response.data.success) {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            // Use more professional error handling instead of alert
            setError("Logout failed. Please try again.");
        }
    };

    // Handle account verification
    const handleVerifyAccount = () => {
        navigate('/verify-account');
    };

    // Toggle dark mode
    const toggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    // Format budget display
    const formatBudget = (job) => {
        if (job.budgetType === "hourly") {
            return `$${job.hourlyFrom} - $${job.hourlyTo}/hr`;
        } else {
            return `$${job.fixedAmount} Fixed`;
        }
    };

    // Get current year for footer copyright
    const currentYear = new Date().getFullYear();

    return (
        <>
            {/* Header */}
            <header className="dashboard-header-main">
                <div className="dashboard-header-container">
                    <div className="dashboard-logo-section">
                        <Link to="/" className="dashboard-logo">Next Youth</Link>
                    </div>
                    
                    <div className="dashboard-header-nav">
                        <Link to="/" className="header-nav-link">
                            <FaHome /> Home
                        </Link>
                        <Link to="/find-jobs" className="header-nav-link">
                            Find Jobs
                        </Link>
                        <Link to="/help" className="header-nav-link">
                            <FaQuestionCircle /> Help
                        </Link>
                    </div>
                    
                    <div className="dashboard-header-actions">
                        <div className="notification-container" ref={notificationsRef}>
                            <button 
                                className="notification-button"
                                onClick={toggleNotifications}
                                aria-label="Notifications"
                            >
                                <FaBell />
                                <span className="notification-badge">2</span>
                            </button>
                            
                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notification-header">
                                        <h3>Notifications</h3>
                                        <button className="mark-all-read">Mark all as read</button>
                                    </div>
                                    <div className="notification-list">
                                        <div className="notification-item unread">
                                            <div className="notification-icon">
                                                <FaCheckCircle />
                                            </div>
                                            <div className="notification-content">
                                                <p>Your profile has been verified!</p>
                                                <span className="notification-time">2 hours ago</span>
                                            </div>
                                        </div>
                                        <div className="notification-item unread">
                                            <div className="notification-icon">
                                                <FaRegFileAlt />
                                            </div>
                                            <div className="notification-content">
                                                <p>New job matching your skills is available</p>
                                                <span className="notification-time">1 day ago</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="notification-footer">
                                        <Link to="/notifications">View all notifications</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="user-profile-menu">
                            <div className="user-avatar">
                                {user.profilePicture ? (
                                    <img 
                                        src={user.profilePicture}
                                        alt={`${user.name}'s profile`}
                                    />
                                ) : (
                                    <FaUserCircle />
                                )}
                            </div>
                            <span className="user-name">{user.name || 'User'}</span>
                        </div>
                        
                        <button
                            className="header-theme-toggle"
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? <FaSun /> : <FaMoon />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-container">
                <div className="dashboard-top-section">
                    <div className="dashboard-header">
                        {/* Profile picture */}
                        {user.profilePicture ? (
                            <img 
                                src={user.profilePicture} 
                                alt={`${user.name}'s profile`} 
                                className="dashboard-profile-pic" 
                            />
                        ) : (
                            <div className="dashboard-profile-placeholder">
                                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                        )}
                        <h1>Welcome, {user.name || 'User'}!</h1>
                    </div>
                    
                    {/* Verification button - positioned on the right */}
                    <button 
                        className={`verify-account-button ${user.isVerified ? 'verified' : ''}`}
                        onClick={handleVerifyAccount}
                        disabled={user.isVerified}
                        aria-label={user.isVerified ? "Account verified" : "Verify your account"}
                    >
                        {user.isVerified ? (
                            <>
                                <FaCheckCircle className="verify-icon" />
                                Verified
                            </>
                        ) : (
                            'Verify Your Account'
                        )}
                    </button>
                </div>
                
                <p>Access your personalized dashboard to manage your projects, track applications, and find new opportunities.</p>
                
                <div className="button-group">
                    <button
                        className="action-button"
                        onClick={() => navigate('/employee-profile')}
                    >
                        My Profile
                    </button>

                    {/* Find Jobs dropdown */}
                    <div className="dropdown-container" ref={jobsDropdownRef}>
                        <button
                            className="action-button dropdown-toggle"
                            onClick={toggleJobsDropdown}
                            aria-expanded={showJobsDropdown}
                            aria-haspopup="true"
                        >
                            Find Jobs <FaChevronDown className={`dropdown-icon ${showJobsDropdown ? 'rotate' : ''}`} />
                        </button>
                        {showJobsDropdown && (
                            <div className="dropdown-menu" role="menu">
                                <button 
                                    className="dropdown-item"
                                    onClick={() => navigateToJobSection('find-work')}
                                    role="menuitem"
                                >
                                    Find Work
                                </button>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => navigateToJobSection('saved-jobs')}
                                    role="menuitem"
                                >
                                    Saved Jobs
                                </button>
                                <button 
                                    className="dropdown-item"
                                    onClick={() => navigateToJobSection('proposals')}
                                    role="menuitem"
                                >
                                    Proposals
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="action-button logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>

                <div className="available-jobs-section">
                    <div className="section-header">
                        <h2>Available Jobs</h2>
                        <button 
                            className="see-all-button" 
                            onClick={() => navigate('/find-jobs')}
                        >
                            See All
                        </button>
                    </div>
                    
                    {loading ? (
                        <p>Loading available jobs...</p>
                    ) : error ? (
                        <p className="error-message">{error}</p>
                    ) : availableJobs.length === 0 ? (
                        <p>No available jobs at the moment. Check back later for new opportunities.</p>
                    ) : (
                        <div className="available-jobs-preview">
                            {availableJobs.map((job) => (
                                <div key={job._id} className="job-preview-card">
                                    <h3>{job.title}</h3>
                                    <p className="job-description-preview">
                                        {job.description.length > 100 
                                            ? `${job.description.substring(0, 100)}...` 
                                            : job.description}
                                    </p>
                                    <div className="job-preview-details">
                                        <div className="job-skills-preview">
                                            {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                                                <span key={index} className="skill-tag-preview">
                                                    {skill}
                                                </span>
                                            ))}
                                            {job.skills && job.skills.length > 3 && (
                                                <span className="more-skills">
                                                    +{job.skills.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <p className="job-budget">
                                            {formatBudget(job)}
                                        </p>
                                    </div>
                                    <div className="job-preview-footer">
                                        <button 
                                            className="view-job-button" 
                                            onClick={() => viewJobDetails(job._id)}
                                        >
                                            View Details
                                        </button>
                                        {job.files && job.files.length > 0 && (
                                            <div className="job-attachments-preview">
                                                <FaRegFileAlt /> {job.files.length} attachment{job.files.length > 1 ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme toggle button - fixed position */}
                <button 
                    className="dashboard-theme-toggle" 
                    onClick={toggleDarkMode}
                    aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                    {isDarkMode ? <FaSun /> : <FaMoon />}
                </button>
            </main>

            {/* Footer */}
            <footer className="dashboard-footer">
                <div className="dashboard-footer-container">
                    <div className="footer-columns">
                        <div className="footer-column">
                            <h3>For Employees</h3>
                            <ul>
                                <li><Link to="/find-jobs">Find Work</Link></li>
                                <li><Link to="/saved-jobs">Saved Jobs</Link></li>
                                <li><Link to="/proposals">Proposals</Link></li>
                                <li><Link to="/skills">Skill Tests</Link></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h3>For Employers</h3>
                            <ul>
                                <li><Link to="/post-job">Post a Job</Link></li>
                                <li><Link to="/hire">Find Talent</Link></li>
                                <li><Link to="/enterprise">Enterprise Solutions</Link></li>
                                <li><Link to="/success-stories">Success Stories</Link></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h3>Resources</h3>
                            <ul>
                                <li><Link to="/help-support">Help & Support</Link></li>
                                <li><Link to="/blog">Blog</Link></li>
                                <li><Link to="/community">Community</Link></li>
                                <li><Link to="/affiliates">Affiliates</Link></li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h3>Company</h3>
                            <ul>
                                <li><Link to="/about-us">About Us</Link></li>
                                <li><Link to="/careers">Careers</Link></li>
                                <li><Link to="/press">Press</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="footer-logo">Next Youth</div>
                        <div className="copyright">
                            &copy; {currentYear} Next Youth. All rights reserved.
                        </div>
                        <div className="footer-links">
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/accessibility">Accessibility</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default EmployeeDashboard;
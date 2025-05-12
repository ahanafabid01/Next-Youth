import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaDownload, FaRegFileAlt, FaSpinner, 
         FaExclamationCircle, FaDollarSign, FaClock, 
         FaEdit, FaTrash, FaCheckCircle, FaFileContract, 
         FaSun, FaMoon, FaBell, FaUserCircle, FaChevronDown,
         FaStar, FaCog, FaSignOutAlt } from 'react-icons/fa';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import './ViewApplication.css';
import RatingModal from '../Connections/RatingModal';

const ViewApplication = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("dashboard-theme") === "dark";
    });
    
    // Additional state for header functionality
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(() => {
        return parseInt(localStorage.getItem("unread-notifications") || "2");
    });
    const [userData, setUserData] = useState({
        name: '',
        profilePicture: '',
        idVerification: null
    });
    
    // Refs for dropdowns
    const profileDropdownRef = useRef(null);
    const notificationsRef = useRef(null);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prevMode => {
            const newMode = !prevMode;
            localStorage.setItem("dashboard-theme", newMode ? "dark" : "light");
            return newMode;
        });
    }, []);
    
    // Toggle profile dropdown
    const toggleProfileDropdown = useCallback((e) => {
        e.stopPropagation();
        setShowProfileDropdown(prev => !prev);
        setShowNotifications(false);
    }, []);

    // Toggle notifications
    const toggleNotifications = useCallback((e) => {
        e.stopPropagation();
        setShowNotifications(prev => !prev);
        setShowProfileDropdown(false);
    }, []);
    
    // Mark all notifications as read
    const handleMarkAllAsRead = useCallback((e) => {
        e.stopPropagation();
        setUnreadNotifications(0);
        localStorage.setItem("unread-notifications", "0");
    }, []);
    
    // Handle logout
    const handleLogout = useCallback(async () => {
        try {
            const response = await axios.post(
                `API_BASE_URL/auth/logout`, 
                {}, 
                { withCredentials: true }
            );
            
            if (response.data.success) {
                navigate('/login');
            }
        } catch (err) {
            console.error("Error logging out:", err);
        }
    }, [navigate]);
    
    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    // Fetch user data for header
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const [userResponse, verificationResponse] = await Promise.all([
                    axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true }),
                    axios.get(`${API_BASE_URL}/auth/verification-status`, { withCredentials: true })
                ]);
                
                if (userResponse.data.success) {
                    const userData = userResponse.data.user;
                    
                    let verificationData = null;
                    let verificationStatus = null;
                    
                    if (verificationResponse.data.success) {
                        if (verificationResponse.data.verification) {
                            verificationData = verificationResponse.data.verification;
                            verificationStatus = verificationData.status;
                        }
                    }
                    
                    setUserData({
                        ...userData,
                        idVerification: verificationData,
                        isVerified: verificationStatus === 'verified'
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                if (error.response?.status === 401) {
                    navigate('/login');
                }
            }
        };
        
        fetchUserData();
    }, [API_BASE_URL, navigate]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
    }, [isDarkMode]);

    useEffect(() => {
        const fetchApplicationData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `API_BASE_URL/jobs/application/${applicationId}`, 
                    { withCredentials: true }
                );
                
                if (response.data.success) {
                    setApplication(response.data.application);
                    setJob(response.data.application.job);
                } else {
                    setError("Failed to load application details");
                }
            } catch (err) {
                console.error("Error fetching application:", err);
                setError("Error loading application details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [applicationId]);

    const handleDeleteApplication = async () => {
        try {
            setLoading(true);
            const response = await axios.delete(
                `API_BASE_URL/jobs/application/${applicationId}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                alert("Application withdrawn successfully");
                navigate('/find-jobs/proposals');
            } else {
                setError(response.data.message || "Failed to withdraw application");
            }
        } catch (err) {
            console.error("Error withdrawing application:", err);
            setError(err.response?.data?.message || "An error occurred while withdrawing your application");
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="application-loading">
                <FaSpinner className="spinning" />
                <p>Loading application details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="application-error">
                <FaExclamationCircle />
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => navigate('/find-jobs/proposals')}>Back to Proposals</button>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="application-error">
                <div className="application-error-icon">
                    <FaExclamationCircle />
                </div>
                <h3>Application Not Found</h3>
                <p>The application you're looking for doesn't exist or has been removed.</p>
                <button onClick={() => navigate('/find-jobs/proposals')} className="error-action-btn">
                    <FaArrowLeft /> Back to Proposals
                </button>
            </div>
        );
    }

    return (
        <div className="view-application-container">
            <header className="employee-dashboard-header">
                <div className="employee-dashboard-header-container">
                    <div className="employee-dashboard-header-left">
                        <Link to="/employee-dashboard" className="employee-dashboard-logo">
                            <img 
                                src={isDarkMode ? logoDark : logoLight} 
                                alt="Next Youth" 
                                className="employee-logo-image" 
                            />
                        </Link>
                        
                        <nav className="employee-dashboard-nav">
                            <Link to="/find-jobs" className="employee-nav-link">Find Work</Link>
                            <Link to="/find-jobs/saved" className="employee-nav-link">Saved Jobs</Link>
                            <Link to="/proposals" className="employee-nav-link">Proposals</Link>
                            <Link to="/help" className="employee-nav-link">Help</Link>
                        </nav>
                    </div>
                    
                    <div className="employee-dashboard-header-right">
                        <div className="employee-notification-container" ref={notificationsRef}>
                            <button 
                                className="employee-notification-button"
                                onClick={toggleNotifications}
                                aria-label="Notifications"
                            >
                                <FaBell />
                                {unreadNotifications > 0 && (
                                    <span className="employee-notification-badge">{unreadNotifications}</span>
                                )}
                            </button>
                            
                            {showNotifications && (
                                <div className="employee-notifications-dropdown">
                                    <div className="employee-notification-header">
                                        <h3>Notifications</h3>
                                        <button className="employee-mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                                    </div>
                                    <div className="employee-notification-list">
                                        <div className="employee-notification-item employee-unread">
                                            <div className="employee-notification-icon">
                                                <FaRegFileAlt />
                                            </div>
                                            <div className="employee-notification-content">
                                                <p>Your application has been received</p>
                                                <span className="employee-notification-time">2 hours ago</span>
                                            </div>
                                        </div>
                                        <div className="employee-notification-item">
                                            <div className="employee-notification-icon">
                                                <FaRegFileAlt />
                                            </div>
                                            <div className="employee-notification-content">
                                                <p>New job matching your skills is available</p>
                                                <span className="employee-notification-time">1 day ago</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="employee-notification-footer">
                                        <Link to="/notifications">View all notifications</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button
                            className="employee-theme-toggle-button"
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? <FaSun /> : <FaMoon />}
                        </button>

                        <div className="employee-profile-dropdown-container" ref={profileDropdownRef}>
                            <button 
                                className="employee-profile-button" 
                                onClick={toggleProfileDropdown}
                                aria-label="User profile"
                            >
                                {userData?.profilePicture ? (
                                    <img 
                                        src={userData.profilePicture}
                                        alt="Profile"
                                        className="employee-profile-avatar"
                                    />
                                ) : (
                                    <FaUserCircle className="employee-profile-avatar-icon" />
                                )}
                                <FaChevronDown className={`employee-dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
                            </button>
                            
                            {showProfileDropdown && (
                                <div className="employee-profile-dropdown">
                                    <div className="employee-profile-dropdown-header">
                                        <div className="employee-profile-dropdown-avatar">
                                            {userData?.profilePicture ? (
                                                <img 
                                                    src={userData.profilePicture}
                                                    alt={`${userData.name}'s profile`}
                                                />
                                            ) : (
                                                <FaUserCircle />
                                            )}
                                        </div>
                                        <div className="employee-profile-dropdown-info">
                                            <h4>{userData?.name || 'User'}</h4>
                                            <span className="employee-profile-status">
                                                {!userData.idVerification ? (
                                                    'Not Verified'
                                                ) : userData.idVerification.status === 'verified' ? (
                                                    <><FaCheckCircle className="employee-verified-icon" /> Verified</>
                                                ) : userData.idVerification.status === 'pending' && 
                                                    userData.idVerification.frontImage && 
                                                    userData.idVerification.backImage ? (
                                                    <><FaClock className="employee-pending-icon" /> Verification Pending</>
                                                ) : userData.idVerification.status === 'rejected' ? (
                                                    <>Verification Rejected</>
                                                ) : (
                                                    'Not Verified'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="employee-profile-dropdown-links">
                                        <button 
                                            className="employee-profile-dropdown-link"
                                            onClick={() => navigate('/my-profile')}
                                        >
                                            <FaUserCircle /> View Profile
                                        </button>
                                        
                                        <button 
                                            className="employee-profile-dropdown-link"
                                            onClick={() => {
                                                setShowRatingModal(true);
                                                setShowProfileDropdown(false);
                                            }}
                                        >
                                            <FaStar /> My Ratings & Reviews
                                        </button>
                                        
                                        <button 
                                            className="employee-profile-dropdown-link"
                                            onClick={() => navigate('/settings')}
                                        >
                                            <FaCog /> Settings
                                        </button>
                                        
                                        <button 
                                            className="employee-profile-dropdown-link"
                                            onClick={handleLogout}
                                        >
                                            <FaSignOutAlt /> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="view-application-content">
                <button 
                    className="back-to-proposals"
                    onClick={() => navigate('/proposals')}
                >
                    <FaArrowLeft /> <span>Back to Proposals</span>
                </button>

                <div className="application-banner">
                    <div className="application-status-indicator">
                        <div className={`status-badge ${application.status}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </div>
                    </div>
                    <h1>
                        {job?.title}
                        <span className="application-date-subtitle">
                            Applied on {new Date(application.createdAt).toLocaleDateString()}
                        </span>
                    </h1>
                </div>

                <div className="application-card job-details-card">
                    <div className="card-header">
                        <div className="card-header-icon">
                            <FaFileContract />
                        </div>
                        <h2>Job Details</h2>
                    </div>
                    
                    <div className="job-details-grid">
                        <div className="job-detail-item">
                            <div className="detail-icon budget-icon">
                                <FaDollarSign />
                            </div>
                            <div>
                                <h4>Budget</h4>
                                <p>
                                    {job?.budgetType === "hourly"
                                        ? `$${job?.hourlyFrom} - $${job?.hourlyTo}/hr`
                                        : `$${job?.fixedAmount} Fixed`}
                                </p>
                            </div>
                        </div>
                        
                        <div className="job-detail-item">
                            <div className="detail-icon scope-icon">
                                <FaClock />
                            </div>
                            <div>
                                <h4>Scope</h4>
                                <p>{job?.scope}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="job-description">
                        <h3>Description</h3>
                        <div className="description-content">
                            <p>{job?.description}</p>
                        </div>
                    </div>
                    
                    {job?.skills?.length > 0 && (
                        <div className="job-skills">
                            <h3>Required Skills</h3>
                            <div className="skills-tags">
                                {job.skills.map((skill, index) => (
                                    <span key={index} className="skill-tag">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="application-card application-details-card">
                    <div className="card-header">
                        <div className="card-header-icon">
                            <FaCheckCircle />
                        </div>
                        <h2>Your Proposal</h2>
                    </div>
                    
                    <div className="application-metrics">
                        <div className="metric">
                            <div className="metric-icon">
                                <FaDollarSign />
                            </div>
                            <div>
                                <span className="metric-value">${application.bid}</span>
                                <span className="metric-label">Your Bid</span>
                            </div>
                        </div>
                        
                        <div className="metric">
                            <div className="metric-icon">
                                <FaDollarSign />
                            </div>
                            <div>
                                <span className="metric-value">${application.receivedAmount}</span>
                                <span className="metric-label">You'll Receive</span>
                            </div>
                        </div>
                        
                        <div className="metric">
                            <div className="metric-icon">
                                <FaClock />
                            </div>
                            <div>
                                <span className="metric-value">{application.duration}</span>
                                <span className="metric-label">Est. Duration</span>
                            </div>
                        </div>
                    </div>

                    {application.coverLetter && (
                        <div className="application-cover-letter">
                            <h3>Cover Letter</h3>
                            <div className="cover-letter-content">
                                <p>{application.coverLetter}</p>
                            </div>
                        </div>
                    )}
                    
                    {application.attachments && application.attachments.length > 0 && (
                        <div className="application-attachments">
                            <h3>Attachments</h3>
                            <div className="attachments-list">
                                {application.attachments.map((file, index) => (
                                    <a 
                                        key={index}
                                        href={file.path} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="attachment-item"
                                        download
                                    >
                                        <div className="attachment-icon">
                                            <FaRegFileAlt />
                                        </div>
                                        <div className="attachment-name">{file.filename}</div>
                                        <div className="attachment-action">
                                            <FaDownload />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="application-timestamps">
                        {application.updatedAt !== application.createdAt && (
                            <div className="timestamp updated">
                                <FaClock /> Last updated: {new Date(application.updatedAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    
                    {application.status === 'pending' && (
                        <div className="application-actions">
                            <button 
                                className="action-button edit-button"
                                onClick={() => navigate(`/edit-application/${applicationId}`)}
                            >
                                <FaEdit /> Edit Proposal
                            </button>
                            <button 
                                className="action-button withdraw-button"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <FaTrash /> Withdraw Proposal
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <footer className="employee-find-jobs-footer">
                <div className="employee-find-jobs-footer-container">
                    <div className="employee-footer-copyright">
                        <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
                    </div>
                </div>
            </footer>
            
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3>Withdraw Application</h3>
                        </div>
                        <div className="modal-content">
                            <div className="modal-icon">
                                <FaExclamationCircle />
                            </div>
                            <p>Are you sure you want to withdraw your application? This action cannot be undone.</p>
                        </div>
                        <div className="modal-actions">
                            <button className="modal-button cancel-button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="modal-button confirm-button" onClick={handleDeleteApplication}>
                                {loading ? <FaSpinner className="spinning" /> : "Withdraw Application"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <RatingModal 
                isOpen={showRatingModal}
                onClose={() => setShowRatingModal(false)}
                viewOnly={true}
            />
        </div>
    );
};

export default ViewApplication;
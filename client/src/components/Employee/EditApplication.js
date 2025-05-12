import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaDollarSign, 
         FaClock, FaUpload, FaFileContract, FaRegFileAlt, FaDownload,
         FaCommentDots, FaTimes, FaBriefcase, FaSun, FaMoon, FaUserCircle,
         FaBell, FaChevronDown, FaCog, FaSignOutAlt, FaCheckCircle, FaStar, FaLightbulb, FaChartBar } from 'react-icons/fa';
import './EditApplication.css';  // Import the dedicated CSS file
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const EditApplication = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        bid: '',
        receivedAmount: '',
        duration: '',
        coverLetter: ''
    });
    const [job, setJob] = useState(null);
    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const fileInputRef = useRef(null);
    
    // Service fee percentage
    const serviceFeePercentage = 5;
    
    // Get theme from localStorage or default to light
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("dashboard-theme") === "dark";
    });
    
    // User state for profile display
    const [user, setUser] = useState({
        name: '',
        profilePicture: '',
        idVerification: null
    });
    
    // Header state
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState(() => {
        return parseInt(localStorage.getItem("unread-notifications") || "2");
    });
    
    // Refs for clickaway handling
    const profileDropdownRef = useRef(null);
    const notificationsRef = useRef(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, []);

    // Fetch user data for header
    const fetchUserData = useCallback(async () => {
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
                
                setUser({
                    ...userData,
                    idVerification: verificationData,
                    isVerified: verificationStatus === 'verified'
                });
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [navigate]); // Add navigate as dependency

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData, navigate]); // Add navigate to dependencies
    
    // Fetch application data
    useEffect(() => {
        const fetchApplicationData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `${API_BASE_URL}/jobs/application/${applicationId}`,
                    { withCredentials: true }
                );
                
                if (response.data.success) {
                    const application = response.data.application;
                    setFormData({
                        bid: application.bid,
                        receivedAmount: application.receivedAmount,
                        duration: application.duration,
                        coverLetter: application.coverLetter || ''
                    });
                    setJob(application.job);
                    setExistingFiles(application.attachments || []);
                } else {
                    setError("Failed to load application details");
                }
            } catch (err) {
                console.error("Error fetching application:", err);
                setError(err.response?.data?.message || "Error loading application details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [applicationId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'bid') {
            const bid = Number(value);
            const fee = (bid * serviceFeePercentage) / 100;
            setFormData(prev => ({
                ...prev,
                bid: value,
                receivedAmount: (bid - fee).toFixed(2)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };
    
    const removeFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setSubmitting(true);
            
            // Create form data for multipart file upload
            const formDataToSend = new FormData();
            formDataToSend.append('bid', formData.bid);
            formDataToSend.append('receivedAmount', formData.receivedAmount);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('coverLetter', formData.coverLetter);
            
            // Append files if any
            files.forEach(file => {
                formDataToSend.append('attachments', file);
            });
            
            const response = await axios.put(
                `${API_BASE_URL}/jobs/application/${applicationId}`,
                formDataToSend,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data.success) {
                alert("Application updated successfully!");
                navigate(`/view-application/${applicationId}`);
            } else {
                setError(response.data.message || "Failed to update application");
            }
        } catch (err) {
            console.error("Error updating application:", err);
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle dark mode function
    const toggleDarkMode = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        localStorage.setItem("dashboard-theme", newTheme);
        setIsDarkMode(!isDarkMode);
    };

    // Header interaction functions
    const toggleMobileNav = (e) => {
        e.stopPropagation();
        setShowMobileNav(prev => !prev);
    };

    const toggleProfileDropdown = (e) => {
        e.stopPropagation();
        setShowProfileDropdown(prev => !prev);
    };

    const toggleNotifications = (e) => {
        e.stopPropagation();
        setShowNotifications(prev => !prev);
    };

    const handleMarkAllAsRead = (e) => {
        e.stopPropagation();
        setUnreadNotifications(0);
        localStorage.setItem("unread-notifications", "0");
    };

    const handleLogout = async () => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/auth/logout`, 
                {}, 
                { withCredentials: true }
            );
            
            if (response.data.success) {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const [showRatingModal, setShowRatingModal] = useState(false);

    if (loading) {
        return (
            <div className="edit-app-loading">
                <div className="edit-app-loader">
                    <FaSpinner className="spinning" />
                    <p>Loading application details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="edit-app-error">
                <div className="edit-app-error-content">
                    <div className="edit-app-error-icon">
                        <FaExclamationCircle />
                    </div>
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button 
                        onClick={() => navigate(`/view-application/${applicationId}`)}
                        className="edit-app-button"
                    >
                        Back to Application
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`edit-app-container employee-dashboard-container ${isDarkMode ? 'employee-dark-mode' : ''}`}>
            {/* Mobile Nav Overlay */}
            <div className={`employee-mobile-nav-overlay ${showMobileNav ? 'active' : ''}`} onClick={() => setShowMobileNav(false)}></div>

            {/* Header - Matches EmployeeDashboard */}
            <header className="employee-dashboard-header">
                <div className="employee-dashboard-header-container">
                    <div className="employee-dashboard-header-left">
                        <button 
                            className={`employee-dashboard-nav-toggle ${showMobileNav ? 'active' : ''}`}
                            onClick={toggleMobileNav}
                            aria-label="Toggle navigation"
                            aria-expanded={showMobileNav}
                        >
                            <span className="employee-hamburger-icon"></span>
                        </button>
                        <Link to="/employee-dashboard" className="employee-dashboard-logo">
                            <img 
                                src={isDarkMode ? logoDark : logoLight} 
                                alt="Next Youth" 
                                className="employee-logo-image" 
                            />
                        </Link>
                        
                        <nav className={`employee-dashboard-nav ${showMobileNav ? 'active' : ''}`}>
                            <Link to="/find-jobs" className="employee-nav-link" style={{"--item-index": 0}}>Find Work</Link>
                            <Link to="/find-jobs/saved" className="employee-nav-link" style={{"--item-index": 1}}>Saved Jobs</Link>
                            <Link to="/proposals" className="employee-nav-link" style={{"--item-index": 2}}>Proposals</Link>
                            <Link to="/help" className="employee-nav-link" style={{"--item-index": 3}}>Help</Link>
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
                                                <p>New job matching your skills is available</p>
                                                <span className="employee-notification-time">1 day ago</span>
                                            </div>
                                        </div>
                                        <div className="employee-notification-item employee-unread">
                                            <div className="employee-notification-icon">
                                                <FaRegFileAlt />
                                            </div>
                                            <div className="employee-notification-content">
                                                <p>Your application is under review</p>
                                                <span className="employee-notification-time">2 days ago</span>
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
                                {user.profilePicture ? (
                                    <img 
                                        src={user.profilePicture}
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
                                            {user.profilePicture ? (
                                                <img 
                                                    src={user.profilePicture}
                                                    alt={`${user.name}'s profile`}
                                                />
                                            ) : (
                                                <FaUserCircle />
                                            )}
                                        </div>
                                        <div className="employee-profile-dropdown-info">
                                            <h4>{user.name || 'User'}</h4>
                                            <span className="employee-profile-status">
                                                {!user.idVerification ? (
                                                    'Not Verified'
                                                ) : user.idVerification.status === 'verified' ? (
                                                    <><FaCheckCircle className="employee-verified-icon" /> Verified</>
                                                ) : user.idVerification.status === 'pending' && user.idVerification.frontImage && user.idVerification.backImage ? (
                                                    <><FaClock className="employee-pending-icon" /> Verification Pending</>
                                                ) : user.idVerification.status === 'rejected' ? (
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

            <div className="edit-app-main">
                {/* Back to application button */}
                <div className="edit-app-back-container">
                    <button 
                        className="edit-app-back"
                        onClick={() => navigate(`/view-application/${applicationId}`)}
                    >
                        <FaArrowLeft /> Back to Application
                    </button>
                </div>

                {/* Application header */}
                <div className="edit-app-page-header">
                    <div className="edit-app-header-content">
                        <h1>Edit Your Application</h1>
                        <p className="edit-app-subtitle">
                            {job && `For: ${job.title}`}
                        </p>
                    </div>
                    <div className="edit-app-header-icon">
                        <FaBriefcase />
                    </div>
                </div>

                {/* Job Details Section */}
                {job && (
                    <div className="edit-app-card job-details-card">
                        <div className="edit-app-card-header">
                            <div className="edit-app-card-icon job-icon">
                                <FaFileContract />
                            </div>
                            <h2>Job Details</h2>
                        </div>
                        
                        <div className="edit-app-card-body">
                            <h3 className="job-title">{job.title}</h3>
                            
                            <div className="job-info-grid">
                                <div className="job-info-item">
                                    <div className="job-info-icon budget-icon">
                                        <FaDollarSign />
                                    </div>
                                    <div className="job-info-content">
                                        <span className="job-info-label">Budget:</span>
                                        <span className="job-info-value">
                                            {job.budgetType === "hourly"
                                                ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
                                                : `$${job.fixedAmount} Fixed`}
                                        </span>
                                    </div>
                                </div>
                                <div className="job-info-item">
                                    <div className="job-info-icon scope-icon">
                                        <FaClock />
                                    </div>
                                    <div className="job-info-content">
                                        <span className="job-info-label">Scope:</span>
                                        <span className="job-info-value">{job.scope}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="job-description">
                                <h4>Description</h4>
                                <div className="job-description-content">
                                    <p>{job.description}</p>
                                </div>
                            </div>
                            
                            <div className="job-skills">
                                <h4>Required Skills</h4>
                                <div className="skills-tags">
                                    {job.skills?.map((skill, index) => (
                                        <span key={index} className="skill-tag">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Form */}
                <form onSubmit={handleSubmit}>
                    <div className="edit-app-card payment-card">
                        <div className="edit-app-card-header">
                            <div className="edit-app-card-icon payment-icon">
                                <FaDollarSign />
                            </div>
                            <h2>Update Terms & Payment</h2>
                        </div>
                        
                        <div className="edit-app-card-body">
                            <div className="form-group">
                                <h4><FaDollarSign /> Your Bid (Total Amount)</h4>
                                <div className="input-wrapper">
                                    <input
                                        type="number"
                                        id="bid"
                                        name="bid"
                                        value={formData.bid}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <h4><FaDollarSign /> You'll Receive</h4>
                                <div className="input-wrapper highlighted">
                                    <input
                                        type="number"
                                        id="receivedAmount"
                                        name="receivedAmount"
                                        value={formData.receivedAmount}
                                        disabled
                                    />
                                </div>
                                <div className="input-hint">This is the amount after {serviceFeePercentage}% platform fee</div>
                            </div>

                            <div className="form-group">
                                <h4><FaClock /> Estimated Duration</h4>
                                <div className="select-wrapper">
                                    <select
                                        id="duration"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select duration</option>
                                        <option value="less than 1 month">Less than 1 month</option>
                                        <option value="1-3 months">1-3 months</option>
                                        <option value="3-6 months">3-6 months</option>
                                        <option value="more than 6 months">More than 6 months</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="edit-app-card details-card">
                        <div className="edit-app-card-header">
                            <div className="edit-app-card-icon details-icon">
                                <FaCommentDots />
                            </div>
                            <h2>Additional Details</h2>
                        </div>
                        
                        <div className="edit-app-card-body">
                            <div className="form-group">
                                <h4>Cover Letter</h4>
                                <div className="textarea-wrapper">
                                    <textarea
                                        id="coverLetter"
                                        name="coverLetter"
                                        value={formData.coverLetter}
                                        onChange={handleInputChange}
                                        rows="6"
                                        placeholder="Explain why you're the best fit for this job"
                                    />
                                </div>
                                <div className="character-counter">
                                    {formData.coverLetter?.length || 0}/5000 characters
                                </div>
                            </div>

                            <div className="form-group">
                                <h4><FaUpload /> Add More Attachments</h4>
                                <input
                                    type="file"
                                    id="attachments"
                                    name="attachments"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    type="button" 
                                    className="file-upload-button"
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <FaUpload /> Select Files
                                </button>
                                
                                {files.length > 0 && (
                                    <div className="files-container">
                                        <h4>New Files to Upload</h4>
                                        <ul className="files-list">
                                            {files.map((file, index) => (
                                                <li key={index} className="file-item">
                                                    <div className="file-item-icon">
                                                        <FaRegFileAlt />
                                                    </div>
                                                    <span className="file-item-name">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        className="file-remove-button"
                                                        onClick={() => removeFile(index)}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {existingFiles.length > 0 && (
                                <div className="files-container existing-files">
                                    <h4>Current Attachments</h4>
                                    <div className="files-list">
                                        {existingFiles.map((file, index) => (
                                            <a 
                                                key={index}
                                                href={file.path} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="attachment-link"
                                            >
                                                <div className="attachment-icon">
                                                    <FaRegFileAlt />
                                                </div>
                                                <span className="attachment-name">{file.filename}</span>
                                                <div className="download-icon">
                                                    <FaDownload />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                    <div className="files-note">Note: Your existing attachments will be kept</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="edit-app-actions">
                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate(`/view-application/${applicationId}`)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="update-button"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <FaSpinner className="spinning" /> Updating...
                                </>
                            ) : (
                                'Update Application'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            
            <footer className="edit-app-footer">
                <div className="edit-app-footer-content">
                    <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
                </div>
            </footer>

            {showRatingModal && (
                <RatingModal
                    isOpen={true}
                    onClose={() => setShowRatingModal(false)}
                    viewOnly={true}
                />
            )}
        </div>
    );
};

export default EditApplication;
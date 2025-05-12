import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlus, FaMinus, FaFileUpload, FaRegFileAlt, 
         FaSpinner, FaExclamationCircle, FaTimes, FaCheckCircle, 
         FaUserCircle, FaBell, FaSun, FaMoon, FaChevronDown, FaDownload,
         FaBriefcase, FaFileContract, FaCommentDots, FaDollarSign, FaClock, 
         FaStar, FaEdit, FaBars, FaSearch, FaFilter, FaAngleRight, FaAngleLeft,
         FaBookmark, FaCog, FaSignOutAlt } from 'react-icons/fa';
import './JobApplication.css';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const JobApplication = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Application form data
    const [bid, setBid] = useState(''); // Changed from 0 to empty string
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [duration, setDuration] = useState(''); // Remove default selection
    const [coverLetter, setCoverLetter] = useState('');
    const [files, setFiles] = useState([]);
    const [fileErrors, setFileErrors] = useState([]);
    
    // Service fee percentage (changed from 20% to 5%)
    const serviceFeePercentage = 5;
    
    // References
    const fileInputRef = useRef();

    // Header state
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("dashboard-theme");
        return savedTheme === "dark";
    });
    const [userData, setUserData] = useState({
        name: '',
        profilePicture: '',
        idVerification: null
    });
    const profileDropdownRef = useRef(null);
    const notificationsRef = useRef(null);

    // Add these state variables with your existing useState declarations
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [applicationData, setApplicationData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // Add the unreadNotifications state
    const [unreadNotifications, setUnreadNotifications] = useState(() => {
        return parseInt(localStorage.getItem("unread-notifications") || "2");
    });

    const [showRatingModal, setShowRatingModal] = useState(false);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setShowProfileDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
            if (!e.target.closest('.employee-find-jobs-nav') && 
                !e.target.closest('.employee-find-jobs-nav-toggle')) {
                setShowMobileNav(false);
                
                // Also remove active class from hamburger when clicked outside
                const navToggle = document.querySelector('.employee-find-jobs-nav-toggle');
                if (navToggle) navToggle.classList.remove('active');
                
                document.body.classList.remove('job-application-mobile-nav-active');
            }
        };
        
        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    // Apply dark mode
    useEffect(() => {
        const container = document.querySelector('.job-application-container');
        if (container) {
            container.classList.toggle('dark-mode', isDarkMode);
        }
        localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    // Add this useEffect to handle body class and cleanup
    useEffect(() => {
        // Clean up function for when component unmounts or mobile nav closes
        return () => {
            document.body.classList.remove('job-application-mobile-nav-active');
        };
    }, []);

    // Fetch user data for header
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Make parallel requests to get both user data and verification status
                const [userResponse, verificationResponse] = await Promise.all([
                    axios.get("API_BASE_URL/auth/me", { withCredentials: true }),
                    axios.get("API_BASE_URL/auth/verification-status", { withCredentials: true })
                ]);
                
                if (userResponse.data.success) {
                    const userData = userResponse.data.user;
                    
                    // Process verification data properly
                    let verificationData = null;
                    let verificationStatus = null;
                    
                    if (verificationResponse.data.success) {
                        if (verificationResponse.data.verification) {
                            verificationData = verificationResponse.data.verification;
                            verificationStatus = verificationData.status;
                        }
                    }
                    
                    // Update user data state with proper verification structure
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
    }, [navigate]);

    // Header functions
    const toggleMobileNav = (e) => {
        e.stopPropagation();
        
        // Toggle active class on nav toggle button for animation
        const navToggle = document.querySelector('.employee-find-jobs-nav-toggle');
        navToggle.classList.toggle('active');
        
        setShowMobileNav(prev => !prev);
        
        // Update body class to prevent scrolling when nav is open
        if (!showMobileNav) {
            document.body.classList.add('job-application-mobile-nav-active');
        } else {
            document.body.classList.remove('job-application-mobile-nav-active');
        }
    };

    const toggleProfileDropdown = (e) => {
        e.stopPropagation();
        setShowProfileDropdown(prev => !prev);
    };

    const toggleNotifications = (e) => {
        e.stopPropagation();
        setShowNotifications(prev => !prev);
    };

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    const handleLogout = async () => {
        try {
            const response = await axios.post("API_BASE_URL/auth/logout", {}, { 
                withCredentials: true 
            });
            if (response.data.success) navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Fetch job details
    useEffect(() => {
        const fetchJobDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`API_BASE_URL/jobs/available`, { 
                    withCredentials: true 
                });
                
                if (response.data.success) {
                    const jobData = response.data.jobs.find(j => j._id === jobId);
                    if (jobData) {
                        setJob(jobData);
                        // Remove the automatic bid setting code
                    } else {
                        setError("Job not found");
                    }
                } else {
                    setError("Failed to load job details");
                }
            } catch (err) {
                console.error("Error fetching job:", err);
                setError("Error loading job details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();
    }, [jobId]);

    // Calculate amount received after service fees
    const calculateReceivedAmount = (bidAmount) => {
        const fee = (bidAmount * serviceFeePercentage) / 100;
        setReceivedAmount(bidAmount - fee);
    };

    // Handle bid amount changes
    const handleBidChange = (amount) => {
        const newBid = Math.max(1, amount); // Ensure bid is at least $1
        setBid(newBid);
        calculateReceivedAmount(newBid);
    };

    // Increase/decrease bid by $1 (changed from $5)
    const adjustBid = (increment) => {
        const step = 1; // Changed from 5 to 1
        const newBid = increment 
            ? Math.round((bid + step) * 100) / 100 
            : Math.round(Math.max(1, bid - step) * 100) / 100;
        
        handleBidChange(newBid);
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const errors = [];
        const validFiles = [];
        
        // Check each file for type and size
        selectedFiles.forEach(file => {
            const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!allowedTypes.includes(file.type)) {
                errors.push(`File "${file.name}" is not an allowed type. Please upload only PNG, JPG or PDF files.`);
            } else if (file.size > maxSize) {
                errors.push(`File "${file.name}" exceeds 5MB size limit.`);
            } else {
                validFiles.push(file);
            }
        });
        
        if (errors.length) {
            setFileErrors(errors);
        } else {
            setFileErrors([]);
            setFiles(prevFiles => [...prevFiles, ...validFiles]);
        }
    };

    // Remove a selected file
    const removeFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    // Add these handler functions to your component
    const handleEditApplication = () => {
        setIsEditing(true);
        navigate(`/edit-application/${jobId}`);
    };

    const handleDeleteConfirmation = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteApplication = async () => {
        try {
            setSubmitting(true);
            const response = await axios.delete(
                `API_BASE_URL/jobs/application/${jobId}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                alert("Application deleted successfully");
                navigate('/find-jobs/proposals');
            } else {
                setError(response.data.message || "Failed to delete application");
            }
        } catch (err) {
            console.error("Error deleting application:", err);
            setError(err.response?.data?.message || "An error occurred while deleting your application");
        } finally {
            setSubmitting(false);
            setShowDeleteModal(false);
        }
    };

    const [bidError, setBidError] = useState('');
    const [durationError, setDurationError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setError('');
        setBidError('');
        setDurationError('');
        
        let hasError = false;
        
        if (!bid || bid <= 0) {
            setBidError("Please enter your bid amount");
            document.getElementById('bid').focus();
            document.querySelector('.bid-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
            hasError = true;
        }
        
        if (!duration) {
            setDurationError("Choose an option");
            if (!hasError) {
                const durationSection = document.querySelector('.duration-selection');
                
                if (durationSection) {
                    console.log("Duration section found:", durationSection);
                    
                    durationSection.classList.add('highlight-animation');
                    
                    setTimeout(() => {
                        durationSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center'
                        });
                    }, 100);
                    
                    setTimeout(() => {
                        durationSection.classList.remove('highlight-animation');
                    }, 2000);
                } else {
                    console.log("Duration section not found by class, trying alternative selector");
                    const alternativeDurationSection = document.querySelector('div.duration-options').closest('.duration-selection');
                    if (alternativeDurationSection) {
                        alternativeDurationSection.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center'
                        });
                    }
                }
            }
            hasError = true;
        }
        
        if (hasError) return;
        
        if (coverLetter && coverLetter.length > 5000) {
            setError("Cover letter exceeds 5000 character limit");
            document.querySelector('.cover-letter-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        try {
            setSubmitting(true);
            
            const formData = new FormData();
            formData.append('jobId', jobId);
            formData.append('bid', bid);
            formData.append('receivedAmount', receivedAmount);
            formData.append('duration', duration);
            formData.append('coverLetter', coverLetter || '');
            
            if (files.length > 0) {
                files.forEach(file => {
                    formData.append('attachments', file);
                });
            }
            
            console.log("Submitting application with data:", {
                jobId, bid, receivedAmount, duration, 
                coverLetterLength: coverLetter ? coverLetter.length : 0,
                filesCount: files.length
            });
            
            const response = await axios.post(
                'API_BASE_URL/jobs/apply-with-details',
                formData,
                { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            
            console.log("Application response:", response.data);
            
            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate(`/view-application/${response.data.application._id}`);
                }, 2000);
            } else {
                setError(response.data.message || "Failed to submit application");
            }
        } catch (err) {
            console.error("Error submitting application:", err);
            setError(err.response?.data?.message || "An error occurred while submitting your application");
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkAllAsRead = (e) => {
        e.stopPropagation();
        setUnreadNotifications(0);
        localStorage.setItem("unread-notifications", "0");
    };

    if (loading) {
        return (
            <div className="job-application-container">
                <div className="application-loading">
                    <FaSpinner className="spinning" />
                    <p>Loading job details...</p>
                </div>
            </div>
        );
    }

    if (error && !job) {
        return (
            <div className="job-application-container">
                <div className="application-error">
                    <FaExclamationCircle />
                    <h3>Error</h3>
                    <p>{error}</p>
                    <button onClick={() => navigate('/find-jobs')}>Back to Jobs</button>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="job-application-container">
                <div className="application-error">
                    <FaExclamationCircle />
                    <h3>Job Not Found</h3>
                    <p>The job you're looking for doesn't exist or has been removed.</p>
                    <button onClick={() => navigate('/find-jobs')}>Back to Jobs</button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="job-application-container">
                <div className="application-success">
                    <FaCheckCircle />
                    <h3>Application Submitted!</h3>
                    <p>Your application has been successfully submitted.</p>
                    <p>Redirecting to your proposals...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="job-application-container">
            {/* Mobile Nav Overlay */}
            <div className={`employee-mobile-nav-overlay ${showMobileNav ? 'active' : ''}`} onClick={() => setShowMobileNav(false)}></div>
            
            {/* Header - Styled like FindJobs.js */}
            <header className="employee-find-jobs-header">
                <div className="employee-find-jobs-header-container">
                    <div className="employee-find-jobs-header-left">
                        <button 
                            className={`employee-find-jobs-nav-toggle ${showMobileNav ? 'active' : ''}`}
                            onClick={toggleMobileNav}
                            aria-label="Toggle navigation"
                            aria-expanded={showMobileNav}
                        >
                            <span className="employee-hamburger-icon"></span>
                        </button>
                        <Link to="/employee-dashboard" className="employee-find-jobs-logo">
                            <img 
                                src={isDarkMode ? logoDark : logoLight} 
                                alt="Next Youth" 
                                className="employee-logo-image" 
                            />
                        </Link>
                        
                        <nav className={`employee-find-jobs-nav ${showMobileNav ? 'active' : ''}`}>
                            <Link to="/find-jobs" className="employee-nav-link active" style={{"--item-index": 0}}>Find Work</Link>
                            <Link to="/find-jobs/saved" className="employee-nav-link" style={{"--item-index": 1}}>Saved Jobs</Link>
                            <Link to="/proposals" className="employee-nav-link" style={{"--item-index": 2}}>Proposals</Link>
                            <Link to="/help" className="employee-nav-link" style={{"--item-index": 3}}>Help</Link>
                        </nav>
                    </div>
                    
                    <div className="employee-find-jobs-header-right">
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
                            
                            {/* Updated notification content */}
                            {showNotifications && (
                                <div className="employee-profile-notifications-dropdown">
                                    <div className="employee-profile-notification-header">
                                        <h3>Notifications</h3>
                                        <button className="employee-profile-mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                                    </div>
                                    <div className="employee-profile-notification-list">
                                        <div className="employee-profile-notification-item employee-profile-unread">
                                            <div className="employee-profile-notification-icon">
                                                {(!userData.idVerification || 
                                                  !userData.idVerification.frontImage || 
                                                  !userData.idVerification.backImage || 
                                                  userData.idVerification.status === 'rejected') ? (
                                                    <FaRegFileAlt />
                                                ) : userData.idVerification.status === 'verified' ? (
                                                    <FaCheckCircle />
                                                ) : (
                                                    <FaClock />
                                                )}
                                            </div>
                                            <div className="employee-profile-notification-content">
                                                <p>
                                                    {(!userData.idVerification || 
                                                      !userData.idVerification.frontImage || 
                                                      !userData.idVerification.backImage || 
                                                      userData.idVerification.status === 'rejected') ? (
                                                        "Please verify your account"
                                                    ) : userData.idVerification.status === 'verified' ? (
                                                        "Your profile has been verified!"
                                                    ) : (
                                                        "Your verification is pending approval"
                                                    )}
                                                </p>
                                                <span className="employee-profile-notification-time">2 hours ago</span>
                                            </div>
                                        </div>
                                        <div className="employee-profile-notification-item employee-profile-unread">
                                            <div className="employee-profile-notification-icon">
                                                <FaRegFileAlt />
                                            </div>
                                            <div className="employee-profile-notification-content">
                                                <p>New job matching your skills is available</p>
                                                <span className="employee-profile-notification-time">1 day ago</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="employee-profile-notification-footer">
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
                                {userData.profilePicture ? (
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
                            
                            {/* Updated verification status display in profile dropdown */}
                            {showProfileDropdown && (
                                <div className="employee-profile-dropdown">
                                    <div className="employee-profile-dropdown-header">
                                        <div className="employee-profile-dropdown-avatar">
                                            {userData.profilePicture ? (
                                                <img 
                                                    src={userData.profilePicture}
                                                    alt={`${userData.name}'s profile`}
                                                />
                                            ) : (
                                                <FaUserCircle />
                                            )}
                                        </div>
                                        <div className="employee-profile-dropdown-info">
                                            <h4>{userData.name || 'User'}</h4>
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
                                        
                                        {(!userData.idVerification || 
                                          !userData.idVerification.frontImage || 
                                          !userData.idVerification.backImage || 
                                          userData.idVerification.status === 'rejected') && (
                                            <button 
                                                className="employee-profile-dropdown-link"
                                                onClick={() => navigate('/verify-account')}
                                            >
                                                <FaRegFileAlt /> Verify Account
                                            </button>
                                        )}
                                        
                                        <button 
                                            className="employee-profile-dropdown-link"
                                            onClick={() => {
                                                setShowProfileDropdown(false); // Close dropdown
                                                setShowRatingModal(true); // Show rating modal
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

            <main className="job-application-main">
                <div className="job-application-content">
                    {/* Back to dashboard button */}
                    <button 
                        className="back-to-dashboard-button"
                        onClick={() => navigate('/find-jobs')}
                    >
                        <FaArrowLeft /> Back to Jobs
                    </button>

                    {/* Enhanced page header with visual appeal */}
                    <div className="application-page-header">
                        <div className="header-content">
                            <h1>Apply for Job Opportunity</h1>
                            <p className="header-subtitle">Complete your application for this exciting opportunity</p>
                        </div>
                        <div className="header-icon">
                            <FaBriefcase />
                        </div>
                    </div>

                    {/* Job Details Section with enhanced visuals */}
                    <div className="job-details-section">
                        <div className="job-highlight-text">
                            <FaClock /> Available Now
                        </div>
                        
                        <div className="job-title-container">
                            <h2 className="job-title">{job?.title}</h2>
                            <div className="job-badges">
                                <span className={`job-badge ${job?.budgetType === "hourly" ? "hourly" : "fixed-price"}`}>
                                    {job?.budgetType === "hourly" ? "Hourly" : "Fixed Price"}
                                </span>
                                <span className={`job-badge ${job?.experienceLevel?.toLowerCase() || "entry"}`}>
                                    {job?.experienceLevel || "Entry Level"}
                                </span>
                            </div>
                        </div>
                        
                        <div className="job-meta-info">
                            <div className="job-meta-item">
                                <FaDollarSign className="job-meta-icon" />
                                <span className="job-meta-label">Budget</span>
                                <span className="job-meta-value">
                                    {job?.budgetType === "hourly"
                                        ? `$${job?.hourlyFrom} - $${job?.hourlyTo}/hr`
                                        : `$${job?.fixedAmount}`}
                                </span>
                            </div>
                            <div className="job-meta-item">
                                <FaRegFileAlt className="job-meta-icon" />
                                <span className="job-meta-label">Posted</span>
                                <span className="job-meta-value">
                                    {new Date(job?.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="job-meta-item">
                                <FaClock className="job-meta-icon" />
                                <span className="job-meta-label">Scope</span>
                                <span className="job-meta-value">{job?.scope}</span>
                            </div>
                        </div>
                        
                        <div className="job-description">
                            <h3 className="job-section-title">Job Description</h3>
                            <p>{job?.description}</p>
                        </div>
                        
                        <div className="job-skills-container">
                            <h3 className="job-section-title">Skills Required</h3>
                            <div className="job-skills-list">
                                {job?.skills?.map((skill, index) => (
                                    <span key={index} className="job-skill-tag">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        {job?.files?.length > 0 && (
                            <div className="job-attachments-container">
                                <h3 className="job-section-title">Attachments</h3>
                                <div className="job-attachments-list">
                                    {job.files.map((file, index) => (
                                        <div key={index} className="job-attachment-item">
                                            <FaRegFileAlt className="attachment-icon" />
                                            <div className="attachment-info">
                                                <span className="attachment-name">{file.filename}</span>
                                                <span className="attachment-size">
                                                    {Math.round(file.size / 1024)} KB
                                                </span>
                                            </div>
                                            <a 
                                                href={file.path}
                                                download
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="attachment-download"
                                            >
                                                <FaDownload />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Application Form with enhanced visuals */}
                    <form onSubmit={handleSubmit} className="application-form-section">
                        <h2 className="application-form-title">Your Application</h2>
                        
                        <div className="form-info-banner">
                            <p>
                                <strong>Important:</strong> Your application details will be shared with the client. 
                                Provide a competitive bid and highlight your relevant skills and experience.
                            </p>
                        </div>
                        
                        <div className="form-group budget-form-group">
                            <label htmlFor="bid" className="form-label">Your Bid Amount <span className="required">*</span></label>
                            <div className={`budget-input-container ${bidError ? 'error' : ''}`}>
                                <span className="currency-symbol">$</span>
                                <input
                                    id="bid"
                                    type="number"
                                    className="form-input budget-input"
                                    value={bid}
                                    min="1"
                                    step="0.01"
                                    onChange={(e) => {
                                        handleBidChange(Number(e.target.value) || '');
                                        if (bidError) setBidError('');
                                    }}
                                    required
                                    placeholder="Enter your bid"
                                />
                                <div className="bid-buttons">
                                    <button 
                                        type="button" 
                                        onClick={() => adjustBid(false)}
                                        className="bid-adjust-button"
                                    >
                                        <FaMinus />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => adjustBid(true)}
                                        className="bid-adjust-button"
                                    >
                                        <FaPlus />
                                    </button>
                                </div>
                            </div>
                            {bidError && <div className="form-error">{bidError}</div>}
                            
                            <div className="service-fee-info">
                                <div className="fee-item">
                                    <span>Service Fee ({serviceFeePercentage}%)</span>
                                    <span>-${((bid * serviceFeePercentage) / 100).toFixed(2)}</span>
                                </div>
                                <div className="fee-item total">
                                    <span>You'll Receive</span>
                                    <span>${receivedAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                            
                        <div className="form-group">
                            <label className="form-label">Project Duration <span className="required">*</span></label>
                            <div className={`duration-selection ${durationError ? 'error' : ''}`}>
                                {['less than 1 month', '1-3 months', '3-6 months', 'more than 6 months'].map((option) => (
                                    <div
                                        key={option}
                                        className={`duration-option ${duration === option ? 'selected' : ''}`}
                                        onClick={() => {
                                            setDuration(option);
                                            if (durationError) setDurationError('');
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="duration"
                                            value={option}
                                            checked={duration === option}
                                            onChange={(e) => {
                                                setDuration(e.target.value);
                                                if (durationError) setDurationError('');
                                            }}
                                            required
                                        />
                                        <span>{option}</span>
                                    </div>
                                ))}
                            </div>
                            {durationError && <div className="form-error">{durationError}</div>}
                        </div>
                        
                        <div className="form-group cover-letter-section">
                            <div className="cover-letter-header">
                                <label htmlFor="coverLetter" className="form-label">Cover Letter</label>
                                <span className={`letter-counter ${coverLetter.length > 4500 ? 'limit-warning' : ''}`}>
                                    {coverLetter.length}/5000
                                </span>
                            </div>
                            <textarea
                                id="coverLetter"
                                className="form-textarea"
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                placeholder="Introduce yourself and explain why you're a good fit for this job..."
                                maxLength={5000}
                            ></textarea>
                            <p className="form-hint">
                                A good cover letter highlights your relevant skills and experience. 
                                Be specific about how your qualifications match the job requirements.
                            </p>
                        </div>
                        
                        <div className="form-group">
                            <label className="form-label">Attachments</label>
                            <div 
                                className="file-upload-container"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <FaFileUpload className="file-upload-icon" />
                                <p className="file-upload-text">Upload files to support your application</p>
                                <p className="file-upload-hint">
                                    Click or drag files here. PNG, JPG, PDF (Max 5MB each)
                                </p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    multiple
                                    className="file-upload-input"
                                />
                            </div>
                            
                            {fileErrors.length > 0 && (
                                <div className="file-errors">
                                    {fileErrors.map((errorMsg, index) => (
                                        <div key={index} className="form-error">{errorMsg}</div>
                                    ))}
                                </div>
                            )}
                            
                            {files.length > 0 && (
                                <div className="uploaded-files-container">
                                    {files.map((file, index) => (
                                        <div key={index} className="uploaded-file">
                                            <FaRegFileAlt className="file-icon" />
                                            <div className="file-info">
                                                <div className="file-name">{file.name}</div>
                                                <div className="file-size">
                                                    {Math.round(file.size / 1024)} KB
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(index)}
                                                className="file-remove"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="form-error-container">
                                <FaExclamationCircle />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-actions">
                            <button
                                type="button"
                                onClick={() => navigate(`/find-jobs/details/${jobId}`)}
                                className="form-button secondary"
                            >
                                Cancel
                            </button>
                            
                            <button
                                type="submit"
                                className="form-button primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <FaSpinner className="spinning" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Application'
                                )}
                            </button>
                        </div>
                    </form>
                    
                    {/* Tips Section - Minimalistic Professional Style */}
                    <div className="application-tips-section">
                        <h2 className="tips-title">Applying With Success</h2>
                        <div className="application-tips-grid">
                            <div className="application-tip-card">
                                <div className="application-tip-number">1</div>
                                <div className="application-tip-content">
                                    <h3>Set a Competitive Bid</h3>
                                    <p>Research market rates for similar projects to make your bid attractive while ensuring fair compensation for your skills.</p>
                                </div>
                            </div>
                            <div className="application-tip-card">
                                <div className="application-tip-number">2</div>
                                <div className="application-tip-content">
                                    <h3>Personalize Your Approach</h3>
                                    <p>Customize your cover letter to address the client's specific needs and demonstrate your understanding of the project.</p>
                                </div>
                            </div>
                            <div className="application-tip-card">
                                <div className="application-tip-number">3</div>
                                <div className="application-tip-content">
                                    <h3>Showcase Relevant Experience</h3>
                                    <p>Include work samples that directly relate to the skills and requirements mentioned in the job description.</p>
                                </div>
                            </div>
                            <div className="application-tip-card">
                                <div className="application-tip-number">4</div>
                                <div className="application-tip-content">
                                    <h3>Be Clear and Concise</h3>
                                    <p>Present your qualifications clearly and avoid unnecessary details that might dilute your core strengths.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer - Styled like FindJobs.js */}
            <footer className="employee-find-jobs-footer">
                <div className="employee-find-jobs-footer-container">
                    <div className="employee-footer-copyright">
                        <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
                    </div>
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

export default JobApplication;
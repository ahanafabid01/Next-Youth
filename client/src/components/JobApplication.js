import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaPlus, FaMinus, FaFileUpload, FaRegFileAlt, 
         FaSpinner, FaExclamationCircle, FaTimes, FaCheckCircle, 
         FaUserCircle, FaBell, FaSun, FaMoon, FaChevronDown, FaDownload,
         FaBriefcase, FaFileContract, FaCommentDots, FaDollarSign, FaClock } from 'react-icons/fa';
import './JobApplication.css';

const JobApplication = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    
    // Application form data
    const [bid, setBid] = useState(0);
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [duration, setDuration] = useState('less than 1 month');
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
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    // Apply dark mode
    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    // Fetch user data for header
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const employeeResponse = await axios.get("http://localhost:4000/api/auth/employee-profile", { 
                    withCredentials: true 
                });
                
                if (employeeResponse.data.success) {
                    const userData = employeeResponse.data.profile;
                    setUserData({
                        name: userData.name || '',
                        profilePicture: userData.profilePicture || '',
                        idVerification: userData.idVerification || null
                    });
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    // Header functions
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

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
    };

    const handleLogout = async () => {
        try {
            const response = await axios.post("http://localhost:4000/api/auth/logout", {}, { 
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
                const response = await axios.get(`http://localhost:4000/api/jobs/available`, { 
                    withCredentials: true 
                });
                
                if (response.data.success) {
                    const jobData = response.data.jobs.find(j => j._id === jobId);
                    if (jobData) {
                        setJob(jobData);
                        
                        // Set initial bid amount based on job budget
                        if (jobData.budgetType === 'fixed') {
                            setBid(jobData.fixedAmount);
                            calculateReceivedAmount(jobData.fixedAmount);
                        } else {
                            // For hourly jobs, set a reasonable default
                            const avgHourly = (Number(jobData.hourlyFrom) + Number(jobData.hourlyTo)) / 2;
                            setBid(avgHourly * 40); // Assuming 40 hours of work
                            calculateReceivedAmount(avgHourly * 40);
                        }
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

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form
        if (coverLetter.length > 5000) {
            setError("Cover letter exceeds 5000 character limit");
            return;
        }
        
        if (bid <= 0) {
            setError("Please enter a valid bid amount");
            return;
        }
        
        try {
            setSubmitting(true);
            setError('');
            
            // Prepare form data for file upload
            const formData = new FormData();
            formData.append('jobId', jobId);
            formData.append('bid', bid);
            formData.append('receivedAmount', receivedAmount);
            formData.append('duration', duration);
            formData.append('coverLetter', coverLetter);
            
            // Add files to form data
            files.forEach(file => {
                formData.append('attachments', file);
            });
            
            // Submit application
            const response = await axios.post(
                'http://localhost:4000/api/jobs/apply-with-details',
                formData,
                { 
                    withCredentials: true,
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );
            
            if (response.data.success) {
                setSuccess(true);
                // Redirect after success message is shown
                setTimeout(() => {
                    navigate('/find-jobs/proposals');
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

    if (loading) {
        return (
            <div className="application-loading">
                <FaSpinner className="spinning" />
                <p>Loading job details...</p>
            </div>
        );
    }

    if (error && !job) {
        return (
            <div className="application-error">
                <FaExclamationCircle />
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => navigate('/find-jobs')}>Back to Jobs</button>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="application-error">
                <FaExclamationCircle />
                <h3>Job Not Found</h3>
                <p>The job you're looking for doesn't exist or has been removed.</p>
                <button onClick={() => navigate('/find-jobs')}>Back to Jobs</button>
            </div>
        );
    }

    if (success) {
        return (
            <div className="application-success">
                <FaCheckCircle />
                <h3>Application Submitted!</h3>
                <p>Your application has been successfully submitted.</p>
                <p>Redirecting to your proposals...</p>
            </div>
        );
    }

    return (
        <div className={`employee-dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Header with Navigation */}
            <header className="dashboard-header">
                <div className="dashboard-header-container">
                    <div className="dashboard-header-left">
                        <button 
                            className="dashboard-nav-toggle"
                            onClick={toggleMobileNav}
                            aria-label="Toggle navigation"
                        >
                            ☰
                        </button>
                        <Link to="/" className="dashboard-logo">Next Youth</Link>
                        
                        <nav className={`dashboard-nav ${showMobileNav ? 'active' : ''}`}>
                            <Link to="/find-jobs" className="nav-link">Find Work</Link>
                            <Link to="/find-jobs/saved" className="nav-link">Saved Jobs</Link>
                            <Link to="/find-jobs/proposals" className="nav-link">Proposals</Link>
                        </nav>
                    </div>
                    
                    <div className="dashboard-header-right">
                        <div className="notifications-container" ref={notificationsRef}>
                            <button 
                                className="notifications-button"
                                onClick={toggleNotifications}
                                aria-label="Notifications"
                            >
                                <FaBell />
                                <span className="notification-badge">2</span>
                            </button>
                            
                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h3>Notifications</h3>
                                    </div>
                                    <div className="notifications-list">
                                        <div className="notification-item">
                                            <div className="notification-icon">
                                                <FaCheckCircle />
                                            </div>
                                            <div className="notification-content">
                                                <p>Your profile has been verified</p>
                                                <span className="notification-time">Just now</span>
                                            </div>
                                        </div>
                                        <div className="notification-item">
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
                        
                        <button
                            className="theme-toggle-button"
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? <FaSun /> : <FaMoon />}
                        </button>

                        <div className="profile-dropdown-container" ref={profileDropdownRef}>
                            <button 
                                className="profile-button" 
                                onClick={toggleProfileDropdown}
                                aria-label="User profile"
                            >
                                {userData.profilePicture ? (
                                    <img 
                                        src={userData.profilePicture}
                                        alt="Profile"
                                        className="profile-avatar"
                                    />
                                ) : (
                                    <FaUserCircle className="profile-avatar-icon" />
                                )}
                                <FaChevronDown className={`dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
                            </button>
                            
                            {showProfileDropdown && (
                                <div className="profile-dropdown">
                                    <div className="profile-dropdown-header">
                                        <div className="profile-dropdown-avatar">
                                            {userData.profilePicture ? (
                                                <img 
                                                    src={userData.profilePicture}
                                                    alt={`${userData.name}'s profile`}
                                                />
                                            ) : (
                                                <FaUserCircle />
                                            )}
                                        </div>
                                        <div className="profile-dropdown-info">
                                            <h4>{userData.name || 'User'}</h4>
                                            <span className="profile-status">
                                                {!userData.idVerification ? (
                                                    'Not Verified'
                                                ) : userData.idVerification.status === 'verified' ? (
                                                    <><FaCheckCircle className="verified-icon" /> Verified</>
                                                ) : userData.idVerification.status === 'pending' ? (
                                                    <><FaSpinner className="pending-icon" /> Verification Pending</>
                                                ) : (
                                                    'Not Verified'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="profile-dropdown-links">
                                        <button 
                                            className="profile-dropdown-link"
                                            onClick={() => navigate('/my-profile')}
                                        >
                                            <FaUserCircle /> View Profile
                                        </button>
                                        
                                        <button 
                                            className="profile-dropdown-link"
                                            onClick={() => navigate('/verify-account')}
                                        >
                                            Verify Account
                                        </button>
                                        
                                        <button 
                                            className="profile-dropdown-link"
                                            onClick={() => navigate('/settings')}
                                        >
                                            Settings
                                        </button>
                                        <button 
                                            className="profile-dropdown-link"
                                            onClick={handleLogout}
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="job-application-container">
                {/* Back to dashboard button */}
                <button 
                    className="back-to-dashboard-button"
                    onClick={() => navigate('/employee-dashboard')}
                >
                    <FaArrowLeft /> Go back to dashboard
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
                <div className="application-section job-details-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaFileContract />
                        </div>
                        <h2>Job Details</h2>
                    </div>
                    
                    <div className="section-content">
                        <h3 className="job-title">{job?.title}</h3>
                        
                        <div className="job-info-grid">
                            <div className="job-info-item">
                                <div className="info-icon">
                                    <FaDollarSign />
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Budget:</span>
                                    <span className="info-value">
                                        {job?.budgetType === "hourly"
                                            ? `$${job?.hourlyFrom} - $${job?.hourlyTo}/hr`
                                            : `$${job?.fixedAmount} Fixed`}
                                    </span>
                                </div>
                            </div>
                            <div className="job-info-item">
                                <div className="info-icon">
                                    <FaClock />
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Scope:</span>
                                    <span className="info-value">{job?.scope}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="job-description-container">
                            <h4>Description</h4>
                            <div className="job-description-content">
                                <p>{job?.description}</p>
                            </div>
                        </div>
                        
                        <div className="job-skills-container">
                            <h4>Required Skills</h4>
                            <div className="skills-list">
                                {job?.skills?.map((skill, index) => (
                                    <span key={index} className="skill-tag">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div className="job-attachments-container">
                            <h4>Client Attachments</h4>
                            {job?.files?.length > 0 ? (
                                <div className="attachments-list">
                                    {job.files.map((file, index) => (
                                        <a 
                                            key={index}
                                            href={file.path} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="attachment-link"
                                            download
                                        >
                                            <FaRegFileAlt />
                                            <span className="attachment-name">{file.filename}</span>
                                            <FaDownload className="download-icon" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-attachments">
                                    <p>No attachments provided by the client.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Application Form with enhanced visuals */}
                <form onSubmit={handleSubmit} className="application-form">
                    <div className="application-section terms-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FaDollarSign />
                            </div>
                            <h2>Terms & Payment</h2>
                        </div>
                        
                        <div className="section-content">
                            <div className="bid-container">
                                <div className="bid-input-group">
                                    <label htmlFor="bid">Your Bid (Total)</label>
                                    <div className="amount-control">
                                        <button 
                                            type="button" 
                                            onClick={() => adjustBid(false)}
                                            className="amount-button"
                                        >
                                            <FaMinus />
                                        </button>
                                        <div className="amount-display">
                                            <span className="currency">$</span>
                                            <input
                                                id="bid"
                                                type="number"
                                                value={bid}
                                                min="1"
                                                step="0.01"
                                                onChange={(e) => handleBidChange(Number(e.target.value))}
                                                required
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => adjustBid(true)}
                                            className="amount-button"
                                        >
                                            <FaPlus />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="service-fee">
                                    <span>Service Fee ({serviceFeePercentage}%)</span>
                                    <span>-${((bid * serviceFeePercentage) / 100).toFixed(2)}</span>
                                </div>
                                
                                <div className="received-amount-group">
                                    <label htmlFor="receivedAmount">You'll Receive</label>
                                    <div className="amount-display received-amount">
                                        <span className="currency">$</span>
                                        <input
                                            id="receivedAmount"
                                            type="number"
                                            value={receivedAmount.toFixed(2)}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="duration-selection">
                                <label>How long will this project take?</label>
                                <div className="duration-options">
                                    {['less than 1 month', '1-3 months', '3-6 months', 'more than 6 months'].map((option) => (
                                        <label key={option} className="duration-option">
                                            <input
                                                type="radio"
                                                name="duration"
                                                value={option}
                                                checked={duration === option}
                                                onChange={(e) => setDuration(e.target.value)}
                                            />
                                            <span>{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="application-section additional-details-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FaCommentDots />
                            </div>
                            <h2>Additional Details</h2>
                        </div>
                        
                        <div className="section-content">
                            <div className="cover-letter-container">
                                <label htmlFor="coverLetter">
                                    Cover Letter
                                    <span className="character-count">
                                        {coverLetter.length}/5000 characters
                                    </span>
                                </label>
                                <textarea
                                    id="coverLetter"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Introduce yourself and explain why you're a good fit for this job..."
                                    maxLength={5000}
                                    required
                                    className={coverLetter.length >= 5000 ? 'limit-reached' : ''}
                                ></textarea>
                            </div>
                            
                            <div className="file-upload-container">
                                <label>Your Attachments</label>
                                <p className="upload-instructions">
                                    Add work samples or other documents to support your application.
                                    Accepted formats: .jpg, .png, .pdf (Max 5MB per file)
                                </p>
                                
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    multiple
                                    style={{ display: 'none' }}
                                />
                                
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current.click()}
                                    className="file-upload-button"
                                >
                                    <FaFileUpload /> Select Files
                                </button>
                                
                                {fileErrors.length > 0 && (
                                    <div className="file-errors">
                                        {fileErrors.map((errorMsg, index) => (
                                            <p key={index} className="error-message">{errorMsg}</p>
                                        ))}
                                    </div>
                                )}
                                
                                {files.length > 0 && (
                                    <div className="selected-files">
                                        <h4>Selected Files</h4>
                                        <ul className="file-list">
                                            {files.map((file, index) => (
                                                <li key={index} className="file-item">
                                                    <FaRegFileAlt />
                                                    <span className="file-name">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="remove-file-button"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="error-container">
                            <FaExclamationCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={() => navigate(`/find-jobs/details/${jobId}`)}
                            className="cancel-button"
                        >
                            Cancel
                        </button>
                        
                        <button
                            type="submit"
                            className="submit-button"
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
            </div>

            {/* Footer Section */}
            <footer className="dashboard-footer">
                <div className="footer-grid">
                    <div className="footer-column">
                        <h3>For Freelancers</h3>
                        <ul>
                            <li><Link to="/find-jobs">Find Work</Link></li>
                            <li><Link to="/resources">Resources</Link></li>
                            <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
                            <li><Link to="/freelancer-forum">Community Forum</Link></li>
                            <li><Link to="/freelancer-stories">Success Stories</Link></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column">
                        <h3>For Employers</h3>
                        <ul>
                            <li><Link to="/hire">Post a Job</Link></li>
                            <li><Link to="/hire/how-it-works">How to Hire</Link></li>
                            <li><Link to="/hire/talent-scouts">Talent Scouts</Link></li>
                            <li><Link to="/hire/enterprise">Enterprise Solutions</Link></li>
                            <li><Link to="/hire/success-stories">Success Stories</Link></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Resources</h3>
                        <ul>
                            <li><Link to="/help-center">Help Center</Link></li>
                            <li><Link to="/webinars">Webinars</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                            <li><Link to="/api-docs">Developer API</Link></li>
                            <li><Link to="/partner-program">Partner Program</Link></li>
                        </ul>
                    </div>
                    
                    <div className="footer-column">
                        <h3>Company</h3>
                        <ul>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/leadership">Leadership</Link></li>
                            <li><Link to="/careers">Careers</Link></li>
                            <li><Link to="/press">Press</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <div className="footer-bottom-container">
                        <div className="footer-logo">
                            <Link to="/">Next Youth</Link>
                        </div>
                        
                        <div className="footer-legal-links">
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/accessibility">Accessibility</Link>
                            <Link to="/sitemap">Site Map</Link>
                        </div>
                        
                        <div className="footer-social">
                            <a href="https://facebook.com" aria-label="Facebook">
                                <i className="fab fa-facebook-f"></i>
                            </a>
                            <a href="https://twitter.com" aria-label="Twitter">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="https://linkedin.com" aria-label="LinkedIn">
                                <i className="fab fa-linkedin-in"></i>
                            </a>
                            <a href="https://instagram.com" aria-label="Instagram">
                                <i className="fab fa-instagram"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div className="footer-copyright">
                        <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default JobApplication;
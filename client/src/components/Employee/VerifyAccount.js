import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config';  // Add this import
import { 
    FaArrowLeft, 
    FaUpload, 
    FaIdCard, 
    FaCheck,
    FaBell,
    FaSun,
    FaMoon,
    FaUserCircle,
    FaChevronDown,
    FaFacebook,
    FaTwitter,
    FaLinkedin,
    FaInstagram,
    FaClock // Add this import
} from 'react-icons/fa';
import './VerifyAccount.css';
import './EmployeeDashboard.css'; // Assuming you have a CSS file for the dashboard styles

const VerifyAccount = () => {
    const navigate = useNavigate();
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Header state
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [user, setUser] = useState({ 
        name: '', 
        profilePicture: '',
        isVerified: false,
        idVerification: null
    });
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("dashboard-theme") === "dark";
    });

    // Refs for dropdowns
    const profileDropdownRef = useRef(null);
    const notificationsRef = useRef(null);

    // Clean up object URLs when component unmounts or when images change
    useEffect(() => {
        return () => {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            if (backPreview) URL.revokeObjectURL(backPreview);
        };
    }, [frontPreview, backPreview]);

    // Handle file selection for front of ID
    const handleFrontImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (frontPreview) URL.revokeObjectURL(frontPreview);
            setFrontImage(file);
            setFrontPreview(URL.createObjectURL(file));
        }
    };

    // Handle file selection for back of ID
    const handleBackImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (backPreview) URL.revokeObjectURL(backPreview);
            setBackImage(file);
            setBackPreview(URL.createObjectURL(file));
        }
    };

    // Submit verification data
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!frontImage || !backImage) {
            setError('Please upload both front and back images of your student ID');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('frontImage', frontImage);
            formData.append('backImage', backImage);
            
            const response = await axios.post(
                `${API_BASE_URL}/auth/verify-identity`,
                formData,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data.success) {
                setSuccess(true);
                // Wait 3 seconds before redirecting
                setTimeout(() => {
                    navigate('/employee-dashboard');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while submitting verification documents');
            console.error('Verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Header functions
    const fetchUserData = useCallback(async () => {
        try {
            const [userResponse, verificationResponse] = await Promise.all([
                axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true }),
                axios.get(`${API_BASE_URL}/auth/verification-status`, { withCredentials: true })
            ]);
            
            if (userResponse.data.success) {
                const userData = userResponse.data.user;
                
                // Check if verification endpoint returned success AND has verification data
                let verificationData = null;
                let verificationStatus = null;
                
                if (verificationResponse.data.success) {
                    // If verification record exists in database
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
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [API_BASE_URL, navigate]);

    const handleOutsideClick = useCallback((event) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
        if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
            setShowProfileDropdown(false);
        }
        if (!event.target.closest('.dashboard-nav')) {
            setShowMobileNav(false);
        }
    }, []);

    const toggleMobileNav = useCallback((e) => {
        e.stopPropagation();
        setShowMobileNav(prev => !prev);
    }, []);

    const toggleProfileDropdown = useCallback((e) => {
        e.stopPropagation();
        setShowProfileDropdown(prev => !prev);
    }, []);

    const toggleNotifications = useCallback((e) => {
        e.stopPropagation();
        setShowNotifications(prev => !prev);
    }, []);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
            if (response.data.success) {
                navigate('/login');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            setError("Logout failed. Please try again.");
        }
    }, [navigate, API_BASE_URL]);

    useEffect(() => {
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [handleOutsideClick]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    const currentYear = new Date().getFullYear();

    return (
        <div className="employee-dashboard verify-page-container">
            {/* Header */}
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
                            <Link to="/help" className="nav-link">Help</Link>
                        </nav>
                    </div>
                    
                    <div className="dashboard-header-right">
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
                                                <FaCheck />
                                            </div>
                                            <div className="notification-content">
                                                <p>Your profile has been verified!</p>
                                                <span className="notification-time">2 hours ago</span>
                                            </div>
                                        </div>
                                        <div className="notification-item unread">
                                            <div className="notification-icon">
                                                <FaIdCard />
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
                                {user.profilePicture ? (
                                    <img 
                                        src={user.profilePicture}
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
                                            {user.profilePicture ? (
                                                <img 
                                                    src={user.profilePicture}
                                                    alt={`${user.name}'s profile`}
                                                />
                                            ) : (
                                                <FaUserCircle />
                                            )}
                                        </div>
                                        <div className="profile-dropdown-info">
                                            <h4>{user.name || 'User'}</h4>
                                            <span className="profile-status">
                                                {!user.idVerification ? (
                                                    'Not Verified'
                                                ) : user.idVerification.status === 'verified' ? (
                                                    <><FaCheck className="verified-icon" /> Verified</>
                                                ) : user.idVerification.status === 'pending' && user.idVerification.frontImage && user.idVerification.backImage ? (
                                                    <><FaClock className="pending-icon" /> Verification Pending</>
                                                ) : user.idVerification.status === 'rejected' ? (
                                                    <>Verification Rejected</>
                                                ) : (
                                                    'Not Verified'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="profile-dropdown-links">
                                        <button 
                                            className="profile-dropdown-link"
                                            onClick={() => navigate('/employee-profile')}
                                        >
                                            <FaUserCircle /> View Profile
                                        </button>
                                        
                                        {/* Show verify account option when appropriate */}
                                        
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

            {/* Main Verify Account Content */}
            <div className="verify-content-wrapper">
                <div className="verify-container">
                    <div className="verify-header">
                        <button 
                            className="back-button" 
                            onClick={() => navigate('/employee-dashboard')}
                        >
                            <FaArrowLeft /> <span>Back to Dashboard</span>
                        </button>
                        <h1>Verify Your Account</h1>
                    </div>

                    {success ? (
                        <div className="success-message">
                            <FaCheck className="success-icon" />
                            <h2>Verification Submitted!</h2>
                            <p>Your student ID has been submitted for verification. Our team will review it shortly.</p>
                            <p>You will be redirected to your dashboard in a few seconds...</p>
                        </div>
                    ) : (
                        <>
                            <div className="verify-instructions">
                                <div className="instruction-icon">
                                    <FaIdCard />
                                </div>
                                <div className="instruction-text">
                                    <h3>Student ID Verification</h3>
                                    <p>Please upload clear images of the front and back of your student ID card.</p>
                                    <p>Your ID must be valid and clearly show your name, photo, and student ID number.</p>
                                </div>
                            </div>

                            {error && <div className="error-message">{error}</div>}

                            <form onSubmit={handleSubmit} className="verify-form">
                                <div className="upload-container">
                                    <div className="upload-section">
                                        <h2>Front of ID</h2>
                                        <div 
                                            className={`upload-area ${frontPreview ? 'has-preview' : ''}`}
                                            onClick={() => document.getElementById('front-id-input').click()}
                                        >
                                            {frontPreview ? (
                                                <img src={frontPreview} alt="Front of ID preview" className="id-preview" />
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <FaUpload />
                                                    <p>Click to browse or drag image here</p>
                                                </div>
                                            )}
                                            <input 
                                                id="front-id-input"
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleFrontImageChange}
                                                className="file-input"
                                            />
                                        </div>
                                        {frontPreview && (
                                            <button 
                                                type="button" 
                                                className="change-image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFrontImage(null);
                                                    setFrontPreview(null);
                                                }}
                                            >
                                                Change image
                                            </button>
                                        )}
                                    </div>

                                    <div className="upload-section">
                                        <h2>Back of ID</h2>
                                        <div 
                                            className={`upload-area ${backPreview ? 'has-preview' : ''}`}
                                            onClick={() => document.getElementById('back-id-input').click()}
                                        >
                                            {backPreview ? (
                                                <img src={backPreview} alt="Back of ID preview" className="id-preview" />
                                            ) : (
                                                <div className="upload-placeholder">
                                                    <FaUpload />
                                                    <p>Click to browse or drag image here</p>
                                                </div>
                                            )}
                                            <input 
                                                id="back-id-input"
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleBackImageChange}
                                                className="file-input"
                                            />
                                        </div>
                                        {backPreview && (
                                            <button 
                                                type="button" 
                                                className="change-image"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setBackImage(null);
                                                    setBackPreview(null);
                                                }}
                                            >
                                                Change image
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="verification-notice">
                                    <p>
                                        <strong>Note:</strong> Your ID will be securely stored and only used for verification purposes.
                                        Once verified, you'll have full access to all platform features.
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    className="submit-button"
                                    disabled={loading || !frontImage || !backImage}
                                >
                                    {loading ? 'Submitting...' : 'Submit for Verification'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
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
                                <FaFacebook />
                            </a>
                            <a href="https://twitter.com" aria-label="Twitter">
                                <FaTwitter />
                            </a>
                            <a href="https://linkedin.com" aria-label="LinkedIn">
                                <FaLinkedin />
                            </a>
                            <a href="https://instagram.com" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                        </div>
                    </div>
                    
                    <div className="footer-copyright">
                        <p>&copy; {currentYear} Next Youth. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default VerifyAccount;
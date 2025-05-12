import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
    FaClock,
    FaStar
} from 'react-icons/fa';
import './VerifyAccount.css';
import logoLight from '../../assets/images/logo-light.png'; 
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const VerifyAccount = () => {
    const navigate = useNavigate();
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);

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

    // API base URL
    

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
        if (!event.target.closest('.mobile-menu')) {
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

    const handleShowRatings = useCallback(() => {
        setShowRatingModal(true);
        setShowProfileDropdown(false); // Close dropdown when opening modal
    }, []);

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
        <div className={`verify-page-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Header */}
            <header className="verify-header-main">
                <div className="verify-header-container">
                    <div className="verify-header-left">
                        <button 
                            className="verify-nav-toggle"
                            onClick={toggleMobileNav}
                            aria-label="Toggle navigation"
                        >
                            <span className="hamburger-icon"></span>
                        </button>
                        <Link to="/employee-dashboard" className="verify-logo-link">
                            <img 
                                src={isDarkMode ? logoDark : logoLight} 
                                alt="Next Youth" 
                                className="verify-logo" 
                            />
                        </Link>
                        
                        <nav className={`verify-nav ${showMobileNav ? 'active' : ''}`}>
                            <Link to="/find-jobs" className="verify-nav-link">Find Work</Link>
                            <Link to="/find-jobs/saved" className="verify-nav-link">Saved Jobs</Link>
                            <Link to="/find-jobs/proposals" className="verify-nav-link">Proposals</Link>
                            <Link to="/help" className="verify-nav-link">Help</Link>
                        </nav>
                    </div>
                    
                    <div className="verify-header-right">
                        <div className="verify-notification-container" ref={notificationsRef}>
                            <button 
                                className="verify-notification-button"
                                onClick={toggleNotifications}
                                aria-label="Notifications"
                            >
                                <FaBell />
                                <span className="verify-notification-badge">2</span>
                            </button>
                            
                            {showNotifications && (
                                <div className="verify-notifications-dropdown">
                                    <div className="verify-notification-header">
                                        <h3>Notifications</h3>
                                        <button className="verify-mark-all-read">Mark all as read</button>
                                    </div>
                                    <div className="verify-notification-list">
                                        <div className="verify-notification-item unread">
                                            <div className="verify-notification-icon">
                                                <FaCheck />
                                            </div>
                                            <div className="verify-notification-content">
                                                <p>Your profile has been verified!</p>
                                                <span className="verify-notification-time">2 hours ago</span>
                                            </div>
                                        </div>
                                        <div className="verify-notification-item unread">
                                            <div className="verify-notification-icon">
                                                <FaIdCard />
                                            </div>
                                            <div className="verify-notification-content">
                                                <p>New job matching your skills is available</p>
                                                <span className="verify-notification-time">1 day ago</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="verify-notification-footer">
                                        <Link to="/notifications">View all notifications</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button
                            className="verify-theme-toggle"
                            onClick={toggleDarkMode}
                            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                        >
                            {isDarkMode ? <FaSun /> : <FaMoon />}
                        </button>

                        <div className="verify-profile-container" ref={profileDropdownRef}>
                            <button 
                                className="verify-profile-button" 
                                onClick={toggleProfileDropdown}
                                aria-label="User profile"
                            >
                                {user.profilePicture ? (
                                    <img 
                                        src={user.profilePicture}
                                        alt="Profile"
                                        className="verify-profile-avatar"
                                    />
                                ) : (
                                    <FaUserCircle className="verify-avatar-icon" />
                                )}
                                <FaChevronDown className={`verify-dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
                            </button>
                            
                            {showProfileDropdown && (
                                <div className="verify-profile-dropdown">
                                    <div className="verify-profile-header">
                                        <div className="verify-profile-avatar-container">
                                            {user.profilePicture ? (
                                                <img 
                                                    src={user.profilePicture}
                                                    alt={`${user.name}'s profile`}
                                                />
                                            ) : (
                                                <FaUserCircle />
                                            )}
                                        </div>
                                        <div className="verify-profile-info">
                                            <h4>{user.name || 'User'}</h4>
                                            <span className="verify-profile-status">
                                                {!user.idVerification ? (
                                                    'Not Verified'
                                                ) : user.idVerification.status === 'verified' ? (
                                                    <><FaCheck className="verify-verified-icon" /> Verified</>
                                                ) : user.idVerification.status === 'pending' && user.idVerification.frontImage && user.idVerification.backImage ? (
                                                    <><FaClock className="verify-pending-icon" /> Verification Pending</>
                                                ) : user.idVerification.status === 'rejected' ? (
                                                    <>Verification Rejected</>
                                                ) : (
                                                    'Not Verified'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="verify-profile-links">
                                        <button 
                                            className="verify-profile-link"
                                            onClick={() => navigate('/my-profile')}
                                        >
                                            <FaUserCircle /> View Profile
                                        </button>
                                        
                                        <button 
                                            className="verify-profile-link"
                                            onClick={handleShowRatings}
                                        >
                                            <FaStar /> My Ratings & Reviews
                                        </button>
                                        
                                        <button 
                                            className="verify-profile-link"
                                            onClick={() => navigate('/settings')}
                                        >
                                            Settings
                                        </button>
                                        <button 
                                            className="verify-profile-link"
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

            {/* Main Content */}
            <main className="verify-main">
                <div className="verify-container">
                    <div className="verify-page-header">
                        <button 
                            className="verify-back-button" 
                            onClick={() => navigate('/employee-dashboard')}
                        >
                            <FaArrowLeft /> <span>Back to Dashboard</span>
                        </button>
                        <h1>Verify Your Account</h1>
                    </div>

                    {success ? (
                        <div className="verify-success-message">
                            <FaCheck className="verify-success-icon" />
                            <h2>Verification Submitted!</h2>
                            <p>Your student ID has been submitted for verification. Our team will review it shortly.</p>
                            <p>You will be redirected to your dashboard in a few seconds...</p>
                        </div>
                    ) : (
                        <>
                            <div className="verify-instructions">
                                <div className="verify-instruction-icon">
                                    <FaIdCard />
                                </div>
                                <div className="verify-instruction-text">
                                    <h3>Student ID Verification</h3>
                                    <p>Please upload clear images of the front and back of your student ID card.</p>
                                    <p>Your ID must be valid and clearly show your name, photo, and student ID number.</p>
                                </div>
                            </div>

                            {error && <div className="verify-error-message">{error}</div>}

                            <form onSubmit={handleSubmit} className="verify-form">
                                <div className="verify-upload-container">
                                    <div className="verify-upload-section">
                                        <h2>Front of ID</h2>
                                        <div 
                                            className={`verify-upload-area ${frontPreview ? 'has-preview' : ''}`}
                                            onClick={() => document.getElementById('front-id-input').click()}
                                        >
                                            {frontPreview ? (
                                                <img src={frontPreview} alt="Front of ID preview" className="verify-id-preview" />
                                            ) : (
                                                <div className="verify-upload-placeholder">
                                                    <FaUpload />
                                                    <p>Click to browse or drag image here</p>
                                                </div>
                                            )}
                                            <input 
                                                id="front-id-input"
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleFrontImageChange}
                                                className="verify-file-input"
                                            />
                                        </div>
                                        {frontPreview && (
                                            <button 
                                                type="button" 
                                                className="verify-change-image"
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

                                    <div className="verify-upload-section">
                                        <h2>Back of ID</h2>
                                        <div 
                                            className={`verify-upload-area ${backPreview ? 'has-preview' : ''}`}
                                            onClick={() => document.getElementById('back-id-input').click()}
                                        >
                                            {backPreview ? (
                                                <img src={backPreview} alt="Back of ID preview" className="verify-id-preview" />
                                            ) : (
                                                <div className="verify-upload-placeholder">
                                                    <FaUpload />
                                                    <p>Click to browse or drag image here</p>
                                                </div>
                                            )}
                                            <input 
                                                id="back-id-input"
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleBackImageChange}
                                                className="verify-file-input"
                                            />
                                        </div>
                                        {backPreview && (
                                            <button 
                                                type="button" 
                                                className="verify-change-image"
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

                                <div className="verify-notice">
                                    <p>
                                        <strong>Note:</strong> Your ID will be securely stored and only used for verification purposes.
                                        Once verified, you'll have full access to all platform features.
                                    </p>
                                </div>

                                <button 
                                    type="submit" 
                                    className={`verify-submit-button ${loading ? 'loading' : ''}`}
                                    disabled={loading || !frontImage || !backImage}
                                >
                                    {loading ? 'Submitting...' : 'Submit for Verification'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="verify-footer">
                <div className="verify-footer-container">
                    <div className="verify-footer-grid">
                        <div className="verify-footer-column">
                            <h3>For Freelancers</h3>
                            <ul>
                                <li><Link to="/find-jobs">Find Work</Link></li>
                                <li><Link to="/resources">Resources</Link></li>
                                <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
                            </ul>
                        </div>
                        
                        <div className="verify-footer-column">
                            <h3>Resources</h3>
                            <ul>
                                <li><Link to="/help-center">Help Center</Link></li>
                                <li><Link to="/webinars">Webinars</Link></li>
                                <li><Link to="/blog">Blog</Link></li>
                            </ul>
                        </div>
                        
                        <div className="verify-footer-column">
                            <h3>Company</h3>
                            <ul>
                                <li><Link to="/about">About Us</Link></li>
                                <li><Link to="/careers">Careers</Link></li>
                                <li><Link to="/contact">Contact Us</Link></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="verify-footer-bottom">
                        <div className="verify-footer-logo">
                            <Link to="/">
                                <img 
                                    src={isDarkMode ? logoDark : logoLight} 
                                    alt="Next Youth" 
                                    className="verify-footer-logo-image" 
                                />
                            </Link>
                        </div>
                        
                        <div className="verify-legal-links">
                            <Link to="/terms">Terms of Service</Link>
                            <Link to="/privacy">Privacy Policy</Link>
                            <Link to="/accessibility">Accessibility</Link>
                        </div>
                        
                        <div className="verify-social-links">
                            <a href="https://facebook.com" aria-label="Facebook"><FaFacebook /></a>
                            <a href="https://twitter.com" aria-label="Twitter"><FaTwitter /></a>
                            <a href="https://linkedin.com" aria-label="LinkedIn"><FaLinkedin /></a>
                            <a href="https://instagram.com" aria-label="Instagram"><FaInstagram /></a>
                        </div>
                    </div>
                    
                    <div className="verify-copyright">
                        <p>&copy; {currentYear} Next Youth. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* Rating Modal */}
            {showRatingModal && (
                <RatingModal 
                    isOpen={showRatingModal}
                    onClose={() => setShowRatingModal(false)}
                    viewOnly={true}
                />
            )}
        </div>
    );
};

export default VerifyAccount;
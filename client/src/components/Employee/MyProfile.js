import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaSun, 
  FaMoon, 
  FaUserCircle, 
  FaChevronDown,
  FaCheck,
  FaGraduationCap,
  FaCode,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaBullseye,
  FaFileAlt,
  FaLinkedin,
  FaGlobe,
  FaUserEdit,
  FaLanguage,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaDownload,
  FaQuestionCircle,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaBell, 
  FaClock, 
  FaRegFileAlt,
  FaCheckCircle,
  FaStar,
  FaAngleRight,
  FaCog,
  FaSignOutAlt,
  FaHistory,
  FaProjectDiagram,
  FaBriefcase,
  FaAward,
  FaBars
} from 'react-icons/fa';
import './MyProfile.css'; // Make sure to create this CSS file
import logoLight from '../../assets/images/logo-light.png'; 
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const MyProfile = () => {
  const [profileData, setProfileData] = useState({
    bio: '',
    education: {
      school: { name: '', enteringYear: '', passingYear: '' },
      college: { name: '', enteringYear: '', passingYear: '' },
      university: { name: '', enteringYear: '', passingYear: '' },
    },
    skills: [],
    languageSkills: [],
    profilePicture: '',
    address: '',
    country: '',
    phoneNumber: '',
    name: '',
    email: '',
    goals: '',
    questions: [],
    linkedInProfile: '',
    socialMediaLink: '',
    idVerification: null,
    isVerified: false,
    resumeUrl: ''
  });
  
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });
  const [isLoading, setIsLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    return parseInt(localStorage.getItem("unread-notifications") || "2");
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const API_BASE_URL = 'API_BASE_URL';

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let userData = null;
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true });
        if (userResponse.data.success) {
          userData = userResponse.data.user;
        } else {
          throw new Error("Failed to fetch basic user data");
        }
      } catch (error) {
        console.error('Error fetching basic user data:', error);
        toast.error('Failed to load basic user data');
        if (error.response?.status === 401) navigate('/login');
        return;
      }

      let verificationData = null;
      let verificationStatus = null;
      try {
        const verificationResponse = await axios.get(`${API_BASE_URL}/auth/verification-status`, { withCredentials: true });
        if (verificationResponse.data.success && verificationResponse.data.verification) {
          verificationData = verificationResponse.data.verification;
          verificationStatus = verificationData.status;
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
        toast.warning('Could not load verification status');
      }

      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, { withCredentials: true });
        if (profileResponse.data.success) {
          const fullProfileData = profileResponse.data.user;
          
          setProfileData({
            name: fullProfileData.name || '',
            email: fullProfileData.email || '',
            bio: fullProfileData.bio || '',
            education: fullProfileData.education || {
              school: { name: '', enteringYear: '', passingYear: '' },
              college: { name: '', enteringYear: '', passingYear: '' },
              university: { name: '', enteringYear: '', passingYear: '' }
            },
            skills: fullProfileData.skills || [],
            languageSkills: fullProfileData.languageSkills || [],
            profilePicture: fullProfileData.profilePicture || '',
            address: fullProfileData.address || '',
            country: fullProfileData.country || '',
            phoneNumber: fullProfileData.phoneNumber || '',
            goals: fullProfileData.goals || '',
            questions: fullProfileData.questions || [],
            linkedInProfile: fullProfileData.linkedInProfile || '',
            socialMediaLink: fullProfileData.socialMediaLink || '',
            idVerification: verificationData,
            isVerified: verificationStatus === 'verified',
            resumeUrl: fullProfileData.resume || ''
          });
        } else {
          throw new Error("Profile data fetch failed");
        }
      } catch (error) {
        console.error('Error fetching complete profile data:', error);
        toast.error('Failed to load complete profile data');
        
        setProfileData(prevState => ({
          ...prevState,
          name: userData.name || '',
          email: userData.email || '',
          profilePicture: userData.profilePicture || '',
          idVerification: verificationData,
          isVerified: verificationStatus === 'verified'
        }));
      }

      try {
        const ratingsResponse = await axios.get(`${API_BASE_URL}/auth/my-ratings`, { withCredentials: true });
        if (ratingsResponse.data.success) {
          const ratings = ratingsResponse.data.ratings || [];
          const averageRating = ratings.length > 0 
            ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length 
            : 0;
          
          setProfileData(prevData => ({
            ...prevData,
            averageRating: averageRating,
            totalRatings: ratings.length
          }));
        }
      } catch (error) {
        console.error('Error fetching ratings:', error);
      }
    } catch (error) {
      console.error('Error in fetch user data flow:', error);
      toast.error('An unexpected error occurred loading your profile');
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  const handleOutsideClick = useCallback((event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
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
      if (response.data.success) navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  }, [navigate, API_BASE_URL]);

  const handleEditProfile = () => {
    navigate('/employee-profile');
  };

  const handleVerifyAccount = useCallback(() => {
    navigate('/verify-account');
  }, [navigate]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/my-profile');
  }, [navigate]);

  const handleMarkAllAsRead = useCallback((e) => {
    e.stopPropagation();
    setUnreadNotifications(0);
    localStorage.setItem("unread-notifications", "0");
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  useEffect(() => {
    const profileElement = document.querySelector('.employee-profile-page');
    if (profileElement) {
      profileElement.classList.toggle('employee-profile-dark-mode', isDarkMode);
    }
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const renderEducation = (level, item) => {
    if (!item.name && !item.enteringYear && !item.passingYear) return null;
    
    return (
      <div className="employee-profile-education-item">
        <h3>{level}</h3>
        <p className="employee-profile-education-name">{item.name || 'Not specified'}</p>
        {(item.enteringYear || item.passingYear) && (
          <p className="employee-profile-education-years">
            <FaCalendarAlt className="employee-profile-icon-small" />
            {item.enteringYear || '?'} - {item.passingYear || 'Present'}
          </p>
        )}
      </div>
    );
  };

  const calculateProfileCompleteness = () => {
    const fields = [
      { name: 'Profile Picture', complete: !!profileData.profilePicture, weight: 1 },
      { name: 'Name', complete: !!profileData.name, weight: 1 },
      { name: 'Bio', complete: !!profileData.bio, weight: 1 },
      { name: 'Email', complete: !!profileData.email, weight: 1 },
      { name: 'Phone Number', complete: !!profileData.phoneNumber, weight: 1 },
      { name: 'Address', complete: !!profileData.address, weight: 0.5 },
      { name: 'Country', complete: !!profileData.country, weight: 0.5 },
      { name: 'Education', complete: !!(
        profileData.education?.school?.name || 
        profileData.education?.college?.name || 
        profileData.education?.university?.name
      ), weight: 1 },
      { name: 'Skills', complete: profileData.skills?.length > 0, weight: 1 },
      { name: 'Languages', complete: profileData.languageSkills?.length > 0, weight: 1 },
      { name: 'Career Goals', complete: !!profileData.goals, weight: 1 },
      { name: 'Resume', complete: !!profileData.resumeUrl, weight: 1 },
      { name: 'Professional Links', complete: !!(
        profileData.linkedInProfile || 
        profileData.socialMediaLink
      ), weight: 1 }
    ];
    
    const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = fields
      .filter(field => field.complete)
      .reduce((sum, field) => sum + field.weight, 0);
    
    const percentage = Math.round((completedWeight / totalWeight) * 100);
    
    const incompleteFields = fields
      .filter(field => !field.complete)
      .map(field => field.name);
      
    return {
      percentage,
      incompleteFields
    };
  };

  return (
    <div className="employee-profile-page">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <header className="employee-profile-header">
        <div className="employee-profile-header-container">
          <div className="employee-profile-header-left">
            <button 
              className={`employee-profile-nav-toggle ${showMobileNav ? 'active' : ''}`}
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
              aria-expanded={showMobileNav}
            >
              <span className="employee-profile-hamburger-icon"></span>
            </button>
            <Link to="/employee-dashboard" className="employee-profile-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-profile-logo-image" 
              />
            </Link>
            
            <nav className={`employee-profile-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="employee-profile-nav-link">Find Work</Link>
              <Link to="/find-jobs/saved" className="employee-profile-nav-link">Saved Jobs</Link>
              <Link to="/proposals" className="employee-profile-nav-link">Proposals</Link>
              <Link to="/help" className="employee-profile-nav-link">Help</Link>
            </nav>
          </div>
          
          <div className="employee-profile-header-right">
            <div className="employee-profile-notification-container" ref={notificationsRef}>
              <button 
                className="employee-profile-notification-button"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="employee-profile-notification-badge">{unreadNotifications}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="employee-profile-notifications-dropdown">
                  <div className="employee-profile-notification-header">
                    <h3>Notifications</h3>
                    <button className="employee-profile-mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                  </div>
                  <div className="employee-profile-notification-list">
                    <div className="employee-profile-notification-item employee-profile-unread">
                      <div className="employee-profile-notification-icon">
                        {(!profileData.idVerification || 
                          !profileData.idVerification.frontImage || 
                          !profileData.idVerification.backImage || 
                          profileData.idVerification.status === 'rejected') ? (
                          <FaRegFileAlt />
                        ) : profileData.idVerification.status === 'verified' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaClock />
                        )}
                      </div>
                      <div className="employee-profile-notification-content">
                        <p>
                          {(!profileData.idVerification || 
                            !profileData.idVerification.frontImage || 
                            !profileData.idVerification.backImage || 
                            profileData.idVerification.status === 'rejected') ? (
                            "Please verify your account"
                          ) : profileData.idVerification.status === 'verified' ? (
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
              className="employee-profile-theme-toggle-button"
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
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture}
                    alt="Profile"
                    className="employee-profile-avatar"
                  />
                ) : (
                  <FaUserCircle className="employee-profile-avatar-icon" />
                )}
                <FaChevronDown className={`employee-profile-dropdown-icon ${showProfileDropdown ? 'employee-profile-rotate' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="employee-profile-dropdown">
                  <div className="employee-profile-dropdown-header">
                    <div className="employee-profile-dropdown-avatar">
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture}
                          alt={`${profileData.name}'s profile`}
                        />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="employee-profile-dropdown-info">
                      <h4>{profileData.name || 'User'}</h4>
                      <span className="employee-profile-status">
                        {!profileData.idVerification ? (
                          'Not Verified'
                        ) : profileData.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="employee-profile-verified-icon" /> Verified</>
                        ) : profileData.idVerification.status === 'pending' && profileData.idVerification.frontImage && profileData.idVerification.backImage ? (
                          <><FaClock className="employee-profile-pending-icon" /> Verification Pending</>
                        ) : profileData.idVerification.status === 'rejected' ? (
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
                      onClick={handleNavigateToProfile}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {(!profileData.idVerification || 
                      !profileData.idVerification.frontImage || 
                      !profileData.idVerification.backImage || 
                      profileData.idVerification.status === 'rejected') && (
                      <button 
                        className="employee-profile-dropdown-link"
                        onClick={handleVerifyAccount}
                      >
                        <FaRegFileAlt /> Verify Account
                      </button>
                    )}

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

      <div className={`employee-profile-mobile-overlay ${showMobileNav ? 'active' : ''}`} onClick={() => setShowMobileNav(false)}></div>

      <main className="employee-profile-main">
        <div className="employee-profile-container">
          {isLoading ? (
            <div className="employee-profile-loading">
              <div className="employee-profile-loading-spinner"></div>
              <p>Loading your profile...</p>
            </div>
          ) : (
            <>
              <section className="employee-profile-intro">
                <div className="employee-profile-intro-content">
                  <div className="employee-profile-picture-wrapper">
                    <div className="employee-profile-picture-container">
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture} 
                          alt={`${profileData.name}'s profile`} 
                          className="employee-profile-picture"
                        />
                      ) : (
                        <div className="employee-profile-picture-placeholder">
                          <FaUserCircle />
                        </div>
                      )}
                    </div>
                    <div className={`employee-profile-verification-badge ${profileData.isVerified ? 'employee-profile-verified' : 'employee-profile-not-verified'}`}>
                      {profileData.isVerified ? (
                        <><FaCheck /> Verified</>
                      ) : (
                        'Not Verified'
                      )}
                    </div>
                  </div>
                  
                  <div className="employee-profile-intro-info">
                    <h1 className="employee-profile-name">{profileData.name || 'User'}</h1>
                    <p className="employee-profile-bio">{profileData.bio || 'No bio provided'}</p>
                    
                    {profileData.country && (
                      <div className="employee-profile-location">
                        <FaMapMarkedAlt /> {profileData.country}
                        {profileData.address && `, ${profileData.address}`}
                      </div>
                    )}

                    <div className="employee-profile-stats">
                      {typeof profileData.averageRating !== 'undefined' && (
                        <div className="employee-profile-rating-summary">
                          <div className="employee-profile-stars">
                            {[...Array(5)].map((_, index) => (
                              <FaStar
                                key={index}
                                className={index < Math.round(profileData.averageRating) ? 'employee-profile-star-filled' : 'employee-profile-star-empty'}
                              />
                            ))}
                          </div>
                          <span className="employee-profile-rating-text">
                            {profileData.averageRating.toFixed(1)} ({profileData.totalRatings} {profileData.totalRatings === 1 ? 'review' : 'reviews'})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="employee-profile-completeness">
                      <div className="employee-profile-completeness-header">
                        <h3>Profile Completeness</h3>
                        <span className="employee-profile-completeness-percentage">{calculateProfileCompleteness().percentage}%</span>
                      </div>
                      <div className="employee-profile-completeness-bar-container">
                        <div 
                          className="employee-profile-completeness-bar" 
                          style={{ width: `${calculateProfileCompleteness().percentage}%` }}
                        ></div>
                      </div>
                      {calculateProfileCompleteness().percentage < 100 && (
                        <div className="employee-profile-completeness-tips">
                          <p>Complete your profile to increase visibility to employers</p>
                          {calculateProfileCompleteness().incompleteFields.length > 0 && (
                            <div className="employee-profile-missing-fields">
                              <span>Missing: </span>
                              {calculateProfileCompleteness().incompleteFields.slice(0, 3).join(', ')}
                              {calculateProfileCompleteness().incompleteFields.length > 3 && 
                                ` and ${calculateProfileCompleteness().incompleteFields.length - 3} more...`}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button className="employee-profile-edit-button" onClick={handleEditProfile}>
                      <FaUserEdit /> Edit Profile
                    </button>
                  </div>
                </div>
              </section>
              
              {/* Tab Navigation */}
              <div className="employee-profile-tabs">
                <div 
                  className={`employee-profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <FaUserCircle /> Overview
                </div>
                <div 
                  className={`employee-profile-tab ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('skills')}
                >
                  <FaCode /> Skills & Education
                </div>
                <div 
                  className={`employee-profile-tab ${activeTab === 'contact' ? 'active' : ''}`}
                  onClick={() => setActiveTab('contact')}
                >
                  <FaEnvelope /> Contact Info
                </div>
                <div 
                  className={`employee-profile-tab ${activeTab === 'work' ? 'active' : ''}`}
                  onClick={() => setActiveTab('work')}
                >
                  <FaBriefcase /> Work History
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="employee-profile-content">
                {/* Overview Tab */}
                <div className={`employee-profile-tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
                  <div className="employee-profile-content-grid">
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaBullseye /> Career Goals</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        {profileData.goals ? (
                          <p className="employee-profile-goals-text">{profileData.goals}</p>
                        ) : (
                          <p className="employee-profile-no-data">No career goals specified</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaStar /> Ratings & Reviews</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        <div className="employee-profile-ratings-display">
                          <div className="employee-profile-rating-stars">
                            {[...Array(5)].map((_, index) => (
                              <FaStar
                                key={index}
                                className={index < Math.round(profileData.averageRating || 0) ? 'employee-profile-star-filled' : 'employee-profile-star-empty'}
                              />
                            ))}
                          </div>
                          <div className="employee-profile-rating-numbers">
                            <span className="employee-profile-rating-average">{(profileData.averageRating || 0).toFixed(1)}</span>
                            <span className="employee-profile-rating-count">
                              ({profileData.totalRatings || 0} {(profileData.totalRatings || 0) === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                          <button 
                            className="employee-profile-view-reviews-button"
                            onClick={() => setShowRatingModal(true)}
                          >
                            View All Reviews <FaAngleRight />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaQuestionCircle /> Questions for Employers</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        {profileData.questions && profileData.questions.length > 0 ? (
                          <ul className="employee-profile-questions-list">
                            {profileData.questions.map((question, index) => (
                              <li key={index} className="employee-profile-question-item">{question}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="employee-profile-no-data">No questions added</p>
                        )}
                      </div>
                    </div>
                    
                    {profileData.resumeUrl && (
                      <div className="employee-profile-card">
                        <div className="employee-profile-card-header">
                          <h2><FaFileAlt /> Resume</h2>
                        </div>
                        <div className="employee-profile-card-content">
                          <div className="employee-profile-resume-container">
                            <a href={profileData.resumeUrl} download className="employee-profile-download-button">
                              <FaDownload /> Download Resume
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Skills & Education Tab */}
                <div className={`employee-profile-tab-content ${activeTab === 'skills' ? 'active' : ''}`}>
                  <div className="employee-profile-content-grid">
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaCode /> Skills</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        {profileData.skills && profileData.skills.length > 0 ? (
                          <div className="employee-profile-skills-list">
                            {profileData.skills.map((skill, index) => (
                              <span key={index} className="employee-profile-skill-tag">{skill}</span>
                            ))}
                          </div>
                        ) : (
                          <p className="employee-profile-no-data">No skills added yet</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaLanguage /> Languages</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        {profileData.languageSkills && profileData.languageSkills.length > 0 ? (
                          <div className="employee-profile-languages-list">
                            {profileData.languageSkills.map((lang) => (
                              <div key={lang.language} className="employee-profile-language-item">
                                <span className="employee-profile-language-name">{lang.language}</span>
                                <span className="employee-profile-language-proficiency">{lang.proficiency}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="employee-profile-no-data">No languages added</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaGraduationCap /> Education</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        {renderEducation('School', profileData.education.school)}
                        {renderEducation('College', profileData.education.college)}
                        {renderEducation('University', profileData.education.university)}
                        
                        {!profileData.education.school.name && 
                         !profileData.education.college.name && 
                         !profileData.education.university.name && (
                          <p className="employee-profile-no-data">No education information provided</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="employee-profile-card">
                      <div className="employee-profile-card-header">
                        <h2><FaAward /> Certifications</h2>
                      </div>
                      <div className="employee-profile-card-content">
                        <p className="employee-profile-no-data">No certifications added yet</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Contact Info Tab */}
                <div className={`employee-profile-tab-content ${activeTab === 'contact' ? 'active' : ''}`}>
                  <div className="employee-profile-card">
                    <div className="employee-profile-card-header">
                      <h2><FaMapMarkerAlt /> Contact Information</h2>
                    </div>
                    <div className="employee-profile-card-content">
                      <div className="employee-profile-contact-list">
                        {profileData.email && (
                          <div className="employee-profile-contact-item">
                            <FaEnvelope className="employee-profile-contact-icon" />
                            <span>{profileData.email}</span>
                          </div>
                        )}
                        
                        {profileData.phoneNumber && (
                          <div className="employee-profile-contact-item">
                            <FaPhoneAlt className="employee-profile-contact-icon" />
                            <span>{profileData.phoneNumber}</span>
                          </div>
                        )}
                        
                        {profileData.address && (
                          <div className="employee-profile-contact-item">
                            <FaMapMarkerAlt className="employee-profile-contact-icon" />
                            <span>{profileData.address}</span>
                          </div>
                        )}
                        
                        {profileData.linkedInProfile && (
                          <div className="employee-profile-contact-item">
                            <FaLinkedin className="employee-profile-contact-icon" />
                            <a href={profileData.linkedInProfile} target="_blank" rel="noopener noreferrer">
                              LinkedIn Profile
                            </a>
                          </div>
                        )}
                        
                        {profileData.socialMediaLink && (
                          <div className="employee-profile-contact-item">
                            <FaGlobe className="employee-profile-contact-icon" />
                            <a href={profileData.socialMediaLink} target="_blank" rel="noopener noreferrer">
                              Social Media
                            </a>
                          </div>
                        )}
                        
                        {!profileData.phoneNumber && !profileData.address && 
                         !profileData.linkedInProfile && !profileData.socialMediaLink && (
                          <p className="employee-profile-no-data">Limited contact information available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="employee-profile-card">
                    <div className="employee-profile-card-header">
                      <h2><FaProjectDiagram /> Availability</h2>
                    </div>
                    <div className="employee-profile-card-content">
                      <div className="employee-profile-pricing-card">
                        <div className="employee-profile-pricing-header">
                          <h2>Hourly Rate</h2>
                          <div className="employee-profile-pricing-amount">$25.00/hr</div>
                        </div>
                        <p className="employee-profile-pricing-description">
                          Available for full-time work (40+ hrs/week) and part-time projects.
                          My schedule is flexible and I can accommodate different time zones.
                        </p>
                        <button className="employee-profile-hire-button">
                          Contact Me
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Work History Tab */}
                <div className={`employee-profile-tab-content ${activeTab === 'work' ? 'active' : ''}`}>
                  <div className="employee-profile-card">
                    <div className="employee-profile-card-header">
                      <h2><FaHistory /> Work Experience</h2>
                    </div>
                    <div className="employee-profile-card-content">
                      <p className="employee-profile-no-data">No work history available yet. As you complete jobs, they will appear here.</p>
                    </div>
                  </div>
                  
                  <div className="employee-profile-card">
                    <div className="employee-profile-card-header">
                      <h2><FaBriefcase /> Recent Projects</h2>
                    </div>
                    <div className="employee-profile-card-content">
                      <p className="employee-profile-no-data">No recent projects to display.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="employee-profile-footer">
        <div className="employee-profile-footer-container">
          <div className="employee-profile-footer-grid">
            <div className="employee-profile-footer-column">
              <h3>For Freelancers</h3>
              <ul>
                <li><Link to="/find-jobs">Find Work</Link></li>
                <li><Link to="/resources">Resources</Link></li>
                <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
                <li><Link to="/freelancer-forum">Community Forum</Link></li>
              </ul>
            </div>
            
            <div className="employee-profile-footer-column">
              <h3>Resources</h3>
              <ul>
                <li><Link to="/help-center">Help Center</Link></li>
                <li><Link to="/webinars">Webinars</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/api-docs">Developer API</Link></li>
              </ul>
            </div>
            
            <div className="employee-profile-footer-column">
              <h3>Company</h3>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/press">Press</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="employee-profile-footer-bottom">
            <div className="employee-profile-footer-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-profile-footer-logo-image" 
              />
            </div>
            
            <div className="employee-profile-footer-links">
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/accessibility">Accessibility</Link>
            </div>
            
            <div className="employee-profile-footer-social">
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
          
          <div className="employee-profile-footer-copyright">
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

export default MyProfile;
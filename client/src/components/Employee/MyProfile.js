import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaSun, 
  FaMoon, 
  FaUserCircle, 
  FaBell, 
  FaChevronDown,
  FaCheck,
  FaClock,
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
  FaCheckCircle,
  FaRegFileAlt
} from 'react-icons/fa';
import './MyProfile.css'; // You'll need to create this CSS file
import './EmployeeDashboard.css'; // Import for header and footer styling

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
  
  // UI state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });
  const [isLoading, setIsLoading] = useState(true);

  // Refs and navigation
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch user profile data
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Step 1: Get basic user data
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

      // Step 2: Get verification status
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
        // Continue as this is not critical
      }

      // Step 3: Get complete profile data
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
            resumeUrl: fullProfileData.resume || '' // Map 'resume' from backend to 'resumeUrl' in frontend
          });
        } else {
          throw new Error("Profile data fetch failed");
        }
      } catch (error) {
        console.error('Error fetching complete profile data:', error);
        toast.error('Failed to load complete profile data');
        
        // Fall back to basic user data
        setProfileData(prevState => ({
          ...prevState,
          name: userData.name || '',
          email: userData.email || '',
          profilePicture: userData.profilePicture || '',
          idVerification: verificationData,
          isVerified: verificationStatus === 'verified'
        }));
      }
    } catch (error) {
      console.error('Error in fetch user data flow:', error);
      toast.error('An unexpected error occurred loading your profile');
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  // Handle UI interactions
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

  // Effect hooks
  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  useEffect(() => {
    // Change from document.body to the dashboard element
    const dashboardElement = document.querySelector('.employee-dashboard');
    if (dashboardElement) {
      dashboardElement.classList.toggle('dark-mode', isDarkMode);
    }
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Helper function to render education items
  const renderEducation = (level, item) => {
    if (!item.name && !item.enteringYear && !item.passingYear) return null;
    
    return (
      <div className="profile-education-item">
        <h3>{level}</h3>
        <p className="education-name">{item.name || 'Not specified'}</p>
        {(item.enteringYear || item.passingYear) && (
          <p className="education-years">
            <FaCalendarAlt className="icon-small" />
            {item.enteringYear || '?'} - {item.passingYear || 'Present'}
          </p>
        )}
      </div>
    );
  };

  const calculateProfileCompleteness = () => {
    // Define fields that contribute to profile completeness
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
    
    // Calculate weighted completeness
    const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = fields
      .filter(field => field.complete)
      .reduce((sum, field) => sum + field.weight, 0);
    
    // Calculate percentage
    const percentage = Math.round((completedWeight / totalWeight) * 100);
    
    // Get incomplete fields
    const incompleteFields = fields
      .filter(field => !field.complete)
      .map(field => field.name);
      
    return {
      percentage,
      incompleteFields
    };
  };

  return (
    <div className="employee-dashboard">
      <ToastContainer position="top-right" autoClose={5000} />
      
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
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture}
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
                      {profileData.profilePicture ? (
                        <img 
                          src={profileData.profilePicture}
                          alt={`${profileData.name}'s profile`}
                        />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4>{profileData.name || 'User'}</h4>
                      <span className="profile-status">
                        {!profileData.idVerification ? (
                          'Not Verified'
                        ) : profileData.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="verified-icon" /> Verified</>
                        ) : profileData.idVerification.status === 'pending' && profileData.idVerification.frontImage && profileData.idVerification.backImage ? (
                          <><FaClock className="pending-icon" /> Verification Pending</>
                        ) : profileData.idVerification.status === 'rejected' ? (
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
                      onClick={handleNavigateToProfile}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {/* Show verify account option when appropriate */}
                    {(!profileData.idVerification || 
                      !profileData.idVerification.frontImage || 
                      !profileData.idVerification.backImage || 
                      profileData.idVerification.status === 'rejected') && (
                      <button 
                        className="profile-dropdown-link"
                        onClick={handleVerifyAccount}
                      >
                        Verify Account
                      </button>
                    )}
                    
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

      {/* Main Content */}
      <main className="dashboard-container">
        <div className="dashboard-content">
          {isLoading ? (
            <div className="loading-spinner">Loading profile...</div>
          ) : (
            <div className="profile-view-container">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-header-content">
                  <div className="profile-picture-container">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt={`${profileData.name}'s profile`} 
                        className="profile-picture"
                      />
                    ) : (
                      <div className="profile-picture-placeholder">
                        <FaUserCircle />
                      </div>
                    )}
                    <div className={`verification-badge ${profileData.isVerified ? 'verified' : 'not-verified'}`}>
                      {profileData.isVerified ? (
                        <><FaCheck /> Verified</>
                      ) : (
                        'Not Verified'
                      )}
                    </div>
                  </div>
                  
                  <div className="profile-header-info">
                    <h1 className="profile-name">{profileData.name || 'User'}</h1>
                    <p className="profile-bio">{profileData.bio || 'No bio provided'}</p>
                    
                    <div className="profile-location">
                      {profileData.country && (
                        <span className="profile-country">
                          <FaMapMarkedAlt /> {profileData.country}
                        </span>
                      )}
                    </div>

                    {/* Profile Completeness Slider */}
                    <div className="profile-completeness">
                      <div className="completeness-header">
                        <h3>Profile Completeness</h3>
                        <span className="completeness-percentage">{calculateProfileCompleteness().percentage}%</span>
                      </div>
                      <div className="completeness-bar-container">
                        <div 
                          className="completeness-bar" 
                          style={{ width: `${calculateProfileCompleteness().percentage}%` }}
                        ></div>
                      </div>
                      {calculateProfileCompleteness().percentage < 100 && (
                        <div className="completeness-tips">
                          <p>Complete your profile to increase visibility to employers</p>
                          <div className="missing-fields">
                            <span>Missing: </span>
                            {calculateProfileCompleteness().incompleteFields.slice(0, 3).join(', ')}
                            {calculateProfileCompleteness().incompleteFields.length > 3 && 
                              ` and ${calculateProfileCompleteness().incompleteFields.length - 3} more...`}
                          </div>
                        </div>
                      )}
                    </div>

                    <button className="edit-profile-button" onClick={handleEditProfile}>
                      <FaUserEdit /> Edit Profile
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="profile-content">
                {/* Education Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaGraduationCap /> Education
                  </h2>
                  <div className="profile-section-content">
                    {renderEducation('School', profileData.education.school)}
                    {renderEducation('College', profileData.education.college)}
                    {renderEducation('University', profileData.education.university)}
                    
                    {!profileData.education.school.name && 
                     !profileData.education.college.name && 
                     !profileData.education.university.name && (
                      <p className="no-data-message">No education information provided</p>
                    )}
                  </div>
                </div>
                
                {/* Skills Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaCode /> Skills
                  </h2>
                  <div className="profile-section-content">
                    {profileData.skills && profileData.skills.length > 0 ? (
                      <div className="profile-skills">
                        {profileData.skills.map((skill) => (
                          <span key={skill} className="skill-badge">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-message">No skills added</p>
                    )}
                  </div>
                </div>
                
                {/* Languages Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaLanguage /> Languages
                  </h2>
                  <div className="profile-section-content">
                    {profileData.languageSkills && profileData.languageSkills.length > 0 ? (
                      <div className="profile-languages">
                        {profileData.languageSkills.map((lang) => (
                          <div key={lang.language} className="language-item">
                            <span className="language-name">{lang.language}</span>
                            <span className="language-proficiency">{lang.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-message">No languages added</p>
                    )}
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaMapMarkerAlt /> Contact Information
                  </h2>
                  <div className="profile-section-content">
                    <div className="contact-info">
                      {profileData.email && (
                        <div className="contact-item">
                          <FaEnvelope className="contact-icon" />
                          <span>{profileData.email}</span>
                        </div>
                      )}
                      
                      {profileData.phoneNumber && (
                        <div className="contact-item">
                          <FaPhoneAlt className="contact-icon" />
                          <span>{profileData.phoneNumber}</span>
                        </div>
                      )}
                      
                      {profileData.address && (
                        <div className="contact-item">
                          <FaMapMarkerAlt className="contact-icon" />
                          <span>{profileData.address}</span>
                        </div>
                      )}
                      
                      {profileData.linkedInProfile && (
                        <div className="contact-item">
                          <FaLinkedin className="contact-icon" />
                          <a href={profileData.linkedInProfile} target="_blank" rel="noopener noreferrer">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      
                      {profileData.socialMediaLink && (
                        <div className="contact-item">
                          <FaGlobe className="contact-icon" />
                          <a href={profileData.socialMediaLink} target="_blank" rel="noopener noreferrer">
                            Social Media
                          </a>
                        </div>
                      )}
                      
                      {!profileData.phoneNumber && !profileData.address && 
                       !profileData.linkedInProfile && !profileData.socialMediaLink && (
                        <p className="no-data-message">Limited contact information available</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Goals Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaBullseye /> Career Goals
                  </h2>
                  <div className="profile-section-content">
                    {profileData.goals ? (
                      <div className="profile-goals">
                        <p>{profileData.goals}</p>
                      </div>
                    ) : (
                      <p className="no-data-message">No career goals specified</p>
                    )}
                  </div>
                </div>
                
                {/* Resume Section */}
                {profileData.resumeUrl && (
                  <div className="profile-section">
                    <h2 className="profile-section-title">
                      <FaFileAlt /> Resume
                    </h2>
                    <div className="profile-section-content">
                      <div className="resume-container">
                        <a href={profileData.resumeUrl} download className="resume-download-button">
                          <FaDownload /> Download Resume
                        </a>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Questions for Employers */}
                {profileData.questions && profileData.questions.length > 0 && (
                  <div className="profile-section">
                    <h2 className="profile-section-title">
                      <FaQuestionCircle /> Questions for Employers
                    </h2>
                    <div className="profile-section-content">
                      <div className="questions-list">
                        {profileData.questions.map((question, index) => (
                          <div key={index} className="question-item">
                            <p>{question}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

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
            <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MyProfile;
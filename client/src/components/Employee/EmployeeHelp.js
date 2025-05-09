import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSun, FaMoon, FaBars, FaTimes, FaUser, FaChevronDown, 
         FaEnvelope, FaQuestionCircle, FaFileAlt, FaHeadset, 
         FaPhone, FaBook, FaTools, FaUserShield } from 'react-icons/fa';
import './EmployeeHelp.css';
import axios from 'axios';

// Import logos directly like in the Dashboard
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

const EmployeeHelp = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });
  const [mobileNavActive, setMobileNavActive] = useState(false);
  const [profileDropdownActive, setProfileDropdownActive] = useState(false);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('general');
  const [searchQuery, setSearchQuery] = useState('');
  
  const API_BASE_URL = 'http://localhost:4000/api';

  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const navToggleRef = useRef(null);
  const mobileNavRef = useRef(null);

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      // Use the same API endpoint and authentication approach as EmployeeDashboard
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
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
      // Don't automatically redirect to login on error
      // This prevents unintended logouts when API calls fail
    }
  }, []);

  // Handle outside clicks
  const handleOutsideClick = useCallback((e) => {
    if (
      profileDropdownRef.current && 
      !profileDropdownRef.current.contains(e.target) && 
      !e.target.closest('.employee-help-profile-button')
    ) {
      setProfileDropdownActive(false);
    }

    if (
      mobileNavActive &&
      mobileNavRef.current &&
      !mobileNavRef.current.contains(e.target) &&
      !navToggleRef.current.contains(e.target)
    ) {
      setMobileNavActive(false);
    }
  }, [mobileNavActive]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    localStorage.setItem("dashboard-theme", !isDarkMode ? "dark" : "light");
  };

  // Effect for outside clicks
  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  // Effect to fetch user data
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Effect to update dark/light theme
  useEffect(() => {
    const helpElement = document.querySelector('.employee-help-container');
    const headerElement = document.querySelector('.employee-help-header');
    
    if (helpElement) {
      helpElement.classList.toggle('employee-dark-mode', isDarkMode);
    }
    
    if (headerElement) {
      if (isDarkMode) {
        headerElement.style.backgroundColor = 'var(--dark-card)';
        headerElement.style.borderBottom = '1px solid var(--dark-border)';
      } else {
        headerElement.style.backgroundColor = 'var(--light-card)';
        headerElement.style.borderBottom = '1px solid var(--light-border)';
      }
    }
    
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Dummy FAQ data
  const faqData = {
    general: [
      {
        question: 'How do I create my profile?',
        answer: 'To create your profile, navigate to "My Profile" and click on "Edit Profile". Fill in your personal information, skills, education, and work experience. Make sure to upload a professional profile picture to make your profile stand out.'
      },
      {
        question: 'How can I change my password?',
        answer: 'To change your password, go to "Settings", scroll to the "Security" section, and click on "Change Password". Enter your current password and your new password twice to confirm.'
      },
      {
        question: 'What are the benefits of verifying my account?',
        answer: 'Verified accounts receive priority in job listings, have higher visibility to employers, and gain access to premium features like direct messaging with employers and application insights.'
      }
    ],
    applications: [
      {
        question: 'How do I apply for a job?',
        answer: 'To apply for a job, navigate to "Find Jobs", browse available positions, and click on "Apply Now" for the job you are interested in. Complete the application form, attach required documents, and submit your application.'
      },
      {
        question: 'Can I edit my application after submitting?',
        answer: 'Yes, you can edit your application until the employer starts reviewing it. Go to "My Applications", find the application you want to edit, click on "View" and then "Edit Application".'
      },
      {
        question: 'How do I check my application status?',
        answer: 'To check your application status, go to "My Applications". Each application will display its current status: Submitted, Under Review, Shortlisted, Interview Scheduled, Rejected, or Hired.'
      }
    ],
    account: [
      {
        question: 'How do I delete my account?',
        answer: 'To delete your account, go to "Settings", scroll to the bottom to find "Delete Account". Review the information about account deletion, check the confirmation box, and click "Delete My Account". Note that this action cannot be undone.'
      },
      {
        question: 'What happens to my data when I delete my account?',
        answer: 'When you delete your account, your personal information, job applications, and messages will be permanently removed. However, anonymized statistical data may be retained for platform analytics.'
      },
      {
        question: 'How do I update my notification preferences?',
        answer: 'To update notification preferences, go to "Settings" and select the "Notifications" tab. From there, you can customize which notifications you receive via email, SMS, or in-app alerts.'
      }
    ],
    technical: [
      {
        question: 'The website is loading slowly. What can I do?',
        answer: 'Try clearing your browser cache and cookies, then reload the page. Make sure you have a stable internet connection. If the issue persists, try using a different browser or device.'
      },
      {
        question: 'I can\'t upload my resume. What should I do?',
        answer: 'Make sure your resume file is in PDF, DOCX, or RTF format and is under 5MB in size. If you still have issues, try converting your file to PDF and uploading again. If problems persist, contact support.'
      },
      {
        question: 'How do I report a bug?',
        answer: 'To report a bug, go to "Help & Support" and click on "Report an Issue". Describe the problem in detail, including steps to reproduce it, and submit the form. Screenshots are helpful if available.'
      }
    ]
  };

  // Filter FAQs based on search query
  const filteredFAQs = searchQuery 
    ? Object.values(faqData).flat().filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData[activeCategory];

  return (
    <div className="employee-help-container">
      {/* Mobile Nav Overlay */}
      {mobileNavActive && (
        <div 
          className="employee-help-mobile-nav-overlay active"
          onClick={() => setMobileNavActive(false)}
        />
      )}

      {/* Header */}
      <header className="employee-help-header">
        <div className="employee-help-header-container">
          <div className="employee-help-header-left">
            <button 
              ref={navToggleRef}
              className={`employee-help-nav-toggle ${mobileNavActive ? 'active' : ''}`} 
              onClick={() => setMobileNavActive(!mobileNavActive)}
              aria-label="Toggle navigation"
            >
              <span className="employee-help-hamburger-icon"></span>
            </button>
            
            <Link to="/employee-dashboard" className="employee-help-logo">
              {/* Use logo image if available, otherwise fallback to text */}
              {isDarkMode ? (
                logoDark ? (
                  <img 
                    src={logoDark} 
                    alt="Next Youth" 
                    className="employee-help-logo-image" 
                  />
                ) : (
                  <span className="employee-help-logo-text">Next Youth</span>
                )
              ) : (
                logoLight ? (
                  <img 
                    src={logoLight} 
                    alt="Next Youth" 
                    className="employee-help-logo-image" 
                  />
                ) : (
                  <span className="employee-help-logo-text">Next Youth</span>
                )
              )}
            </Link>
            
            <nav 
              ref={mobileNavRef}
              className={`employee-help-nav ${mobileNavActive ? 'active' : ''}`}
            >
              <Link to="/employee-dashboard" className="employee-help-nav-link">Dashboard</Link>
              <Link to="/find-jobs" className="employee-help-nav-link">Find Jobs</Link>
              <Link to="/find-jobs/saved" className="employee-help-nav-link">Saved Jobs</Link>
              <Link to="/proposals" className="employee-help-nav-link">Proposals</Link>
              <Link to="/help" className="employee-help-nav-link active">Help</Link>
            </nav>
          </div>
          
          <div className="employee-help-header-right">
            <button 
              className="employee-help-theme-toggle-button" 
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            <div className="employee-help-profile-dropdown-container">
              <button 
                className="employee-help-profile-button" 
                onClick={() => setProfileDropdownActive(!profileDropdownActive)}
              >
                {userData.profileImage ? (
                  <img 
                    src={userData.profileImage} 
                    alt={userData.name} 
                    className="employee-help-profile-avatar" 
                  />
                ) : (
                  <FaUser className="employee-help-profile-avatar-icon" />
                )}
                <FaChevronDown className={`employee-help-dropdown-icon ${profileDropdownActive ? 'rotate' : ''}`} />
              </button>
              
              {profileDropdownActive && (
                <div className="employee-help-profile-dropdown" ref={profileDropdownRef}>
                  <div className="employee-help-profile-dropdown-header">
                    <div className="employee-help-profile-dropdown-avatar">
                      {userData.profileImage ? (
                        <img src={userData.profileImage} alt={userData.name} />
                      ) : (
                        <FaUser />
                      )}
                    </div>
                    <div className="employee-help-profile-dropdown-info">
                      <h4>{userData.name || 'User'}</h4>
                      <div className="employee-help-profile-status">
                        {userData.isVerified ? (
                          <>
                            <span className="employee-help-verified-icon">●</span> Verified
                          </>
                        ) : (
                          <>
                            <span className="employee-help-pending-icon">●</span> Unverified
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="employee-help-profile-dropdown-links">
                    <Link to="/my-profile" className="employee-help-profile-dropdown-link">
                      <FaUser /> My Profile
                    </Link>
                    <Link to="/settings" className="employee-help-profile-dropdown-link">
                      <FaTools /> Settings
                    </Link>
                    <button 
                      className="employee-help-profile-dropdown-link" 
                      onClick={async () => {
                        try {
                          const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { 
                            withCredentials: true 
                          });
                          if (response.data.success) {
                            navigate('/login');
                          }
                        } catch (error) {
                          console.error('Error logging out:', error);
                        }
                      }}
                    >
                      <FaUserShield /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="employee-help-main">
        <div className="employee-help-content">
          <div className="employee-help-header-section">
            <h1>Help & Support</h1>
            <p>Find answers to common questions and get the support you need</p>
          </div>

          {/* Search Bar */}
          <div className="employee-help-search-container">
            <div className="employee-help-search-wrapper">
              <FaQuestionCircle className="employee-help-search-icon" />
              <input
                type="text"
                className="employee-help-search-input"
                placeholder="Search for help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="employee-help-clear-search"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Help Categories */}
          {!searchQuery && (
            <div className="employee-help-categories">
              <button 
                className={`employee-help-category-button ${activeCategory === 'general' ? 'active' : ''}`}
                onClick={() => setActiveCategory('general')}
              >
                <FaBook />
                <span>General</span>
              </button>
              <button 
                className={`employee-help-category-button ${activeCategory === 'applications' ? 'active' : ''}`}
                onClick={() => setActiveCategory('applications')}
              >
                <FaFileAlt />
                <span>Applications</span>
              </button>
              <button 
                className={`employee-help-category-button ${activeCategory === 'account' ? 'active' : ''}`}
                onClick={() => setActiveCategory('account')}
              >
                <FaUser />
                <span>Account</span>
              </button>
              <button 
                className={`employee-help-category-button ${activeCategory === 'technical' ? 'active' : ''}`}
                onClick={() => setActiveCategory('technical')}
              >
                <FaTools />
                <span>Technical</span>
              </button>
            </div>
          )}

          {/* FAQ Section */}
          <div className="employee-help-faq-section">
            <h2>{searchQuery ? 'Search Results' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1) + ' FAQs'}</h2>
            
            {filteredFAQs.length > 0 ? (
              <div className="employee-help-faq-list">
                {filteredFAQs.map((faq, index) => (
                  <details key={index} className="employee-help-faq-item">
                    <summary className="employee-help-faq-question">
                      {faq.question}
                    </summary>
                    <div className="employee-help-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="employee-help-no-results">
                <FaQuestionCircle className="employee-help-no-results-icon" />
                <h3>No results found</h3>
                <p>We couldn't find any FAQ matching your search. Try different keywords or contact our support team.</p>
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="employee-help-contact-section">
            <h2>Still need help?</h2>
            <p>Our support team is here to assist you with any questions or issues.</p>
            
            <div className="employee-help-contact-methods">
              <div className="employee-help-contact-card">
                <div className="employee-help-contact-icon">
                  <FaEnvelope />
                </div>
                <h3>Email Support</h3>
                <p>Get help via email for complex issues</p>
                <a href="mailto:support@nextyouth.com" className="employee-help-contact-button">
                  support@nextyouth.com
                </a>
              </div>
              
              <div className="employee-help-contact-card">
                <div className="employee-help-contact-icon">
                  <FaHeadset />
                </div>
                <h3>Live Chat</h3>
                <p>Chat with our support team in real-time</p>
                <button className="employee-help-contact-button">
                  Start Chat
                </button>
              </div>
              
              <div className="employee-help-contact-card">
                <div className="employee-help-contact-icon">
                  <FaPhone />
                </div>
                <h3>Phone Support</h3>
                <p>Available Monday-Friday, 9AM-5PM</p>
                <a href="tel:+15551234567" className="employee-help-contact-button">
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="employee-help-footer">
        <div className="employee-help-footer-container">
          <p className="employee-help-footer-copyright">
            &copy; {new Date().getFullYear()} Next Youth. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EmployeeHelp;
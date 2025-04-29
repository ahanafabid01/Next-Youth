import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaRegFileAlt, 
  FaChevronDown, 
  FaCheckCircle, 
  FaSun, 
  FaMoon, 
  FaUserCircle, 
  FaBell, 
  FaClock,
  FaArrowLeft,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import './EmployeeDashboard.css';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const profileDropdownRef = useRef(null);
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    return parseInt(localStorage.getItem("unread-notifications") || "2");
  });

  const [user, setUser] = useState({ 
    name: '', 
    profilePicture: '',
    isVerified: false 
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });

  const API_BASE_URL = 'http://localhost:4000/api';

  // Update the fetchUserData function to check localStorage for read status
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

        // For demo purposes, create some notification items based on user verification status
        const notificationsData = [
          {
            id: 1,
            icon: (!verificationData || !verificationData.frontImage || !verificationData.backImage || verificationData.status === 'rejected')
              ? "file" : (verificationData.status === 'verified') ? "check" : "clock",
            message: (!verificationData || !verificationData.frontImage || !verificationData.backImage || verificationData.status === 'rejected')
              ? "Please verify your account" 
              : (verificationData.status === 'verified') ? "Your profile has been verified!" : "Your verification is pending approval",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            isRead: false
          },
          {
            id: 2,
            icon: "file",
            message: "New job matching your skills is available",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            isRead: false
          },
          {
            id: 3,
            icon: "briefcase",
            message: "Your application for Web Developer position is being reviewed",
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            isRead: true
          },
          {
            id: 4,
            icon: "message",
            message: "You received a new message from a potential employer",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            isRead: true
          }
        ];
        
        // Get read status from localStorage
        try {
          const readStatusJSON = localStorage.getItem("read-notifications-status");
          if (readStatusJSON) {
            const readStatus = JSON.parse(readStatusJSON);
            // Apply read status to notifications
            notificationsData.forEach(notification => {
              if (readStatus[notification.id]) {
                notification.isRead = true;
              }
            });
          }
        } catch (err) {
          console.error('Error parsing read status from localStorage:', err);
        }
        
        // Count unread notifications
        const unreadCount = notificationsData.filter(n => !n.isRead).length;
        setUnreadNotifications(unreadCount);
        localStorage.setItem("unread-notifications", unreadCount.toString());
        
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  const handleOutsideClick = useCallback((event) => {
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

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Update the handleMarkAllAsRead function
  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, isRead: true }))
    );
    
    setUnreadNotifications(0);
    localStorage.setItem("unread-notifications", "0");
    
    // Save read status to localStorage
    const readStatus = {};
    notifications.forEach(notification => {
      readStatus[notification.id] = true;
    });
    localStorage.setItem("read-notifications-status", JSON.stringify(readStatus));
  }, [notifications]);

  // Update the handleMarkAsRead function
  const handleMarkAsRead = useCallback((id) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
    
    const unreadCount = notifications.filter(notification => !notification.isRead && notification.id !== id).length;
    setUnreadNotifications(unreadCount);
    localStorage.setItem("unread-notifications", unreadCount.toString());
    
    // Update read status in localStorage
    try {
      const readStatusJSON = localStorage.getItem("read-notifications-status");
      const readStatus = readStatusJSON ? JSON.parse(readStatusJSON) : {};
      readStatus[id] = true;
      localStorage.setItem("read-notifications-status", JSON.stringify(readStatus));
    } catch (err) {
      console.error('Error updating read status in localStorage:', err);
    }
  }, [notifications]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (icon) => {
    switch(icon) {
      case 'check': return <FaCheckCircle />;
      case 'clock': return <FaClock />;
      case 'file': 
      default:
        return <FaRegFileAlt />;
    }
  };

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

  const handleVerifyAccount = useCallback(() => {
    navigate('/verify-account');
  }, [navigate]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/my-profile');
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    const dashboardElement = document.querySelector('.notifications-page');
    if (dashboardElement) {
      dashboardElement.classList.toggle('dark-mode', isDarkMode);
    }
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="notifications-page">
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
            <div className="notification-container">
              <Link 
                to="/employee-dashboard" 
                className="notification-button"
                aria-label="Dashboard"
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </Link>
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
                          <><FaCheckCircle className="verified-icon" /> Verified</>
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
                      onClick={() => navigate('/my-profile')}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {(!user.idVerification || 
                      !user.idVerification.frontImage || 
                      !user.idVerification.backImage || 
                      user.idVerification.status === 'rejected') && (
                      <button 
                        className="profile-dropdown-link"
                        onClick={() => navigate('/verify-account')}
                      >
                        <FaRegFileAlt /> Verify Account
                      </button>
                    )}
                    
                    <button 
                      className="profile-dropdown-link"
                      onClick={() => navigate('/settings')}
                    >
                      <FaCog /> Settings
                    </button>
                    
                    <button 
                      className="profile-dropdown-link"
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

      <main className="notifications-main">
        <div className="notifications-container">
          <div className="notifications-header">
            <div className="back-button-container">
              <button 
                className="back-to-dashboard-button"
                onClick={() => navigate('/employee-dashboard')}
              >
                <FaArrowLeft /> Back to Dashboard
              </button>
            </div>
            <h1>Your Notifications</h1>
            <div className="notifications-actions">
              <button 
                className="mark-all-read-button"
                onClick={handleMarkAllAsRead}
                disabled={!notifications.some(n => !n.isRead)}
              >
                Mark All as Read
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your notifications...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>{error}</p>
              <button 
                className="retry-button"
                onClick={fetchUserData}
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="empty-notifications">
              <div className="empty-icon">
                <FaBell />
              </div>
              <p>You don't have any notifications yet.</p>
              <p className="empty-subtext">When you receive notifications, they will appear here.</p>
            </div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.isRead ? '' : 'unread'}`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.icon)}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    <span className="notification-timestamp">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="unread-indicator" title="Unread notification"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
          <div className="footer-copyright">
            <p>&copy; {currentYear} Next Youth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Notifications;
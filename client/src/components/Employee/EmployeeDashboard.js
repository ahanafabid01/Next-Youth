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
  FaHome, 
  FaQuestionCircle,
  FaBriefcase,
  FaBookmark,
  FaFileAlt,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaClock,
  FaStar,
  FaSearch,
  FaChartBar,
  FaLightbulb,
  FaAngleRight,
  FaFilter,
  FaSort,
  FaAngleLeft,
  FaExclamationTriangle,
  FaBars
} from 'react-icons/fa';
import './EmployeeDashboard.css';
import RatingModal from '../Connections/RatingModal';
import logoLight from '../../assets/images/logo-light.png'; 
import logoDark from '../../assets/images/logo-dark.png';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const [showJobsDropdown, setShowJobsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const jobsDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    return parseInt(localStorage.getItem("unread-notifications") || "2");
  });

  const [user, setUser] = useState({ 
    name: '', 
    profilePicture: '',
    isVerified: false 
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const dashboardTheme = localStorage.getItem("dashboard-theme");
    const loginTheme = localStorage.getItem("theme");
    // First check dashboard-theme, then fall back to theme
    return dashboardTheme ? dashboardTheme === "dark" : loginTheme === "dark";
  });

  const API_BASE_URL = 'http://localhost:4000/api';

  const [allAvailableJobs, setAllAvailableJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [allJobs, setAllJobs] = useState([]);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [appliedJobsCount, setAppliedJobsCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortOption, setSortOption] = useState('Latest First');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [API_BASE_URL, navigate]);

  const fetchAvailableJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsResponse, appliedResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/jobs/available`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/jobs/applied`, { withCredentials: true })
      ]);
      
      if (jobsResponse.data.success) {
        const allJobsData = jobsResponse.data.jobs;
        const appliedJobIds = appliedResponse.data.success 
          ? appliedResponse.data.jobs.map(job => job._id)
          : [];
        const unappliedJobs = allJobsData.filter(job => !appliedJobIds.includes(job._id));
        setAvailableJobs(unappliedJobs.slice(0, 3));
        setAllJobs(unappliedJobs);
      } else {
        setError("Failed to fetch available jobs.");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.response?.data?.message || "An error occurred while fetching jobs.");
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  const fetchAllAvailableJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      let queryParams = `page=${page}&limit=${jobsPerPage}`;
      if (categoryFilter !== 'All Categories') {
        queryParams += `&category=${categoryFilter}`;
      }
      
      const [jobsResponse, appliedResponse, savedResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/jobs/available?${queryParams}`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/jobs/applied`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/jobs/saved`, { withCredentials: true })
      ]);
      
      if (jobsResponse.data.success) {
        const allJobs = jobsResponse.data.jobs;
        const appliedJobIds = appliedResponse.data.success 
          ? appliedResponse.data.jobs.map(job => job._id)
          : [];
        const savedJobIds = savedResponse.data.success
          ? savedResponse.data.jobs.map(job => job._id)
          : [];
        
        let unappliedJobs = allJobs.filter(job => !appliedJobIds.includes(job._id));
        
        unappliedJobs = unappliedJobs.map(job => ({
          ...job,
          isSaved: savedJobIds.includes(job._id)
        }));
        
        if (sortOption === 'Oldest First') {
          unappliedJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortOption === 'Highest Budget') {
          unappliedJobs.sort((a, b) => {
            const budgetA = a.budgetType === 'fixed' ? a.fixedAmount : a.hourlyTo;
            const budgetB = b.budgetType === 'fixed' ? b.fixedAmount : b.hourlyTo;
            return budgetB - budgetA;
          });
        } else if (sortOption === 'Lowest Budget') {
          unappliedJobs.sort((a, b) => {
            const budgetA = a.budgetType === 'fixed' ? a.fixedAmount : a.hourlyFrom;
            const budgetB = b.budgetType === 'fixed' ? b.fixedAmount : b.hourlyFrom;
            return budgetA - budgetB;
          });
        }
        
        setAllAvailableJobs(unappliedJobs);
        setTotalJobs(jobsResponse.data.totalJobs || unappliedJobs.length);
      } else {
        setError("Failed to fetch available jobs.");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.response?.data?.message || "An error occurred while fetching jobs.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, jobsPerPage, categoryFilter, sortOption]);

  const fetchUserJobStats = useCallback(async () => {
    try {
      const savedResponse = await axios.get(`${API_BASE_URL}/jobs/saved`, { 
        withCredentials: true 
      });
      
      if (savedResponse.data.success) {
        setSavedJobsCount(savedResponse.data.jobs.length);
      }
      
      const appliedResponse = await axios.get(`${API_BASE_URL}/jobs/applied`, { 
        withCredentials: true 
      });
      
      if (appliedResponse.data.success) {
        setAppliedJobsCount(appliedResponse.data.jobs.length);
      }
    } catch (err) {
      console.error("Error fetching job statistics:", err);
    }
  }, [API_BASE_URL]);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    fetchAllAvailableJobs(pageNumber);
  }, [fetchAllAvailableJobs]);

  const handleOutsideClick = useCallback((event) => {
    if (jobsDropdownRef.current && !jobsDropdownRef.current.contains(event.target)) {
      setShowJobsDropdown(false);
    }
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
    }
    if (!event.target.closest('.employee-dashboard-nav') && 
        !event.target.closest('.employee-dashboard-nav-toggle')) {
      setShowMobileNav(false);
    }
    if (!event.target.closest('.employee-filter-panel') && 
        !event.target.closest('.employee-filter-toggle')) {
      setShowFilters(false);
    }
  }, []);

  const toggleMobileNav = useCallback((e) => {
    e.stopPropagation();
    
    // When opening nav, close other dropdowns
    setShowMobileNav(prev => {
      if (!prev) {
        setShowNotifications(false);
        setShowProfileDropdown(false);
        setShowJobsDropdown(false);
        setShowFilters(false);
      }
      return !prev;
    });
  }, []);

  const toggleJobsDropdown = useCallback((e) => {
    e.stopPropagation();
    setShowJobsDropdown(prev => !prev);
  }, []);

  const toggleProfileDropdown = useCallback((e) => {
    e.stopPropagation();
    setShowProfileDropdown(prev => !prev);
  }, []);

  const toggleNotifications = useCallback((e) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  }, []);

  const toggleFilters = useCallback((e) => {
    e.stopPropagation();
    setShowFilters(prev => !prev);
  }, []);

  const viewJobDetails = useCallback((jobId) => {
    navigate(`/find-jobs/details/${jobId}`);
  }, [navigate]);

  const navigateToJobSection = useCallback((section) => {
    setShowJobsDropdown(false);
    switch(section) {
      case 'find-work':
        navigate('/find-jobs');
        break;
      case 'saved-jobs':
        navigate('/find-jobs/saved');
        break;
      case 'proposals':
        navigate('/find-jobs/proposals');
        break;
      default:
        navigate('/find-jobs');
    }
  }, [navigate]);

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
  }, [API_BASE_URL, navigate]);

  const handleVerifyAccount = useCallback(() => {
    navigate('/verify-account');
  }, [navigate]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/my-profile');
  }, [navigate]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prevMode => {
      const newMode = !prevMode;
      // Update both theme keys for consistency
      localStorage.setItem("dashboard-theme", newMode ? "dark" : "light");
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  }, []);

  const formatBudget = useCallback((job) => {
    return job.budgetType === "hourly" 
      ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
      : `$${job.fixedAmount} Fixed`;
  }, []);

  const handleSaveJob = useCallback(async (jobId, isSaved) => {
    const originalJobs = [...allAvailableJobs];
    
    setAllAvailableJobs(prevJobs => 
      prevJobs.map(job => 
        job._id === jobId 
          ? { ...job, isSaved: !isSaved, isUpdating: true } 
          : job
      )
    );
    
    try {
      if (isSaved) {
        await axios.post(`${API_BASE_URL}/jobs/${jobId}/save/remove`, {}, {
          withCredentials: true
        });
      } else {
        await axios.post(`${API_BASE_URL}/jobs/${jobId}/save`, {}, {
          withCredentials: true
        });
      }
      
      setAllAvailableJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId 
            ? { ...job, isSaved: !isSaved, isUpdating: false } 
            : job
        )
      );
      
      fetchUserJobStats();
      
    } catch (err) {
      console.error("Error toggling job saved status:", err);
      
      setAllAvailableJobs(originalJobs);
      
      const errorMsg = err.response?.data?.message || 
        (isSaved ? "Failed to unsave job." : "Failed to save job.");
      alert(errorMsg);
    }
  }, [API_BASE_URL, fetchUserJobStats, allAvailableJobs]);

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
    fetchUserData();
    fetchAvailableJobs();
    fetchUserJobStats();
  }, [fetchUserData, fetchAvailableJobs, fetchUserJobStats]);

  useEffect(() => {
    fetchAllAvailableJobs(currentPage);
  }, [fetchAllAvailableJobs, currentPage]);

  useEffect(() => {
    const dashboardElement = document.querySelector('.employee-dashboard-container');
    if (dashboardElement) {
      dashboardElement.classList.toggle('employee-dark-mode', isDarkMode);
    }
    // Update both keys
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("unread-notifications", unreadNotifications.toString());
  }, [unreadNotifications]);

  useEffect(() => {
    if (showMobileNav) {
      document.body.classList.add('mobile-nav-active');
    } else {
      document.body.classList.remove('mobile-nav-active');
    }
    
    return () => {
      document.body.classList.remove('mobile-nav-active');
    };
  }, [showMobileNav]);

  useEffect(() => {
    // On initial load, check if user came from login with dark mode
    const loginTheme = localStorage.getItem("theme");
    if (loginTheme === "dark" && !isDarkMode) {
      setIsDarkMode(true);
    }
  }, []);

  const currentYear = new Date().getFullYear();
  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  const Pagination = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="employee-pagination">
        <div className="employee-pagination-info">
          Showing {allAvailableJobs.length} of {totalJobs} jobs
        </div>
        <div className="employee-pagination-controls">
          <button 
            className="employee-pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
            aria-label="Go to first page"
          >
            <FaAngleLeft /> <FaAngleLeft />
          </button>
          <button 
            className="employee-pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Go to previous page"
          >
            <FaAngleLeft />
          </button>
          
          {startPage > 1 && (
            <>
              <button 
                className="employee-pagination-button"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="employee-pagination-ellipsis">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`employee-pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
              aria-label={`Page ${number}`}
              aria-current={currentPage === number ? "page" : undefined}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="employee-pagination-ellipsis">...</span>}
              <button 
                className="employee-pagination-button"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button 
            className="employee-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Go to next page"
          >
            <FaAngleRight />
          </button>
          <button 
            className="employee-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
            aria-label="Go to last page"
          >
            <FaAngleRight /> <FaAngleRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="employee-dashboard-container">
      <div className={`employee-mobile-nav-overlay ${showMobileNav ? 'active' : ''}`} onClick={() => setShowMobileNav(false)}></div>
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
              <Link to="/employee-dashboard/messages" className="employee-nav-link" style={{"--item-index": 4}}>Messages</Link>
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
                        {(!user.idVerification || 
                          !user.idVerification.frontImage || 
                          !user.idVerification.backImage || 
                          user.idVerification.status === 'rejected') ? (
                          <FaRegFileAlt />
                        ) : user.idVerification.status === 'verified' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaClock />
                        )}
                      </div>
                      <div className="employee-notification-content">
                        <p>
                          {(!user.idVerification || 
                            !user.idVerification.frontImage || 
                            !user.idVerification.backImage || 
                            user.idVerification.status === 'rejected') ? (
                            "Please verify your account"
                          ) : user.idVerification.status === 'verified' ? (
                            "Your profile has been verified!"
                          ) : (
                            "Your verification is pending approval"
                          )}
                        </p>
                        <span className="employee-notification-time">2 hours ago</span>
                      </div>
                    </div>
                    <div className="employee-notification-item employee-unread">
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
                      onClick={handleNavigateToProfile}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {(!user.idVerification || 
                      !user.idVerification.frontImage || 
                      !user.idVerification.backImage || 
                      user.idVerification.status === 'rejected') && (
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
                      <FaLightbulb /> Settings
                    </button>
                    <button 
                      className="employee-profile-dropdown-link"
                      onClick={handleLogout}
                    >
                      <FaChartBar /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="employee-dashboard-main">
        <div className="employee-dashboard-welcome-section">
          <div className="employee-dashboard-welcome-container">
            <div className="employee-welcome-content">
              <h1>Welcome back, {user.name || 'User'}!</h1>
              <p>Here's what's happening with your job search today</p>
            </div>

            {(!user.idVerification || 
              !user.idVerification.frontImage || 
              !user.idVerification.backImage || 
              user.idVerification.status === 'rejected') && (
              <button 
                className="employee-verify-account-button"
                onClick={handleVerifyAccount}
              >
                Verify Your Account
              </button>
            )}

            {user.idVerification && 
              user.idVerification.frontImage && 
              user.idVerification.backImage && 
              user.idVerification.status === 'pending' && (
              <div className="employee-verification-pending-badge">
                <FaClock /> Verification Pending
              </div>
            )}
          </div>
        </div>

        <div className="employee-dashboard-content">
          <div className="employee-dashboard-stats">
            <div className="employee-stat-card">
              <div className="employee-stat-icon">
                <FaBriefcase />
              </div>
              <div className="employee-stat-content">
                <h3>Jobs Matching Your Skills</h3>
                <p className="employee-stat-number">{availableJobs.length}</p>
              </div>
            </div>
            <div className="employee-stat-card">
              <div className="employee-stat-icon">
                <FaFileAlt />
              </div>
              <div className="employee-stat-content">
                <h3>Active Proposals</h3>
                <p className="employee-stat-number">{appliedJobsCount}</p>
              </div>
            </div>
            <div className="employee-stat-card">
              <div className="employee-stat-icon">
                <FaBookmark />
              </div>
              <div className="employee-stat-content">
                <h3>Saved Jobs</h3>
                <p className="employee-stat-number">{savedJobsCount}</p>
              </div>
            </div>
          </div>

          <div className="employee-dashboard-jobs-section">
            <div className="employee-section-header">
              <h2>Jobs You Might Like</h2>
              <Link to="/find-jobs" className="employee-see-all-link">See All Jobs</Link>
            </div>
            
            {loading ? (
              <div className="employee-jobs-loading">Loading available jobs...</div>
            ) : error ? (
              <div className="employee-error-message">{error}</div>
            ) : availableJobs.length === 0 ? (
              <div className="employee-no-jobs-message">
                <p>No available jobs at the moment. Check back later for new opportunities.</p>
              </div>
            ) : (
              <div className="employee-jobs-grid">
                {availableJobs.map((job) => (
                  <div key={job._id} className="employee-job-card">
                    <div className="employee-job-card-header">
                      <h3 className="employee-job-title">{job.title}</h3>
                      <p className="employee-job-budget">{formatBudget(job)}</p>
                    </div>
                    <p className="employee-job-description">
                      {job.description.length > 100 
                        ? `${job.description.substring(0, 100)}...` 
                        : job.description}
                    </p>
                    <div className="employee-job-skills">
                      {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="employee-skill-tag">
                          {skill}
                        </span>
                      ))}
                      {job.skills && job.skills.length > 3 && (
                        <span className="employee-more-skills">
                          +{job.skills.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="employee-job-card-footer">
                      <button 
                        className="employee-view-job-button" 
                        onClick={() => viewJobDetails(job._id)}
                      >
                        View Details
                      </button>
                      {job.files && job.files.length > 0 && (
                        <div className="employee-job-attachments">
                          <FaRegFileAlt /> {job.files.length} attachment{job.files.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="employee-all-jobs-section">
            <div className="employee-section-header">
              <h2>Available Jobs</h2>
              <div className="employee-jobs-filter-container">
                <button 
                  className="employee-filter-toggle"
                  onClick={toggleFilters}
                  aria-expanded={showFilters}
                  aria-label="Toggle filters"
                >
                  <FaFilter /> <span className="filter-text">Filters</span>
                </button>
                
                <div className={`employee-filter-panel ${showFilters ? 'active' : ''}`}>
                  <div className="employee-filter-group">
                    <label htmlFor="categoryFilter">Category:</label>
                    <select 
                      id="categoryFilter"
                      className="employee-filter-select"
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                        fetchAllAvailableJobs(1);
                      }}
                    >
                      <option>All Categories</option>
                      <option>Web Development</option>
                      <option>Design</option>
                      <option>Marketing</option>
                      <option>Writing</option>
                    </select>
                  </div>
                  
                  <div className="employee-filter-group">
                    <label htmlFor="sortOption">Sort By:</label>
                    <select 
                      id="sortOption"
                      className="employee-filter-select"
                      value={sortOption}
                      onChange={(e) => {
                        setSortOption(e.target.value);
                        fetchAllAvailableJobs(currentPage);
                      }}
                    >
                      <option>Latest First</option>
                      <option>Oldest First</option>
                      <option>Highest Budget</option>
                      <option>Lowest Budget</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="employee-jobs-loading">Loading available jobs...</div>
            ) : error ? (
              <div className="employee-error-message">{error}</div>
            ) : allAvailableJobs.length === 0 ? (
              <div className="employee-no-jobs-message">
                <p>No available jobs at the moment. Check back later for new opportunities.</p>
              </div>
            ) : (
              <>
                <div className="employee-jobs-list">
                  {allAvailableJobs.map((job) => (
                    <div key={job._id} className="employee-job-list-item">
                      <h3 className="employee-job-list-title">{job.title}</h3>
                      <div className="employee-job-list-info">
                        <span className="employee-job-budget">
                          <span className="budget-label">Budget:</span> {formatBudget(job)}
                        </span>
                        <span className="employee-job-posted">
                          <span className="posted-label">Posted:</span> {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="employee-job-list-description">
                        {job.description?.length > 180
                          ? `${job.description.substring(0, 180)}...` 
                          : job.description}
                      </p>
                      <div className="employee-job-list-skills">
                        {job.skills?.slice(0, 5).map((skill, index) => (
                          <span key={index} className="employee-skill-tag">
                            {skill}
                          </span>
                        ))}
                        {job.skills?.length > 5 && (
                          <span className="employee-more-skills">
                            +{job.skills.length - 5}
                          </span>
                        )}
                      </div>
                      <div className="employee-job-list-footer">
                        <button 
                          className="employee-view-job-button" 
                          onClick={() => viewJobDetails(job._id)}
                        >
                          View Details <FaAngleRight />
                        </button>
                        <button 
                          className={`employee-save-job-button ${job.isSaved ? 'saved' : ''} ${job.isUpdating ? 'updating' : ''}`}
                          onClick={() => handleSaveJob(job._id, job.isSaved)}
                          disabled={job.isUpdating}
                          aria-label={job.isSaved ? "Unsave job" : "Save job"}
                        >
                          <FaBookmark /> 
                          <span>
                            {job.isUpdating ? 'Updating...' : job.isSaved ? 'Saved' : 'Save Job'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalPages > 1 && <Pagination />}
              </>
            )}
          </div>

          <div className="employee-job-tips-section">
            <div className="employee-section-header">
              <h2>Career Tips & Insights</h2>
            </div>
            <div className="employee-tips-grid">
              <div className="employee-tip-card">
                <div className="employee-tip-icon">
                  <FaLightbulb />
                </div>
                <h3>Optimize Your Profile</h3>
                <p>Complete your profile with relevant skills and experience to appear in more job searches and increase your visibility to potential clients.</p>
                <Link to="/profile-optimization" className="employee-tip-link">Learn more <FaAngleRight /></Link>
              </div>
              <div className="employee-tip-card">
                <div className="employee-tip-icon">
                  <FaSearch />
                </div>
                <h3>Search Strategies</h3>
                <p>Use specific keywords related to your skills when searching for jobs to find better matches. Filter by project type, budget, and client history.</p>
                <Link to="/search-strategies" className="employee-tip-link">Learn more <FaAngleRight /></Link>
              </div>
              <div className="employee-tip-card">
                <div className="employee-tip-icon">
                  <FaFileAlt />
                </div>
                <h3>Proposal Tips</h3>
                <p>Customize each proposal to highlight how your specific experience matches the job requirements. Address client needs and demonstrate your expertise.</p>
                <Link to="/proposal-tips" className="employee-tip-link">Learn more <FaAngleRight /></Link>
              </div>
            </div>
          </div>
        </div>
        
        {showRatingModal && (
          <RatingModal
            isOpen={true}
            onClose={() => setShowRatingModal(false)}
            viewOnly={true}
          />
        )}
      </main>

      <footer className="employee-dashboard-footer">
        <div className="employee-footer-content">
          <div className="employee-footer-grid">
            <div className="employee-footer-column">
              <h3>For Freelancers</h3>
              <ul>
                <li><Link to="/find-jobs">Find Work</Link></li>
                <li><Link to="/resources">Resources</Link></li>
                <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
                <li><Link to="/freelancer-forum">Community Forum</Link></li>
                <li><Link to="/freelancer-stories">Success Stories</Link></li>
              </ul>
            </div>
            
            <div className="employee-footer-column">
              <h3>Resources</h3>
              <ul>
                <li><Link to="/help-center">Help Center</Link></li>
                <li><Link to="/webinars">Webinars</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/api-docs">Developer API</Link></li>
                <li><Link to="/partner-program">Partner Program</Link></li>
              </ul>
            </div>
            
            <div className="employee-footer-column">
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
          
          <div className="employee-footer-bottom">
            <div className="employee-footer-bottom-container">
              <div className="employee-footer-logo">
                <Link to="/">
                  <img 
                    src={isDarkMode ? logoDark : logoLight} 
                    alt="Next Youth" 
                    className="employee-footer-logo-image" 
                  />
                </Link>
              </div>
              
              <div className="employee-footer-legal-links">
                <Link to="/terms">Terms of Service</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/accessibility">Accessibility</Link>
                <Link to="/sitemap">Site Map</Link>
              </div>
              
              <div className="employee-footer-social">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <FaFacebook />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <FaTwitter />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <FaLinkedin />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <FaInstagram />
                </a>
              </div>
            </div>
            
            <div className="employee-footer-copyright">
              <p>&copy; {currentYear} Next Youth. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployeeDashboard;
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
} from 'react-icons/fa';
import './EmployeeDashboard.css';

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
    return localStorage.getItem("dashboard-theme") === "dark";
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
  }, [navigate]);

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
    if (!event.target.closest('.dashboard-nav')) {
      setShowMobileNav(false);
    }
  }, []);

  const toggleMobileNav = useCallback((e) => {
    e.stopPropagation();
    setShowMobileNav(prev => !prev);
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
  }, [navigate]);

  const handleVerifyAccount = useCallback(() => {
    navigate('/verify-account');
  }, [navigate]);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/my-profile');
  }, [navigate]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
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
    // Change from document.body to the dashboard element
    const dashboardElement = document.querySelector('.employee-dashboard');
    if (dashboardElement) {
      dashboardElement.classList.toggle('dark-mode', isDarkMode);
    }
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("unread-notifications", unreadNotifications.toString());
  }, [unreadNotifications]);

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
      <div className="pagination">
        <button 
          className="pagination-button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(1)}
        >
          First
        </button>
        <button 
          className="pagination-button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          &lt;
        </button>
        
        {startPage > 1 && <span className="pagination-ellipsis">...</span>}
        
        {pageNumbers.map(number => (
          <button
            key={number}
            className={`pagination-button ${currentPage === number ? 'active' : ''}`}
            onClick={() => handlePageChange(number)}
          >
            {number}
          </button>
        ))}
        
        {endPage < totalPages && <span className="pagination-ellipsis">...</span>}
        
        <button 
          className="pagination-button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          &gt;
        </button>
        <button 
          className="pagination-button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(totalPages)}
        >
          Last
        </button>
      </div>
    );
  };

  return (
    <div className="employee-dashboard">
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
            <Link to="/employee-dashboard" className="dashboard-logo">Next Youth</Link>
            
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
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button className="mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notification-icon">
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
                      <div className="notification-content">
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
                      onClick={handleNavigateToProfile}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {/* Show verify account option when appropriate */}
                    {(!user.idVerification || 
                      !user.idVerification.frontImage || 
                      !user.idVerification.backImage || 
                      user.idVerification.status === 'rejected') && (
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

      <main className="dashboard-main">
        <div className="dashboard-welcome-section">
          <div className="dashboard-welcome-container">
            <div className="welcome-content">
              <h1>Welcome back, {user.name || 'User'}!</h1>
              <p>Here's what's happening with your job search today</p>
            </div>

            {/* Show verification button if user hasn't submitted verification or was rejected */}
            {(!user.idVerification || 
              !user.idVerification.frontImage || 
              !user.idVerification.backImage || 
              user.idVerification.status === 'rejected') && (
              <button 
                className="verify-account-button"
                onClick={handleVerifyAccount}
              >
                Verify Your Account
              </button>
            )}

            {/* Show pending badge only if verification exists with images and status is pending */}
            {user.idVerification && 
              user.idVerification.frontImage && 
              user.idVerification.backImage && 
              user.idVerification.status === 'pending' && (
              <div className="verification-pending-badge">
                <FaClock /> Verification Pending
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <FaBriefcase />
              </div>
              <div className="stat-content">
                <h3>Jobs Matching Your Skills</h3>
                <p className="stat-number">{availableJobs.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaFileAlt />
              </div>
              <div className="stat-content">
                <h3>Active Proposals</h3>
                <p className="stat-number">{appliedJobsCount}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <FaBookmark />
              </div>
              <div className="stat-content">
                <h3>Saved Jobs</h3>
                <p className="stat-number">{savedJobsCount}</p>
              </div>
            </div>
          </div>

          <div className="dashboard-jobs-section">
            <div className="section-header">
              <h2>Jobs You Might Like</h2>
              <Link to="/find-jobs" className="see-all-link">See All Jobs</Link>
            </div>
            
            {loading ? (
              <div className="jobs-loading">Loading available jobs...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : availableJobs.length === 0 ? (
              <div className="no-jobs-message">
                <p>No available jobs at the moment. Check back later for new opportunities.</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {availableJobs.map((job) => (
                  <div key={job._id} className="job-card">
                    <div className="job-card-header">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-budget">{formatBudget(job)}</p>
                    </div>
                    <p className="job-description">
                      {job.description.length > 100 
                        ? `${job.description.substring(0, 100)}...` 
                        : job.description}
                    </p>
                    <div className="job-skills">
                      {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                      {job.skills && job.skills.length > 3 && (
                        <span className="more-skills">
                          +{job.skills.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="job-card-footer">
                      <button 
                        className="view-job-button" 
                        onClick={() => viewJobDetails(job._id)}
                      >
                        View Details
                      </button>
                      {job.files && job.files.length > 0 && (
                        <div className="job-attachments">
                          <FaRegFileAlt /> {job.files.length} attachment{job.files.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="all-jobs-section">
            <div className="section-header">
              <h2>Available Jobs</h2>
              <div className="jobs-filter">
                <select 
                  className="filter-select"
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
                <select 
                  className="filter-select"
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
            
            {loading ? (
              <div className="jobs-loading">Loading available jobs...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : allAvailableJobs.length === 0 ? (
              <div className="no-jobs-message">
                <p>No available jobs at the moment. Check back later for new opportunities.</p>
              </div>
            ) : (
              <>
                <div className="jobs-list">
                  {allAvailableJobs.map((job) => (
                    <div key={job._id} className="job-list-item">
                      <h3 className="job-list-title">{job.title}</h3>
                      <div className="job-list-info">
                        <span className="job-budget">{formatBudget(job)}</span>
                        <span className="job-posted">Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="job-list-description">
                        {job.description.length > 150 
                          ? `${job.description.substring(0, 150)}...` 
                          : job.description}
                      </p>
                      <div className="job-list-skills">
                        {job.skills && job.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                        {job.skills && job.skills.length > 5 && (
                          <span className="more-skills">
                            +{job.skills.length - 5}
                          </span>
                        )}
                      </div>
                      <div className="job-list-footer">
                        <button 
                          className="view-job-button" 
                          onClick={() => viewJobDetails(job._id)}
                        >
                          View Details
                        </button>
                        <button 
                          className={`save-job-button ${job.isSaved ? 'saved' : ''} ${job.isUpdating ? 'updating' : ''}`}
                          onClick={() => handleSaveJob(job._id, job.isSaved)}
                          disabled={job.isUpdating}
                        >
                          <FaBookmark /> {job.isUpdating ? 'Updating...' : job.isSaved ? 'Saved' : 'Save Job'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {totalPages > 1 && <Pagination />}
              </>
            )}
          </div>
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

export default EmployeeDashboard;
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaChevronDown, 
  FaCheckCircle, 
  FaSun, 
  FaMoon, 
  FaUserCircle, 
  FaBell, 
  FaRegFileAlt, 
  FaClock,
  FaSort,
  FaFilter,
  FaAngleRight,
  FaAngleLeft,
  FaTrashAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaBars,
  FaBookmark,
  FaStar,
  FaCog,
  FaSignOutAlt,
} from 'react-icons/fa';
import './SavedJobs.css';
import logoLight from '../../assets/images/logo-light.png'; 
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const SavedJobs = () => {
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(5);
  const [totalJobs, setTotalJobs] = useState(0);
  const [sortOption, setSortOption] = useState('Latest First');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
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

  const [showRatingModal, setShowRatingModal] = useState(false);

  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch user data
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

  // Fetch saved jobs
  const fetchSavedJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/saved?page=${page}&limit=${jobsPerPage}`, { 
        withCredentials: true 
      });
      
      if (response.data.success) {
        let jobs = response.data.jobs;
        
        if (sortOption === 'Oldest First') {
          jobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortOption === 'Highest Budget') {
          jobs.sort((a, b) => {
            const budgetA = a.budgetType === 'fixed' ? a.fixedAmount : a.hourlyTo;
            const budgetB = b.budgetType === 'fixed' ? b.fixedAmount : b.hourlyTo;
            return budgetB - budgetA;
          });
        } else if (sortOption === 'Lowest Budget') {
          jobs.sort((a, b) => {
            const budgetA = a.budgetType === 'fixed' ? a.fixedAmount : a.hourlyFrom;
            const budgetB = b.budgetType === 'fixed' ? b.fixedAmount : b.hourlyFrom;
            return budgetA - budgetB;
          });
        }
        
        if (categoryFilter !== 'All Categories') {
          jobs = jobs.filter(job => job.category === categoryFilter);
        }
        
        setSavedJobs(jobs);
        setTotalJobs(response.data.totalJobs || jobs.length);
      } else {
        setError("Failed to fetch saved jobs.");
      }
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
      setError(err.response?.data?.message || "An error occurred while fetching saved jobs.");
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate, jobsPerPage, sortOption, categoryFilter]);

  const handleRemoveSavedJob = useCallback(async (jobId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/jobs/${jobId}/save/remove`, {}, {
        withCredentials: true
      });
      
      if (response.data.success) {
        // If successful, update the local state to remove the job
        setSavedJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));
        setTotalJobs(prev => Math.max(0, prev - 1));
        
        // If we remove the last item on the current page and there are more pages, go to the previous page
        if (savedJobs.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      }
    } catch (err) {
      console.error("Error removing saved job:", err);
      alert(err.response?.data?.message || "Failed to remove the job from saved list.");
    }
  }, [API_BASE_URL, savedJobs.length, currentPage]);

  const viewJobDetails = useCallback((jobId) => {
    navigate(`/find-jobs/details/${jobId}`);
  }, [navigate]);

  const formatBudget = useCallback((job) => {
    return job.budgetType === "hourly" 
      ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
      : `$${job.fixedAmount} Fixed`;
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const toggleProfileDropdown = useCallback((e) => {
    e.stopPropagation();
    setShowProfileDropdown(prev => !prev);
  }, []);

  const toggleNotifications = useCallback((e) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  }, []);
  
  const toggleMobileNav = useCallback((e) => {
    e.stopPropagation();
    
    // Toggle active class on the nav toggle button for animation
    const navToggle = document.querySelector('.employee-saved-nav-toggle');
    navToggle.classList.toggle('active');
    
    setShowMobileNav(prev => !prev);
    
    // Prevent body scrolling when menu is open
    if (!showMobileNav) {
      document.body.classList.add('employee-saved-mobile-nav-active');
    } else {
      document.body.classList.remove('employee-saved-mobile-nav-active');
    }
  }, [showMobileNav]);

  const toggleFilters = useCallback((e) => {
    e.stopPropagation();
    setShowFilters(prev => !prev);
  }, []);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    fetchSavedJobs(pageNumber);
  }, [fetchSavedJobs]);

  const handleOutsideClick = useCallback((event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
    }
    if (!event.target.closest('.employee-saved-nav') && 
        !event.target.closest('.employee-saved-nav-toggle')) {
      setShowMobileNav(false);
      
      // Also remove active class from hamburger when clicked outside
      const navToggle = document.querySelector('.employee-saved-nav-toggle');
      if (navToggle) navToggle.classList.remove('active');
      
      document.body.classList.remove('employee-saved-mobile-nav-active');
    }
    if (!event.target.closest('.employee-saved-filter-panel') && 
        !event.target.closest('.employee-saved-filter-toggle')) {
      setShowFilters(false);
    }
  }, []);

  const handleMarkAllAsRead = useCallback((e) => {
    e.stopPropagation();
    setUnreadNotifications(0);
    localStorage.setItem("unread-notifications", "0");
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
  }, [API_BASE_URL, navigate]);

  // Effect for handling outside clicks
  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  // Effect for setting dark mode class
  useEffect(() => {
    const dashboardElement = document.querySelector('.employee-saved-container');
    if (dashboardElement) {
      dashboardElement.classList.toggle('employee-saved-dark-mode', isDarkMode);
    }
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Add this useEffect to clean up the body class when component unmounts
  useEffect(() => {
    return () => {
      document.body.classList.remove('employee-saved-mobile-nav-active');
    };
  }, []);

  // Effect for fetching initial data
  useEffect(() => {
    fetchUserData();
    fetchSavedJobs(currentPage);
  }, [fetchUserData, fetchSavedJobs, currentPage]);

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Pagination Component
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
      <div className="employee-saved-pagination">
        <div className="employee-saved-pagination-info">
          Showing {savedJobs.length} of {totalJobs} saved jobs
        </div>
        <div className="employee-saved-pagination-controls">
          <button 
            className="employee-saved-pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
            aria-label="Go to first page"
          >
            <FaAngleLeft /> <FaAngleLeft />
          </button>
          <button 
            className="employee-saved-pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Go to previous page"
          >
            <FaAngleLeft />
          </button>
          
          {startPage > 1 && (
            <>
              <button 
                className="employee-saved-pagination-button"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="employee-saved-pagination-ellipsis">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`employee-saved-pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
              aria-label={`Page ${number}`}
              aria-current={currentPage === number ? "page" : undefined}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="employee-saved-pagination-ellipsis">...</span>}
              <button 
                className="employee-saved-pagination-button"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button 
            className="employee-saved-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Go to next page"
          >
            <FaAngleRight />
          </button>
          <button 
            className="employee-saved-pagination-button"
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
    <div className="employee-saved-container">
      <div className={`employee-saved-mobile-nav-overlay ${showMobileNav ? 'active' : ''}`} onClick={() => setShowMobileNav(false)}></div>
      <header className="employee-saved-header">
        <div className="employee-saved-header-container">
          <div className="employee-saved-header-left">
            <button 
              className={`employee-saved-nav-toggle ${showMobileNav ? 'active' : ''}`}
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
              aria-expanded={showMobileNav}
            >
              <span className="employee-saved-hamburger-icon"></span>
            </button>
            <Link to="/employee-dashboard" className="employee-saved-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-saved-logo-image" 
              />
            </Link>
            
            <nav className={`employee-saved-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="employee-saved-nav-link" style={{"--item-index": 0}}>Find Work</Link>
              <Link to="/find-jobs/saved" className="employee-saved-nav-link active" style={{"--item-index": 1}}>Saved Jobs</Link>
              <Link to="/proposals" className="employee-saved-nav-link" style={{"--item-index": 2}}>Proposals</Link>
              <Link to="/help" className="employee-saved-nav-link" style={{"--item-index": 3}}>Help</Link>
            </nav>
          </div>
          
          <div className="employee-saved-header-right">
            <div className="employee-saved-notification-container" ref={notificationsRef}>
              <button 
                className="employee-saved-notification-button"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="employee-saved-notification-badge">{unreadNotifications}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="employee-saved-notifications-dropdown">
                  <div className="employee-saved-notification-header">
                    <h3>Notifications</h3>
                    <button className="employee-saved-mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                  </div>
                  <div className="employee-saved-notification-list">
                    <div className="employee-saved-notification-item employee-saved-unread">
                      <div className="employee-saved-notification-icon">
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
                      <div className="employee-saved-notification-content">
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
                        <span className="employee-saved-notification-time">2 hours ago</span>
                      </div>
                    </div>
                    <div className="employee-saved-notification-item employee-saved-unread">
                      <div className="employee-saved-notification-icon">
                        <FaRegFileAlt />
                      </div>
                      <div className="employee-saved-notification-content">
                        <p>New job matching your skills is available</p>
                        <span className="employee-saved-notification-time">1 day ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="employee-saved-notification-footer">
                    <Link to="/notifications">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="employee-saved-theme-toggle-button"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>

            <div className="employee-saved-profile-dropdown-container" ref={profileDropdownRef}>
              <button 
                className="employee-saved-profile-button" 
                onClick={toggleProfileDropdown}
                aria-label="User profile"
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture}
                    alt="Profile"
                    className="employee-saved-profile-avatar"
                  />
                ) : (
                  <FaUserCircle className="employee-saved-profile-avatar-icon" />
                )}
                <FaChevronDown className={`employee-saved-dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="employee-saved-profile-dropdown">
                  <div className="employee-saved-profile-dropdown-header">
                    <div className="employee-saved-profile-dropdown-avatar">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture}
                          alt={`${user.name}'s profile`}
                        />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="employee-saved-profile-dropdown-info">
                      <h4>{user.name || 'User'}</h4>
                      <span className="employee-saved-profile-status">
                        {!user.idVerification ? (
                          'Not Verified'
                        ) : user.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="employee-saved-verified-icon" /> Verified</>
                        ) : user.idVerification.status === 'pending' && user.idVerification.frontImage && user.idVerification.backImage ? (
                          <><FaClock className="employee-saved-pending-icon" /> Verification Pending</>
                        ) : user.idVerification.status === 'rejected' ? (
                          <>Verification Rejected</>
                        ) : (
                          'Not Verified'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="employee-saved-profile-dropdown-links">
                    <Link to="/my-profile" className="employee-saved-profile-dropdown-link">
                      <FaUserCircle /> View Profile
                    </Link>
                    <button 
                      className="employee-saved-profile-dropdown-link"
                      onClick={() => {
                        setShowProfileDropdown(false); // Close dropdown
                        setShowRatingModal(true); // Show rating modal
                      }}
                    >
                      <FaStar /> My Ratings & Reviews
                    </button>
                    <Link to="/settings" className="employee-saved-profile-dropdown-link">
                      <FaCog /> Settings
                    </Link>
                    <button className="employee-saved-profile-dropdown-link" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="employee-saved-main">
        <div className="employee-saved-content">
          <div className="employee-saved-header-section">
            <h1 className="employee-saved-title">
              <FaBookmark className="employee-saved-title-icon" /> Saved Jobs
            </h1>
            <p className="employee-saved-subtitle">
              Manage your saved jobs and apply when you're ready
            </p>
          </div>

          <div className="employee-saved-filters-section">
            <div className="employee-saved-filters-header">
              <div className="employee-saved-search-count">
                {totalJobs} saved {totalJobs === 1 ? 'job' : 'jobs'} found
              </div>
              
              <div className="employee-saved-filter-container">
                <button 
                  className="employee-saved-filter-toggle"
                  onClick={toggleFilters}
                  aria-expanded={showFilters}
                >
                  <FaFilter /> <span>Filter & Sort</span>
                </button>
                
                <div className={`employee-saved-filter-panel ${showFilters ? 'active' : ''}`}>
                  <div className="employee-saved-filter-group">
                    <label htmlFor="categoryFilter">Category:</label>
                    <select 
                      id="categoryFilter"
                      className="employee-saved-filter-select"
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setCurrentPage(1);
                        fetchSavedJobs(1);
                      }}
                    >
                      <option>All Categories</option>
                      <option>Web Development</option>
                      <option>Design</option>
                      <option>Marketing</option>
                      <option>Writing</option>
                      <option>Customer Support</option>
                    </select>
                  </div>
                  
                  <div className="employee-saved-filter-group">
                    <label htmlFor="sortOption">Sort By:</label>
                    <select 
                      id="sortOption"
                      className="employee-saved-filter-select"
                      value={sortOption}
                      onChange={(e) => {
                        setSortOption(e.target.value);
                        fetchSavedJobs(currentPage);
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
          </div>

          {loading ? (
            <div className="employee-saved-loading">
              <div className="employee-saved-loading-spinner"></div>
              <p>Loading your saved jobs...</p>
            </div>
          ) : error ? (
            <div className="employee-saved-error">
              <p>{error}</p>
              <button 
                className="employee-saved-retry-button"
                onClick={() => fetchSavedJobs(currentPage)}
              >
                Try Again
              </button>
            </div>
          ) : savedJobs.length === 0 ? (
            <div className="employee-saved-empty-state">
              <div className="employee-saved-empty-icon">
                <FaBookmark />
              </div>
              <h2>No saved jobs yet</h2>
              <p>Jobs you save will appear here. Save jobs you're interested in to apply later.</p>
              <Link to="/find-jobs" className="employee-saved-find-jobs-button">
                Browse Available Jobs
              </Link>
            </div>
          ) : (
            <>
              <div className="employee-saved-jobs-list">
                {savedJobs.map(job => (
                  <div className="employee-saved-job-card" key={job._id}>
                    <div className="employee-saved-job-header">
                      <h2 className="employee-saved-job-title">{job.title}</h2>
                      <div className="employee-saved-job-actions">
                        <button
                          className="employee-saved-job-action-button"
                          onClick={() => handleRemoveSavedJob(job._id)}
                          aria-label="Remove from saved jobs"
                          title="Remove from saved jobs"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                    
                    <div className="employee-saved-job-details">
                      <div className="employee-saved-job-detail">
                        <span className="employee-saved-detail-icon"><FaBriefcase /></span>
                        <span className="employee-saved-detail-text">{formatBudget(job)}</span>
                      </div>
                      <div className="employee-saved-job-detail">
                        <span className="employee-saved-detail-icon"><FaCalendarAlt /></span>
                        <span className="employee-saved-detail-text">Posted: {formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="employee-saved-job-description">
                      {job.description?.length > 180
                        ? `${job.description.substring(0, 180)}...` 
                        : job.description}
                    </div>
                    
                    <div className="employee-saved-skills-container">
                      <h3 className="employee-saved-skills-title">Required Skills:</h3>
                      <div className="employee-saved-job-skills">
                        {job.skills?.map((skill, index) => (
                          <span key={index} className="employee-saved-skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="employee-saved-job-footer">
                      <button
                        className="employee-saved-view-job-button"
                        onClick={() => viewJobDetails(job._id)}
                      >
                        View Details <FaExternalLinkAlt />
                      </button>
                      <Link
                        to={`/jobs/apply/${job._id}`}
                        className="employee-saved-apply-button"
                      >
                        Apply Now <FaAngleRight />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalPages > 1 && <Pagination />}
            </>
          )}

          <div className="employee-saved-tips-section">
            <h2 className="employee-saved-section-title">Tips for Finding the Right Jobs</h2>
            <div className="employee-saved-tips-grid">
              <div className="employee-saved-tip-card">
                <h3>Save jobs that match your skills</h3>
                <p>Focus on jobs where you meet at least 70% of the requirements to increase your success rate.</p>
              </div>
              <div className="employee-saved-tip-card">
                <h3>Apply strategically</h3>
                <p>Quality over quantity - send fewer but highly customized applications to stand out.</p>
              </div>
              <div className="employee-saved-tip-card">
                <h3>Review before applying</h3>
                <p>Take time to thoroughly read job descriptions and prepare targeted responses.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="employee-saved-footer">
        <div className="employee-saved-footer-content">
          <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
          <div className="employee-saved-footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/help">Help Center</Link>
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

export default SavedJobs;
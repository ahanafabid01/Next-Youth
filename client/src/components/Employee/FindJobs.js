import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaExclamationTriangle,
  FaSearch, 
  FaFilter, 
  FaAngleRight, 
  FaAngleLeft, 
  FaBookmark, 
  FaRegFileAlt,
  FaSun, 
  FaMoon,
  FaBell,
  FaUserCircle,
  FaChevronDown,
  FaBars,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import './FindJobs.css';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const FindJobs = () => {
  const navigate = useNavigate();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage] = useState(10);
  const [totalJobs, setTotalJobs] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [sortOption, setSortOption] = useState('Latest First');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const filtersRef = useRef(null);
  
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
  
  // Budget range filter
  const [budgetRange, setBudgetRange] = useState({
    min: '',
    max: ''
  });
  
  // Skills filter with multiselect
  const [selectedSkills, setSelectedSkills] = useState([]);
  const skillOptions = [
    'JavaScript', 'React', 'Node.js', 'Python', 'UI/UX Design',
    'Content Writing', 'Marketing', 'Data Analysis', 'WordPress',
    'Mobile Development', 'Graphic Design', 'SEO'
  ];
  
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

  const fetchAvailableJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Build query parameters
      let queryParams = `page=${page}&limit=${jobsPerPage}`;
      if (categoryFilter !== 'All Categories') {
        queryParams += `&category=${categoryFilter}`;
      }
      if (searchQuery) {
        queryParams += `&search=${searchQuery}`;
      }
      if (budgetRange.min) {
        queryParams += `&minBudget=${budgetRange.min}`;
      }
      if (budgetRange.max) {
        queryParams += `&maxBudget=${budgetRange.max}`;
      }
      if (selectedSkills.length > 0) {
        queryParams += `&skills=${selectedSkills.join(',')}`;
      }
      
      const [jobsResponse, savedResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/jobs/available?${queryParams}`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/jobs/saved`, { withCredentials: true })
      ]);
      
      if (jobsResponse.data.success) {
        const allJobs = jobsResponse.data.jobs;
        const savedJobIds = savedResponse.data.success
          ? savedResponse.data.jobs.map(job => job._id)
          : [];
        
        // Mark saved jobs and add sorting
        let processedJobs = allJobs.map(job => ({
          ...job,
          isSaved: savedJobIds.includes(job._id)
        }));
        
        // Apply sorting
        if (sortOption === 'Oldest First') {
          processedJobs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (sortOption === 'Latest First') {
          processedJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortOption === 'Highest Budget') {
          processedJobs.sort((a, b) => {
            const budgetA = a.budgetType === 'fixed' ? a.fixedAmount : a.hourlyTo;
            const budgetB = b.budgetType === 'fixed' ? b.fixedAmount : b.hourlyTo;
            return budgetB - budgetA;
          });
        } else if (sortOption === 'Lowest Budget') {
          processedJobs.sort((a, b) => {
            const budgetA = a.budgetType === 'fixed' ? a.fixedAmount : a.hourlyFrom;
            const budgetB = b.budgetType === 'fixed' ? b.fixedAmount : b.hourlyFrom;
            return budgetA - budgetB;
          });
        }
        
        setAvailableJobs(processedJobs);
        setTotalJobs(jobsResponse.data.totalJobs || processedJobs.length);
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
      setIsSearching(false);
    }
  }, [API_BASE_URL, navigate, jobsPerPage, categoryFilter, searchQuery, budgetRange, selectedSkills, sortOption]);

  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
    fetchAvailableJobs(pageNumber);
    // Scroll to top of results
    document.querySelector('.employee-jobs-section')?.scrollIntoView({ behavior: 'smooth' });
  }, [fetchAvailableJobs]);

  const viewJobDetails = useCallback((jobId) => {
    navigate(`/find-jobs/details/${jobId}`);
  }, [navigate]);

  const handleSaveJob = useCallback(async (jobId, isSaved) => {
    const originalJobs = [...availableJobs];
    
    // Optimistic UI update
    setAvailableJobs(prevJobs => 
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
      
      // Update UI after success
      setAvailableJobs(prevJobs => 
        prevJobs.map(job => 
          job._id === jobId 
            ? { ...job, isSaved: !isSaved, isUpdating: false } 
            : job
        )
      );
      
    } catch (err) {
      console.error("Error toggling job saved status:", err);
      // Revert to original state on error
      setAvailableJobs(originalJobs);
      const errorMsg = err.response?.data?.message || 
        (isSaved ? "Failed to unsave job." : "Failed to save job.");
      alert(errorMsg);
    }
  }, [API_BASE_URL, availableJobs]);

  const formatBudget = useCallback((job) => {
    return job.budgetType === "hourly" 
      ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
      : `$${job.fixedAmount} Fixed`;
  }, []);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
    setIsSearching(true);
    fetchAvailableJobs(1);
  }, [fetchAvailableJobs]);

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

  const toggleFilters = useCallback((e) => {
    e.stopPropagation();
    setShowFilters(prev => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      if (response.data.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [API_BASE_URL, navigate]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const resetFilters = useCallback(() => {
    setCategoryFilter('All Categories');
    setSortOption('Latest First');
    setBudgetRange({ min: '', max: '' });
    setSelectedSkills([]);
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const handleMarkAllAsRead = useCallback((e) => {
    e.stopPropagation();
    setUnreadNotifications(0);
    localStorage.setItem("unread-notifications", "0");
  }, []);

  // Handle clicks outside dropdowns
  const handleOutsideClick = useCallback((event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
    }
    if (!event.target.closest('.employee-dashboard-nav')) {
      setShowMobileNav(false);
    }
    if (filtersRef.current && !filtersRef.current.contains(event.target) && 
        !event.target.closest('.employee-filter-toggle')) {
      setShowFilters(false);
    }
  }, []);

  // Effect for outside clicks
  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  // Effect to fetch jobs and user data
  useEffect(() => {
    fetchUserData();
    fetchAvailableJobs(currentPage);
  }, [fetchUserData, fetchAvailableJobs, currentPage]);

  // Effect to update dark/light theme
  useEffect(() => {
    const dashboardElement = document.querySelector('.employee-find-jobs-container');
    const headerElement = document.querySelector('.employee-find-jobs-header');
    
    if (dashboardElement) {
      dashboardElement.classList.toggle('employee-dark-mode', isDarkMode);
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

  // Effect to update local storage for notifications
  useEffect(() => {
    localStorage.setItem("unread-notifications", unreadNotifications.toString());
  }, [unreadNotifications]);

  const totalPages = Math.ceil(totalJobs / jobsPerPage);

  // Pagination component
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
          Showing {availableJobs.length} of {totalJobs} jobs
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

  const [showRatingModal, setShowRatingModal] = useState(false);

  return (
    <div className="employee-find-jobs-container">
      <div className={`employee-mobile-nav-overlay ${showMobileNav ? 'active' : ''}`} onClick={() => setShowMobileNav(false)}></div>
      
      {/* Header */}
      <header className="employee-find-jobs-header">
        <div className="employee-find-jobs-header-container">
          <div className="employee-find-jobs-header-left">
            <button 
              className={`employee-find-jobs-nav-toggle ${showMobileNav ? 'active' : ''}`}
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
              aria-expanded={showMobileNav}
            >
              <span className="employee-hamburger-icon"></span>
            </button>
            <Link to="/employee-dashboard" className="employee-find-jobs-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-logo-image" 
              />
            </Link>
            
            <nav className={`employee-find-jobs-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="employee-nav-link active" style={{"--item-index": 0}}>Find Work</Link>
              <Link to="/find-jobs/saved" className="employee-nav-link" style={{"--item-index": 1}}>Saved Jobs</Link>
              <Link to="/proposals" className="employee-nav-link" style={{"--item-index": 2}}>Proposals</Link>
              <Link to="/help" className="employee-nav-link" style={{"--item-index": 3}}>Help</Link>
            </nav>
          </div>
          
          <div className="employee-find-jobs-header-right">
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
                        {(!user.idVerification || user.idVerification?.status === 'rejected') ? (
                          <FaRegFileAlt />
                        ) : user.idVerification?.status === 'verified' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaClock />
                        )}
                      </div>
                      <div className="employee-notification-content">
                        <p>
                          {(!user.idVerification || user.idVerification?.status === 'rejected') ? (
                            "Please verify your account"
                          ) : user.idVerification?.status === 'verified' ? (
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
                        ) : user.idVerification.status === 'pending' ? (
                          <><FaClock className="employee-pending-icon" /> Verification Pending</>
                        ) : (
                          'Not Verified'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="employee-profile-dropdown-links">
                    <button 
                      className="employee-profile-dropdown-link"
                      onClick={() => navigate('/my-profile')}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    <button 
                      className="employee-profile-dropdown-link"
                      onClick={() => {
                        setShowProfileDropdown(false); // Close dropdown
                        setShowRatingModal(true); // Show rating modal
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

      <main className="employee-find-jobs-main">
        {/* Search Section */}
        <section className="employee-search-section">
          <div className="employee-search-container">
            <h1 className="employee-section-title">Find Your Next Opportunity</h1>
            <p className="employee-section-subtitle">
              Search through thousands of projects matching your skills and interests
            </p>
            
            <form className="employee-search-form" onSubmit={handleSearchSubmit}>
              <div className="employee-search-input-container">
                <FaSearch className="employee-search-icon" />
                <input 
                  type="text"
                  className="employee-search-input"
                  placeholder="Search for jobs by title, skill, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="employee-search-button"
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search Jobs'}
              </button>
            </form>
            
            <div className="employee-search-tags">
              <span className="employee-search-tag-label">Popular:</span>
              {['Web Development', 'Design', 'Writing', 'Marketing', 'Data Analysis'].map(tag => (
                <button 
                  key={tag} 
                  className="employee-search-tag"
                  onClick={() => {
                    setSearchQuery(tag);
                    setCurrentPage(1);
                    fetchAvailableJobs(1);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Jobs Section */}
        <section className="employee-jobs-section">
          <div className="employee-jobs-container">
            <div className="employee-jobs-header">
              <h2 className="employee-jobs-title">
                {searchQuery ? `Search Results for "${searchQuery}"` : 'Available Jobs'}
                {totalJobs > 0 && <span className="employee-jobs-count">({totalJobs})</span>}
              </h2>
              
              <div className="employee-jobs-actions">
                <div className="employee-filter-container" ref={filtersRef}>
                  <button 
                    className="employee-filter-button"
                    onClick={toggleFilters}
                    aria-expanded={showFilters}
                  >
                    <FaFilter /> Filters
                  </button>
                  
                  <div className={`employee-filters-panel ${showFilters ? 'active' : ''}`}>
                    <h3 className="employee-filters-title">Filter Jobs</h3>
                    
                    <div className="employee-filter-group">
                      <label htmlFor="categoryFilter">Category</label>
                      <select 
                        id="categoryFilter"
                        className="employee-filter-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option>All Categories</option>
                        <option>Web Development</option>
                        <option>Design</option>
                        <option>Marketing</option>
                        <option>Writing</option>
                        <option>Mobile Development</option>
                        <option>Data Science</option>
                      </select>
                    </div>
                    
                    <div className="employee-filter-group">
                      <label>Budget Range</label>
                      <div className="employee-budget-inputs">
                        <input
                          type="number"
                          placeholder="Min $"
                          className="employee-filter-input"
                          value={budgetRange.min}
                          onChange={(e) => setBudgetRange({...budgetRange, min: e.target.value})}
                          min="0"
                        />
                        <span className="employee-budget-separator">-</span>
                        <input
                          type="number"
                          placeholder="Max $"
                          className="employee-filter-input"
                          value={budgetRange.max}
                          onChange={(e) => setBudgetRange({...budgetRange, max: e.target.value})}
                          min="0"
                        />
                      </div>
                    </div>
                    
                    <div className="employee-filter-group">
                      <label>Skills</label>
                      <div className="employee-skills-selector">
                        {skillOptions.map(skill => (
                          <div key={skill} className="employee-skill-checkbox">
                            <input
                              type="checkbox"
                              id={`skill-${skill}`}
                              checked={selectedSkills.includes(skill)}
                              onChange={() => {
                                if (selectedSkills.includes(skill)) {
                                  setSelectedSkills(selectedSkills.filter(s => s !== skill));
                                } else {
                                  setSelectedSkills([...selectedSkills, skill]);
                                }
                              }}
                            />
                            <label htmlFor={`skill-${skill}`}>{skill}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="employee-filter-group">
                      <label htmlFor="sortOption">Sort By</label>
                      <select 
                        id="sortOption"
                        className="employee-filter-select"
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value)}
                      >
                        <option>Latest First</option>
                        <option>Oldest First</option>
                        <option>Highest Budget</option>
                        <option>Lowest Budget</option>
                      </select>
                    </div>
                    
                    <div className="employee-filter-actions">
                      <button 
                        className="employee-filter-reset"
                        onClick={resetFilters}
                      >
                        Reset Filters
                      </button>
                      <button 
                        className="employee-filter-apply"
                        onClick={() => {
                          setCurrentPage(1);
                          fetchAvailableJobs(1);
                          setShowFilters(false);
                        }}
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Jobs List */}
            {loading ? (
              <div className="employee-jobs-loading">
                <div className="employee-loader"></div>
                <p>Searching for the perfect opportunities...</p>
              </div>
            ) : error ? (
              <div className="employee-error-message">
                <FaExclamationTriangle /> {error}
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="employee-no-jobs-message">
                <FaSearch className="employee-no-jobs-icon" />
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button 
                  className="employee-reset-search-button"
                  onClick={resetFilters}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="employee-jobs-list">
                  {availableJobs.map((job) => (
                    <div key={job._id} className="employee-job-list-item">
                      <h3 className="employee-job-list-title">
                        {job.title}
                      </h3>
                      <div className="employee-job-list-info">
                        <span className="employee-job-budget">
                          <span className="employee-info-label">Budget:</span> {formatBudget(job)}
                        </span>
                        <span className="employee-job-posted">
                          <span className="employee-info-label">Posted:</span> {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                        <span className="employee-job-scope">
                          <span className="employee-info-label">Scope:</span> {job.scope}
                        </span>
                      </div>
                      <p className="employee-job-list-description">
                        {job.description?.length > 200
                          ? `${job.description.substring(0, 200)}...` 
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
                        <div className="employee-job-actions">
                          {job.files && job.files.length > 0 && (
                            <div className="employee-job-attachments">
                              <FaRegFileAlt /> {job.files.length} attachment{job.files.length > 1 ? 's' : ''}
                            </div>
                          )}
                          <button 
                            className={`employee-save-job-button ${job.isSaved ? 'saved' : ''} ${job.isUpdating ? 'updating' : ''}`}
                            onClick={() => handleSaveJob(job._id, job.isSaved)}
                            disabled={job.isUpdating}
                          >
                            <FaBookmark />
                            <span>{job.isUpdating ? 'Updating...' : job.isSaved ? 'Saved' : 'Save'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && <Pagination />}
              </>
            )}
          </div>
        </section>
        
        {/* Job Search Tips */}
        <section className="employee-tips-section">
          <div className="employee-tips-container">
            <h2 className="employee-section-title">Job Search Tips</h2>
            <div className="employee-tips-grid">
              <div className="employee-tip-card">
                <div className="employee-tip-icon">1</div>
                <h3>Tailor Your Applications</h3>
                <p>Customize each application to highlight relevant skills and experiences that match the job requirements.</p>
              </div>
              <div className="employee-tip-card">
                <div className="employee-tip-icon">2</div>
                <h3>Complete Your Profile</h3>
                <p>A complete profile with portfolio samples increases your chances of getting hired by 40%.</p>
              </div>
              <div className="employee-tip-card">
                <div className="employee-tip-icon">3</div>
                <h3>Respond Quickly</h3>
                <p>Clients often hire candidates who respond promptly. Set up notifications to apply early.</p>
              </div>
              <div className="employee-tip-card">
                <div className="employee-tip-icon">4</div>
                <h3>Showcase Results</h3>
                <p>Focus on demonstrating measurable results and outcomes from your previous work.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="employee-find-jobs-footer">
        <div className="employee-find-jobs-footer-container">
          <div className="employee-footer-copyright">
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

export default FindJobs;
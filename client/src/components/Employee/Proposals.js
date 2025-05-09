import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaFileContract, FaDollarSign, FaRegFileAlt, FaSearch, FaFilter, FaChevronDown, FaRegUser, FaSignOutAlt, 
         FaCog, FaUserCircle, FaSpinner, FaExclamationCircle, 
         FaBell, FaEye, FaEdit, FaTrash, FaCheckCircle, 
         FaClipboardList, FaHourglassHalf, FaCheckDouble, FaTimes, 
         FaSun, FaMoon, FaBars, FaTimesCircle, FaAngleLeft, FaAngleRight, FaClock, FaStar } from 'react-icons/fa';
import './Proposals.css';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import RatingModal from '../Connections/RatingModal';

const Proposals = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState({
    name: '',
    profilePicture: '',
    isVerified: false,
    idVerification: null
  });
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });
  
  // Filter and sort states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOption, setSortOption] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [applicationsPerPage] = useState(5);
  const [totalApplications, setTotalApplications] = useState(0);
  
  // Dropdown refs and states
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const filtersRef = useRef(null);
  
  // Mock notifications for UI demo
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    const savedNotifications = localStorage.getItem('employeeNotifications');
    return savedNotifications ? JSON.parse(savedNotifications) : [
      { id: 1, text: 'Your application was viewed by employer', time: '2 hours ago', read: false },
      { id: 2, text: 'Application status updated to "Accepted"', time: '1 day ago', read: true }
    ];
  });
  
  // Application statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  
  // Confirm modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState(null);
  
  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch user profile data
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

  // Fetch user applications
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/applications`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const applications = response.data.applications;
        setApplications(applications);
        setTotalApplications(applications.length);
        
        // Calculate statistics
        const stats = {
          total: applications.length,
          pending: applications.filter(app => app.status === 'pending').length,
          accepted: applications.filter(app => app.status === 'accepted').length,
          rejected: applications.filter(app => app.status === 'rejected').length
        };
        setStats(stats);
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Failed to load your proposals. Please try again later.");
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  // Filter applications based on selected filters
  const getFilteredApplications = useCallback(() => {
    // First apply status filter
    let filtered = [...applications];
    
    if (statusFilter !== 'All') {
      filtered = filtered.filter(app => app.status.toLowerCase() === statusFilter.toLowerCase());
    }
    
    // Then apply search query if provided
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.job && app.job.title && app.job.title.toLowerCase().includes(query)
      );
    }
    
    // Sort the results
    if (sortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOption === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortOption === 'highest') {
      filtered.sort((a, b) => b.bid - a.bid);
    } else if (sortOption === 'lowest') {
      filtered.sort((a, b) => a.bid - b.bid);
    }
    
    return filtered;
  }, [applications, statusFilter, searchQuery, sortOption]);

  // Get current applications for pagination
  const filteredApplications = getFilteredApplications();
  const indexOfLastApplication = currentPage * applicationsPerPage;
  const indexOfFirstApplication = indexOfLastApplication - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApplication, indexOfLastApplication);
  const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Effect for updating localStorage when isDarkMode changes
  useEffect(() => {
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setShowMobileNav(prev => !prev);
  };

  // Toggle profile dropdown
  const toggleProfileDropdown = (e) => {
    e.stopPropagation();
    setShowProfileDropdown(prev => !prev);
    // Close other dropdowns
    setShowNotifications(false);
    setShowFilters(false);
  };

  // Toggle notifications dropdown
  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
    // Close other dropdowns
    setShowProfileDropdown(false);
    setShowFilters(false);
  };

  // Toggle filters panel
  const toggleFilters = () => {
    setShowFilters(prev => !prev);
    // Close other dropdowns
    setShowProfileDropdown(false);
    setShowNotifications(false);
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };

  // Handle reset filters
  const resetFilters = () => {
    setStatusFilter('All');
    setSearchQuery('');
    setSortOption('newest');
    setCurrentPage(1);
  };

  // Handle marking all notifications as read
  const handleMarkAllAsRead = () => {
    const updatedNotifications = unreadNotifications.map(notif => ({
      ...notif,
      read: true
    }));
    setUnreadNotifications(updatedNotifications);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      if (response.data.success) {
        navigate('/login');
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Confirm application deletion
  const confirmDeleteApplication = (applicationId) => {
    setApplicationToDelete(applicationId);
    setShowDeleteModal(true);
  };

  // Handle application withdrawal/deletion
  const handleDeleteApplication = async () => {
    if (!applicationToDelete) return;
    
    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_BASE_URL}/jobs/application/${applicationToDelete}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Remove the application from the list
        setApplications(prev => prev.filter(app => app._id !== applicationToDelete));
        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          pending: prev.pending - 1 // Assuming we can only delete pending applications
        }));
      } else {
        setError(response.data.message || "Failed to withdraw application");
      }
    } catch (err) {
      console.error("Error withdrawing application:", err);
      setError(err.response?.data?.message || "An error occurred while withdrawing your application");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setApplicationToDelete(null);
    }
  };

  // Close all dropdowns when clicking outside
  const handleOutsideClick = useCallback((event) => {
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
    }
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (filtersRef.current && !filtersRef.current.contains(event.target)) {
      setShowFilters(false);
    }
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate unread notifications count
  const unreadCount = unreadNotifications.filter(n => !n.read).length;

  // Effect for fetching data on component mount
  useEffect(() => {
    fetchUserData();
    fetchApplications();
  }, [fetchUserData, fetchApplications]);

  // Effect for outside clicks
  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [handleOutsideClick]);

  // Effect for saving notifications to localStorage
  useEffect(() => {
    localStorage.setItem('employeeNotifications', JSON.stringify(unreadNotifications));
  }, [unreadNotifications]);

  // Pagination component
  const Pagination = () => {
    // Don't show pagination if we only have one page
    if (totalPages <= 1) return null;

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
      <div className="emp-pagination">
        <div className="emp-pagination-info">
          Showing {indexOfFirstApplication + 1} to {Math.min(indexOfLastApplication, filteredApplications.length)} of {filteredApplications.length} proposals
        </div>
        
        <div className="emp-pagination-controls">
          <button 
            className="emp-pagination-button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
          >
            <FaAngleLeft /> <FaAngleLeft />
          </button>
          
          <button 
            className="emp-pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <FaAngleLeft />
          </button>
          
          {startPage > 1 && (
            <>
              <button 
                className="emp-pagination-button"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && <span className="emp-pagination-ellipsis">...</span>}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`emp-pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
              aria-label={`Page ${number}`}
              aria-current={currentPage === number ? "page" : undefined}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="emp-pagination-ellipsis">...</span>}
              <button 
                className="emp-pagination-button"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button 
            className="emp-pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            aria-label="Go to next page"
          >
            <FaAngleRight />
          </button>
          
          <button 
            className="emp-pagination-button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
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
    <div className={`emp-proposals-container ${isDarkMode ? 'emp-dark-mode' : ''}`}>
      <div className={`emp-mobile-nav-overlay ${showMobileNav ? 'active' : ''}`} onClick={toggleMobileNav}></div>
      
      {/* Header */}
      <header className="emp-proposals-header">
        <div className="emp-proposals-header-container">
          {/* Left side */}
          <div className="emp-proposals-header-left">
            <button 
              className={`emp-nav-toggle ${showMobileNav ? 'active' : ''}`}
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
              aria-expanded={showMobileNav}
            >
              <span className="emp-hamburger-icon"></span>
            </button>
            
            <Link to="/employee-dashboard" className="emp-proposals-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="emp-logo-image" 
              />
            </Link>
            
            <nav className={`emp-proposals-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="emp-nav-link" style={{"--item-index": 0}}>Find Jobs</Link>
              <Link to="/find-jobs/saved" className="emp-nav-link" style={{"--item-index": 1}}>Saved Jobs</Link>
              <Link to="/proposals" className="emp-nav-link active" style={{"--item-index": 2}}>Proposals</Link>
              <Link to="/help" className="emp-nav-link" style={{"--item-index": 3}}>Help</Link>
            </nav>
          </div>
          
          {/* Right side */}
          <div className="emp-proposals-header-right">
            {/* Theme toggle button */}
            <button className="emp-theme-toggle-button" onClick={toggleDarkMode}>
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
            
            {/* Notifications dropdown */}
            <div className="emp-notification-container" ref={notificationsRef}>
              <button className="emp-notification-button" onClick={toggleNotifications}>
                <FaBell />
                {unreadCount > 0 && (
                  <span className="emp-notification-badge">{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="emp-notifications-dropdown">
                  <div className="emp-notification-header">
                    <h3>Notifications</h3>
                    <button className="emp-mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                  </div>
                  
                  <div className="emp-notification-list">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`emp-notification-item ${!notification.read ? 'emp-unread' : ''}`}
                        >
                          <div className="emp-notification-icon">
                            <FaBell />
                          </div>
                          <div className="emp-notification-content">
                            <p>{notification.text}</p>
                            <span className="emp-notification-time">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="emp-notification-item">
                        <div className="emp-notification-icon">
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
                        <div className="emp-notification-content">
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
                          <span className="emp-notification-time">2 hours ago</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="emp-notification-footer">
                    <a href="/notifications">View all notifications</a>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile dropdown */}
            <div className="emp-profile-dropdown-container" ref={profileDropdownRef}>
              <button className="emp-profile-button" onClick={toggleProfileDropdown}>
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="emp-profile-avatar" />
                ) : (
                  <FaUserCircle className="emp-profile-avatar-icon" />
                )}
                <span className={`emp-dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`}>
                  <FaChevronDown />
                </span>
              </button>
              
              {showProfileDropdown && (
                <div className="emp-profile-dropdown">
                  <div className="emp-profile-dropdown-header">
                    <div className="emp-profile-dropdown-avatar">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt="Profile" />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="emp-profile-dropdown-info">
                      <h4>{user.name || 'User'}</h4>
                      <div className="emp-profile-status">
                        {!user.idVerification ? (
                          'Not Verified'
                        ) : user.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="emp-verified-icon" /> Verified</>
                        ) : user.idVerification.status === 'pending' && user.idVerification.frontImage && user.idVerification.backImage ? (
                          <><FaClock className="emp-pending-icon" /> Verification Pending</>
                        ) : user.idVerification.status === 'rejected' ? (
                          <>Verification Rejected</>
                        ) : (
                          'Not Verified'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="emp-profile-dropdown-links">
                    <Link to="/my-profile" className="emp-profile-dropdown-link">
                      <FaRegUser />
                      My Profile
                    </Link>
                    <button 
                      className="emp-profile-dropdown-link"
                      onClick={() => {
                        setShowProfileDropdown(false); // Close dropdown
                        setShowRatingModal(true); // Show rating modal
                      }}
                    >
                      <FaStar />
                      My Ratings & Reviews
                    </button>
                    <Link to="/settings" className="emp-profile-dropdown-link">
                      <FaCog />
                      Settings
                    </Link>
                    <button className="emp-profile-dropdown-link" onClick={handleLogout}>
                      <FaSignOutAlt />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="emp-proposals-main">
        {/* Title section */}
        <section className="emp-proposals-title-section">
          <h1>My Proposals</h1>
          <p>Track and manage all your job applications</p>
        </section>
        
        {/* Stats section */}
        <section className="emp-proposals-stats-section">
          <div className="emp-proposals-stats-container">
            <div className="emp-proposals-stat-card">
              <div className="emp-stat-icon">
                <FaClipboardList />
              </div>
              <div className="emp-stat-content">
                <div className="emp-stat-number">{stats.total}</div>
                <h3>Total Proposals</h3>
              </div>
            </div>
            
            <div className="emp-proposals-stat-card">
              <div className="emp-stat-icon emp-icon-pending">
                <FaHourglassHalf />
              </div>
              <div className="emp-stat-content">
                <div className="emp-stat-number">{stats.pending}</div>
                <h3>Pending Review</h3>
              </div>
            </div>
            
            <div className="emp-proposals-stat-card">
              <div className="emp-stat-icon emp-icon-accepted">
                <FaCheckDouble />
              </div>
              <div className="emp-stat-content">
                <div className="emp-stat-number">{stats.accepted}</div>
                <h3>Accepted</h3>
              </div>
            </div>
            
            <div className="emp-proposals-stat-card">
              <div className="emp-stat-icon emp-icon-rejected">
                <FaTimes />
              </div>
              <div className="emp-stat-content">
                <div className="emp-stat-number">{stats.rejected}</div>
                <h3>Rejected</h3>
              </div>
            </div>
          </div>
        </section>
        
        {/* Search and filter section */}
        <section className="employee-proposals-search-section">
          <div className="employee-proposals-search-container">
            <form className="employee-search-form" onSubmit={handleSearchSubmit}>
              <div className="employee-search-input-container">
                <div className="employee-search-icon">
                  <FaSearch />
                </div>
                <input 
                  type="text"
                  placeholder="Search job title..."
                  className="employee-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="employee-search-button">
                Search
              </button>
            </form>
            
            <div className="employee-filter-container" ref={filtersRef}>
              <button className="employee-filter-button" onClick={toggleFilters}>
                <FaFilter />
                Filter
                <FaChevronDown className={`employee-dropdown-icon ${showFilters ? 'rotate' : ''}`} />
              </button>
              
              {showFilters && (
                <div className="employee-filters-panel active">
                  <h3 className="employee-filters-title">Filter Options</h3>
                  
                  <div className="employee-filter-group">
                    <label htmlFor="status-filter">Status</label>
                    <select 
                      id="status-filter"
                      className="employee-filter-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="withdrawn">Withdrawn</option>
                    </select>
                  </div>
                  
                  <div className="employee-filter-group">
                    <label htmlFor="sort-option">Sort By</label>
                    <select 
                      id="sort-option"
                      className="employee-filter-select"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="highest">Highest Bid</option>
                      <option value="lowest">Lowest Bid</option>
                    </select>
                  </div>
                  
                  <div className="employee-filter-actions">
                    <button 
                      className="employee-filter-reset"
                      onClick={resetFilters}
                    >
                      Reset
                    </button>
                    <button 
                      className="employee-filter-apply"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
        
        {/* Proposals list section */}
        <section className="employee-proposals-section">
          <div className="employee-proposals-container">
            <div className="employee-proposals-header">
              <h2 className="employee-proposals-title">
                My Proposals <span className="employee-proposals-count">({filteredApplications.length})</span>
              </h2>
            </div>
            
            {loading ? (
              <div className="employee-proposals-loading">
                <div className="employee-loader"></div>
                <p>Loading your proposals...</p>
              </div>
            ) : error ? (
              <div className="employee-error-message">
                <FaExclamationCircle />
                <p>{error}</p>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="employee-no-proposals-message">
                <div className="employee-no-proposals-icon">
                  <FaClipboardList />
                </div>
                <h3>No proposals found</h3>
                <p>
                  {searchQuery || statusFilter !== 'All' 
                    ? "No proposals match your current filters. Try adjusting your search criteria." 
                    : "You haven't submitted any job applications yet. Start by browsing available jobs."}
                </p>
                {searchQuery || statusFilter !== 'All' ? (
                  <button className="employee-reset-search-button" onClick={resetFilters}>
                    Clear Filters
                  </button>
                ) : (
                  <Link to="/find-jobs" className="employee-find-jobs-button">
                    Find Jobs
                  </Link>
                )}
              </div>
            ) : (
              <div className="employee-proposals-list">
                <div className="employee-proposals-table-header">
                  <div className="employee-proposal-header-cell">
                    Job Title
                    <button 
                      className="employee-sort-button"
                      onClick={() => setSortOption(sortOption === 'newest' ? 'oldest' : 'newest')}
                      title={sortOption === 'newest' ? "Sort by oldest first" : "Sort by newest first"}
                    >
                      {sortOption === 'newest' ? "↓" : "↑"}
                    </button>
                  </div>
                  <div className="employee-proposal-header-cell">
                    Your Bid
                    <button 
                      className="employee-sort-button"
                      onClick={() => setSortOption(sortOption === 'highest' ? 'lowest' : 'highest')}
                      title={sortOption === 'highest' ? "Sort by lowest bid" : "Sort by highest bid"}
                    >
                      {sortOption === 'highest' ? "↓" : "↑"}
                    </button>
                  </div>
                  <div className="employee-proposal-header-cell">Date Applied</div>
                  <div className="employee-proposal-header-cell">Status</div>
                  <div className="employee-proposal-header-cell">Actions</div>
                </div>
                
                {currentApplications.map((application) => (
                  <div key={application._id} className="employee-proposal-item">
                    <div className="employee-proposal-cell employee-job-title-cell">
                      <h3>{application.job?.title || 'Job no longer available'}</h3>
                      <div className="employee-job-employer">
                        Duration: {application.duration}
                      </div>
                    </div>
                    
                    <div className="employee-proposal-cell employee-proposal-bid-cell">
                      <span className="employee-proposal-bid-amount">${application.bid}</span>
                      <span className="employee-proposal-bid-type">
                        You receive: ${application.receivedAmount}
                      </span>
                    </div>
                    
                    <div className="employee-proposal-cell employee-proposal-date-cell">
                      {formatDate(application.createdAt)}
                    </div>
                    
                    <div className="employee-proposal-cell">
                      <span className={`employee-status-badge employee-status-${application.status}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="employee-proposal-cell employee-proposal-actions-cell">
                      <Link 
                        to={`/view-application/${application._id}`} 
                        className="employee-action-button employee-view-button"
                      >
                        <FaEye /> View
                      </Link>
                      
                      {application.status === 'pending' && (
                        <>
                          <Link 
                            to={`/edit-application/${application._id}`} 
                            className="employee-action-button employee-edit-button"
                          >
                            <FaEdit /> Edit
                          </Link>
                          
                          <button 
                            className="employee-action-button employee-delete-button"
                            onClick={() => confirmDeleteApplication(application._id)}
                          >
                            <FaTrash /> Withdraw
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {!loading && !error && filteredApplications.length > 0 && (
              <Pagination />
            )}
          </div>
        </section>
        
        {/* Tips section */}
        <section className="employee-tips-section">
          <div className="employee-tips-container">
            <h2 className="employee-section-title">Tips for Successful Proposals</h2>
            
            <div className="employee-tips-grid">
              <div className="employee-tip-card">
                <div className="employee-tip-icon">
                  <FaFileContract />
                </div>
                <h3>Customize Your Cover Letter</h3>
                <p>Address specific job requirements and explain how your skills match exactly what the employer needs.</p>
              </div>
              
              <div className="employee-tip-card">
                <div className="employee-tip-icon">
                  <FaDollarSign />
                </div>
                <h3>Set Competitive Rates</h3>
                <p>Research market rates for similar jobs and position your bid strategically based on your experience level.</p>
              </div>
              
              <div className="employee-tip-card">
                <div className="employee-tip-icon">
                  <FaRegFileAlt />
                </div>
                <h3>Include Relevant Examples</h3>
                <p>Attach samples of previous work that demonstrate your ability to handle the specific job requirements.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="employee-proposals-footer">
        <div className="employee-proposals-footer-container">
          <p className="employee-footer-copyright">
            &copy; {new Date().getFullYear()} Next Youth. All rights reserved.
          </p>
        </div>
      </footer>
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="employee-modal-overlay">
          <div className="employee-confirm-modal">
            <h3>Withdraw Application</h3>
            <p>Are you sure you want to withdraw this application? This action cannot be undone.</p>
            <div className="employee-confirm-modal-actions">
              <button className="employee-modal-cancel-button" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="employee-modal-confirm-button" onClick={handleDeleteApplication}>
                Withdraw Application
              </button>
            </div>
          </div>
        </div>
      )}

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

export default Proposals;
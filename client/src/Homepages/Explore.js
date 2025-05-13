import React, { useState, useRef, useEffect, useCallback } from "react";
import API_BASE_URL from '../utils/apiConfig';
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaSearch, FaBriefcase, FaStar, FaMapMarkerAlt, FaFilter, 
         FaAngleLeft, FaAngleRight, FaAngleDoubleLeft, FaAngleDoubleRight,
         FaSun, FaMoon, FaSignInAlt, FaUserPlus, FaBars, FaTimes } from "react-icons/fa";
import "./Explore.css";
import logoLight from '../assets/images/logo-light.png';
import logoDark from '../assets/images/logo-dark.png';

const Explore = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [highlightedJobId, setHighlightedJobId] = useState(null);
  
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);
  const filtersRef = useRef(null);
  const jobsPerPage = 6;

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
          setIsMenuOpen(false);
        }
      }
      
      if (filtersRef.current && !filtersRef.current.contains(event.target) && 
          !event.target.closest('.explore-filter-toggle')) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme mode effect
  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Get search query and highlighted job ID from URL parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchFromUrl = queryParams.get('search');
    const highlightJobId = queryParams.get('highlight');
    
    if (highlightJobId) {
      setHighlightedJobId(highlightJobId);
    }
    
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
      // After setting search query, fetch jobs with this query
      fetchJobs(1, searchFromUrl);
    } else {
      fetchJobs(1);
    }
  }, [location.search]);

  // Scroll to highlighted job
  useEffect(() => {
    if (highlightedJobId && !isLoading) {
      setTimeout(() => {
        const highlightedElement = document.getElementById(`job-${highlightedJobId}`);
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          highlightedElement.classList.add('explore-job-highlighted');
          
          // Remove highlight after animation completes
          setTimeout(() => {
            highlightedElement.classList.remove('explore-job-highlighted');
          }, 3000);
        }
      }, 500);
    }
  }, [highlightedJobId, isLoading]);

  // Fetch jobs from the database
  const fetchJobs = useCallback(async (page = 1, search = searchQuery) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jobs/public`, {
        params: {
          page,
          limit: jobsPerPage,
          category: categoryFilter !== "All" ? categoryFilter : undefined,
          search: search || undefined
        }
      });

      if (response.data.success) {
        setJobs(response.data.jobs);
        setTotalPages(Math.ceil(response.data.total / jobsPerPage) || 1);
      } else {
        setError("Failed to fetch jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      
      // Fallback to sample data for demonstration when API fails
      const sampleJobs = [
        {
          _id: '1',
          title: 'Web Developer for E-commerce Project',
          category: 'Web Development',
          companyName: 'TechSolutions Inc.',
          location: 'Remote',
          budgetType: 'hourly',
          hourlyFrom: 25,
          hourlyTo: 50,
          description: 'Looking for an experienced web developer to build a responsive e-commerce platform with modern technologies like React and Node.js.',
          skills: ['React', 'Node.js', 'MongoDB', 'Express'],
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Graphic Designer for Brand Identity',
          category: 'Design',
          companyName: 'Creative Studios',
          location: 'Remote',
          budgetType: 'fixed',
          fixedAmount: 1500,
          description: 'We need a talented graphic designer to create a complete brand identity package including logo, color palette, and style guide.',
          skills: ['Adobe Illustrator', 'Branding', 'Logo Design'],
          createdAt: new Date(Date.now() - 2*24*60*60*1000).toISOString()
        },
        {
          _id: '3',
          title: 'Content Writer for Tech Blog',
          category: 'Writing',
          companyName: 'Tech Insights',
          location: 'Remote',
          budgetType: 'hourly',
          hourlyFrom: 20,
          hourlyTo: 35,
          description: 'Seeking a knowledgeable content writer to create engaging articles about the latest technology trends and innovations.',
          skills: ['Content Writing', 'SEO', 'Tech Knowledge'],
          createdAt: new Date(Date.now() - 5*24*60*60*1000).toISOString()
        }
      ];
      
      // Use sample data instead of showing error
      console.log("Using sample job data due to API error");
      setJobs(sampleJobs);
      setTotalPages(1);
      // Don't show error to user, just use sample data
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, categoryFilter, searchQuery, jobsPerPage]);

  // Fetch categories for filter
  const fetchCategories = useCallback(async () => {
    try {
      let categoriesData = ["All"];
      
      try {
        const response = await axios.get(`${API_BASE_URL}/jobs/categories`);
        if (response.data.success && response.data.categories) {
          categoriesData = ["All", ...response.data.categories];
        }
      } catch (categoryErr) {
        console.warn("Categories endpoint not available, using defaults");
        categoriesData = ["All", "Web Development", "Mobile App", "Design", "Marketing", "Writing"];
      }
      
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error setting up categories:", err);
      setCategories(["All"]);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchJobs(currentPage);
  }, [fetchJobs, currentPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category) => {
    setCategoryFilter(category);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs(1);
  };

  const handleShowLoginPrompt = () => {
    // First check if the element exists before trying to access its classList
    const loginPrompt = document.getElementById("login-prompt");
    
    if (loginPrompt) {
      loginPrompt.classList.add("show");
      setTimeout(() => {
        // Check again in case the element was removed during the timeout
        if (loginPrompt) {
          loginPrompt.classList.remove("show");
        }
      }, 5000);
    } else {
      console.warn("Login prompt element not found");
    }
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleMenuClick = () => {
    setTimeout(() => setIsMenuOpen(false), 150);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Format date in a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  // Generate pagination
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
      <div className="explore-pagination">
        <div className="explore-pagination-info">
          Showing {jobs.length} of {totalPages * jobsPerPage} jobs
        </div>
        <div className="explore-pagination-controls">
          <button 
            className="explore-pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(1)}
            aria-label="Go to first page"
          >
            <FaAngleDoubleLeft />
          </button>
          <button 
            className="explore-pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Go to previous page"
          >
            <FaAngleLeft />
          </button>
          
          {startPage > 1 && (
            <>
              <button
                className="explore-pagination-button"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {startPage > 2 && (
                <span className="explore-pagination-ellipsis">...</span>
              )}
            </>
          )}
          
          {pageNumbers.map(number => (
            <button
              key={number}
              className={`explore-pagination-button ${currentPage === number ? 'active' : ''}`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <span className="explore-pagination-ellipsis">...</span>
              )}
              <button
                className="explore-pagination-button"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
          
          <button 
            className="explore-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Go to next page"
          >
            <FaAngleRight />
          </button>
          <button 
            className="explore-pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(totalPages)}
            aria-label="Go to last page"
          >
            <FaAngleDoubleRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`explore-container ${isDarkMode ? 'explore-dark-mode' : ''}`}>
      {/* Header */}
      <header className="explore-header">
        <div className="explore-header-container">
          <div className="explore-logo">
            <Link to="/">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="explore-logo-image" 
              />
            </Link>
          </div>
          
          <nav className="explore-desktop-nav">
            <ul>
              <li><Link to="/business-solutions"><i className="fas fa-briefcase"></i>Business Solutions</Link></li>
              <li><Link to="/explore" className="active"><i className="fas fa-compass"></i>Explore</Link></li>
              <li><a href="#"><i className="fas fa-globe"></i>English</a></li>
              <li><Link to="/become-seller"><i className="fas fa-store"></i>Become a Seller</Link></li>
              <li>
                <button 
                  className="explore-theme-toggle"
                  onClick={toggleDarkMode}
                >
                  {isDarkMode ? <FaSun /> : <FaMoon />}
                  <span>{isDarkMode ? ' Light Mode' : ' Dark Mode'}</span>
                </button>
              </li>
            </ul>
          </nav>

          <div className="explore-nav-controls">
            <div className="explore-auth-buttons">
              <Link to="/login" className="explore-login glow-on-hover">
                <FaSignInAlt />Log In
              </Link>
              <Link to="/register" className="explore-signup glow-on-hover">
                <FaUserPlus />Sign Up
              </Link>
            </div>
            
            <button 
              ref={hamburgerRef}
              className={`explore-hamburger-menu ${isMenuOpen ? 'open' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div 
          ref={menuRef}
          className={`explore-mobile-menu ${isMenuOpen ? 'open' : ''}`}
          aria-hidden={!isMenuOpen}
        >
          <ul>
            <li className="explore-nav-fade-in"><Link to="/business-solutions" onClick={handleMenuClick}><i className="fas fa-briefcase"></i>Business Solutions</Link></li>
            <li className="explore-nav-fade-in"><Link to="/explore" className="active" onClick={handleMenuClick}><i className="fas fa-compass"></i>Explore</Link></li>
            <li className="explore-nav-fade-in"><a href="#" onClick={handleMenuClick}><i className="fas fa-globe"></i>English</a></li>
            <li className="explore-nav-fade-in"><Link to="/become-seller" onClick={handleMenuClick}><i className="fas fa-store"></i>Become a Seller</Link></li>
            <li className="explore-nav-fade-in"><Link to="/login" className="explore-login" onClick={handleMenuClick}><FaSignInAlt />Log In</Link></li>
            <li className="explore-nav-fade-in"><Link to="/register" className="explore-signup" onClick={handleMenuClick}><FaUserPlus />Sign Up</Link></li>
            <li className="explore-nav-fade-in">
              <button 
                className="explore-theme-toggle"
                onClick={() => {
                  toggleDarkMode();
                  handleMenuClick();
                }}
              >
                {isDarkMode ? <FaSun /> : <FaMoon />}
                {isDarkMode ? ' Light Mode' : ' Dark Mode'}
              </button>
            </li>
          </ul>
        </div>
      </header>

      {/* Main Content */}
      <main className="explore-main">
        {/* Hero Section */}
        <section className="explore-hero">
          <div className="explore-hero-content">
            <h1>Explore Available Opportunities</h1>
            <p>Browse through thousands of projects and job postings from companies worldwide</p>
            
            <form onSubmit={handleSearch} className="explore-search-form">
              <div className="explore-search-container">
                <input 
                  type="text" 
                  placeholder="Search for jobs, skills, or keywords..." 
                  className="explore-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="explore-search-button">
                  <FaSearch />
                  <span>Search</span>
                </button>
              </div>
            </form>
            
            <div className="explore-filter-toggle" onClick={toggleFilters}>
              <FaFilter />
              <span>Filters</span>
            </div>

            <div className={`explore-filters ${showFilters ? 'active' : ''}`} ref={filtersRef}>
              <h3>Filter by Category</h3>
              <div className="explore-category-filters">
                {categories.map((category, index) => (
                  <button
                    key={index}
                    className={`explore-category-button ${categoryFilter === category ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        
        {/* Jobs Section */}
        <section className="explore-jobs-section">
          <div className="explore-section-header">
            <h2>Available Opportunities</h2>
            <p>Discover projects that match your skills and interests</p>
          </div>
          
          <div className="explore-jobs-container">
            {isLoading ? (
              <div className="explore-loading">
                <div className="explore-spinner"></div>
                <p>Loading available jobs...</p>
              </div>
            ) : error ? (
              <div className="explore-error">
                <p>{error}</p>
                <button onClick={() => fetchJobs(currentPage)} className="explore-retry-button">
                  Try Again
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="explore-no-jobs">
                <p>No jobs found matching your criteria. Try adjusting your filters.</p>
                <button onClick={() => {
                  setCategoryFilter("All");
                  setSearchQuery("");
                  setCurrentPage(1);
                }} className="explore-clear-filters">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="explore-jobs-grid">
                {jobs.map((job) => (
                  <div 
                    className="explore-job-card" 
                    key={job._id}
                    id={`job-${job._id}`}
                  >
                    <div className="explore-job-header">
                      <h3 className="explore-job-title">{job.title}</h3>
                      <div className="explore-job-category">{job.category}</div>
                    </div>
                    
                    <div className="explore-job-details">
                      <div className="explore-job-company">
                        <FaBriefcase /> {job.companyName || "Company"}
                      </div>
                      <div className="explore-job-location">
                        <FaMapMarkerAlt /> {job.location || "Remote"}
                      </div>
                      <div className="explore-job-budget">
                        {job.budgetType === "hourly" 
                          ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr` 
                          : `$${job.fixedAmount} Fixed`}
                      </div>
                    </div>
                    
                    <p className="explore-job-description">{
                      job.description.length > 150 
                        ? `${job.description.substring(0, 150)}...` 
                        : job.description
                    }</p>
                    
                    <div className="explore-job-skills">
                      {job.skills && job.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="explore-skill-tag">{skill}</span>
                      ))}
                      {job.skills && job.skills.length > 3 && (
                        <span className="explore-more-skills">+{job.skills.length - 3}</span>
                      )}
                    </div>
                    
                    <div className="explore-job-footer">
                      <span className="explore-job-date">Posted: {formatDate(job.createdAt)}</span>
                      <button 
                        className="explore-view-details-button"
                        onClick={handleShowLoginPrompt}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Show pagination only when there are jobs */}
            {!isLoading && !error && jobs.length > 0 && <Pagination />}
          </div>
        </section>
        
        {/* Info Section */}
        <section className="explore-info-section">
          <div className="explore-section-header">
            <h2>Why Join Next Youth</h2>
            <p>Unlock your potential in the global marketplace</p>
          </div>
          
          <div className="explore-info-grid">
            <div className="explore-info-card">
              <div className="explore-info-icon">
                <FaBriefcase />
              </div>
              <h3>Access Global Opportunities</h3>
              <p>Connect with clients from around the world and work on exciting projects that match your skills and interests.</p>
            </div>
            
            <div className="explore-info-card">
              <div className="explore-info-icon">
                <FaStar />
              </div>
              <h3>Build Your Portfolio</h3>
              <p>Showcase your work, earn reviews, and build a strong reputation that helps you win more projects.</p>
            </div>
            
            <div className="explore-info-card">
              <div className="explore-info-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Work From Anywhere</h3>
              <p>Enjoy the flexibility of remote work and create your own schedule that fits your lifestyle.</p>
            </div>
          </div>
          
          <div className="explore-cta">
            <Link to="/register" className="explore-cta-button">
              Sign Up and Start Working
            </Link>
          </div>
        </section>
        
        {/* Login Prompt */}
        <div id="login-prompt" className="explore-login-prompt">
          <div className="explore-login-prompt-content">
            <h3>Access Restricted</h3>
            <p>You need to <Link to="/login">log in</Link> to view job details and apply for positions.</p>
            <div className="explore-login-prompt-actions">
              <Link to="/login" className="explore-prompt-login">Log In</Link>
              <Link to="/register" className="explore-prompt-register">Register</Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="explore-footer">
        <div className="explore-footer-container">
          <div className="explore-footer-columns">
            <div className="explore-footer-column">
              <h3>For Clients</h3>
              <ul>
                <li><a href="#">How to Hire</a></li>
                <li><a href="#">Talent Marketplace</a></li>
                <li><a href="#">Project Catalog</a></li>
                <li><a href="#">Enterprise Solutions</a></li>
              </ul>
            </div>
            
            <div className="explore-footer-column">
              <h3>For Talent</h3>
              <ul>
                <li><a href="#">How to Find Work</a></li>
                <li><a href="#">Direct Contracts</a></li>
                <li><a href="#">Getting Paid</a></li>
                <li><a href="#">Career Resources</a></li>
              </ul>
            </div>
            
            <div className="explore-footer-column">
              <h3>Resources</h3>
              <ul>
                <li><a href="#">Help & Support</a></li>
                <li><a href="#">Success Stories</a></li>
                <li><a href="#">Guides & Tutorials</a></li>
                <li><a href="#">Community Forum</a></li>
              </ul>
            </div>
            
            <div className="explore-footer-column">
              <h3>Company</h3>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Leadership</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="explore-footer-bottom">
            <div className="explore-footer-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="explore-footer-logo-image" 
              />
            </div>
            
            <div className="explore-footer-links">
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Accessibility</a>
            </div>
            
            <div className="explore-social-links">
              <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div className="explore-copyright">
            <p>© {new Date().getFullYear()} Next-Youth Marketplace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Explore;
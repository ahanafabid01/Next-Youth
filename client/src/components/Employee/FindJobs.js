import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaRegFileAlt, FaSpinner, FaExclamationCircle, FaClock, FaCheckCircle, FaRegBookmark,
         FaBookmark, FaSearch, FaChevronDown, FaArrowLeft, FaSun, FaMoon, FaUserCircle, 
         FaBell, FaHome, FaQuestionCircle, FaBriefcase, FaLinkedinIn, FaGlobe, 
         FaFacebook, FaTwitter, FaInstagram, FaTrash, FaStar } from 'react-icons/fa';
import './FindJobs.css';
import './EmployeeDashboard.css'; // Import the EmployeeDashboard styles
import RatingModal from '../Connections/RatingModal';

const FindJobs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { jobId, view } = useParams(); // Get view parameter from URL
    const [activeTab, setActiveTab] = useState('available');
    const [jobs, setJobs] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [appliedJobs, setAppliedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const [filters, setFilters] = useState({
        skills: [],
        budgetType: '',
        budgetMin: '',
        budgetMax: '',
        otherSkillsEnabled: false,
        otherSkills: ''
    });
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [currentJob, setCurrentJob] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
    const filtersDropdownRef = useRef(null);
    const [showRatingModal, setShowRatingModal] = useState(false);

    // Header and footer state variables
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileNav, setShowMobileNav] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("dashboard-theme") === "dark";
    });
    const [user, setUser] = useState({ 
        name: '', 
        profilePicture: '',
        isVerified: false 
    });
    const [unreadNotifications, setUnreadNotifications] = useState(() => {
        return parseInt(localStorage.getItem("unread-notifications") || "2");
    });
    const profileDropdownRef = useRef(null);
    const notificationsRef = useRef(null);

    const API_BASE_URL = 'http://localhost:4000/api';

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target)) {
                setShowFiltersDropdown(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    // Apply dark mode
    useEffect(() => {
        document.body.classList.toggle('dark-mode', isDarkMode);
        localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    // Fetch user data for header
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

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    useEffect(() => {
        localStorage.setItem("unread-notifications", unreadNotifications.toString());
    }, [unreadNotifications]);

    // Header functions
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

    const handleMarkAllAsRead = useCallback((e) => {
        e.stopPropagation();
        setUnreadNotifications(0);
        localStorage.setItem("unread-notifications", "0");
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { 
                withCredentials: true 
            });
            if (response.data.success) navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }, [navigate, API_BASE_URL]);

    // Handle URL params and navigation
    useEffect(() => {
        setLoading(true);
        
        if (jobId) {
            setViewMode('detail');
            fetchJobDetails(jobId);
        } else {
            setViewMode('list');
            
            if (location.pathname.includes('/find-jobs/saved')) {
                setActiveTab('saved');
            } else if (location.pathname.includes('/find-jobs/proposals')) {
                setActiveTab('proposals');
            } else {
                setActiveTab('available');
            }
        }
    }, [jobId, location.pathname]);

    // Fetch job details for a specific job
    const fetchJobDetails = async (id) => {
        setLoading(true);
        try {
            const availableResponse = await axios.get(`${API_BASE_URL}/jobs/available`, { 
                withCredentials: true 
            });
            
            if (availableResponse.data.success) {
                const job = availableResponse.data.jobs.find(j => j._id === id);
                if (job) {
                    const savedResponse = await axios.get(`${API_BASE_URL}/jobs/saved`, { 
                        withCredentials: true 
                    });
                    
                    if (savedResponse.data.success) {
                        const savedJobIds = savedResponse.data.jobs.map(j => j._id);
                        job.isSaved = savedJobIds.includes(id);
                    }
                    
                    const appliedResponse = await axios.get(`${API_BASE_URL}/jobs/applied`, { 
                        withCredentials: true 
                    });
                    
                    if (appliedResponse.data.success) {
                        const appliedJobIds = appliedResponse.data.jobs.map(j => j._id);
                        job.hasApplied = appliedJobIds.includes(id);
                    }
                    
                    setCurrentJob(job);
                    setLoading(false);
                    return;
                }
            }
            
            const savedResponse = await axios.get(`${API_BASE_URL}/jobs/saved`, { 
                withCredentials: true 
            });
            
            if (savedResponse.data.success) {
                const job = savedResponse.data.jobs.find(j => j._id === id);
                if (job) {
                    job.isSaved = true;
                    
                    const appliedResponse = await axios.get(`${API_BASE_URL}/jobs/applied`, { 
                        withCredentials: true 
                    });
                    
                    if (appliedResponse.data.success) {
                        const appliedJobIds = appliedResponse.data.jobs.map(j => j._id);
                        job.hasApplied = appliedJobIds.includes(id);
                    }
                    
                    setCurrentJob(job);
                    setLoading(false);
                    return;
                }
            }
            
            const appliedResponse = await axios.get(`${API_BASE_URL}/jobs/applied`, { 
                withCredentials: true 
            });
            
            if (appliedResponse.data.success) {
                const job = appliedResponse.data.jobs.find(j => j._id === id);
                if (job) {
                    job.hasApplied = true;
                    
                    const savedJobIds = savedResponse.data.success 
                        ? savedResponse.data.jobs.map(j => j._id)
                        : [];
                    job.isSaved = savedJobIds.includes(id);
                    
                    setCurrentJob(job);
                    setLoading(false);
                    return;
                }
            }
            
            setError("Job not found");
            setLoading(false);
        } catch (err) {
            console.error("Error fetching job details:", err);
            setError("An error occurred while fetching job details");
            setLoading(false);
        }
    };

    // Fetch available jobs from server
    const fetchAvailableJobs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/jobs/available`, { 
                withCredentials: true 
            });
            
            const appliedResponse = await axios.get(`${API_BASE_URL}/jobs/applied`, {
                withCredentials: true
            });
            
            const appliedJobIds = appliedResponse.data.success 
                ? appliedResponse.data.jobs.map(job => job._id) 
                : [];
            
            const savedResponse = await axios.get(`${API_BASE_URL}/jobs/saved`, {
                withCredentials: true
            });
            
            const savedJobIds = savedResponse.data.success 
                ? savedResponse.data.jobs.map(job => job._id) 
                : [];
                
            const updatedJobs = response.data.jobs.map(job => ({
                ...job,
                hasApplied: appliedJobIds.includes(job._id),
                isSaved: savedJobIds.includes(job._id)
            }));
            
            setJobs(updatedJobs);
            if (!response.data.success) {
                setError("Failed to fetch available jobs.");
            }
        } catch (err) {
            console.error("Error fetching jobs:", err);
            setError("An error occurred while fetching available jobs.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch saved jobs
    const fetchSavedJobs = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/jobs/saved`, { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                const appliedResponse = await axios.get(`${API_BASE_URL}/jobs/applied`, {
                    withCredentials: true
                });
                
                const appliedJobIds = appliedResponse.data.success 
                    ? appliedResponse.data.jobs.map(job => job._id) 
                    : [];
                    
                const updatedJobs = response.data.jobs.map(job => ({
                    ...job,
                    hasApplied: appliedJobIds.includes(job._id),
                    isSaved: true
                }));
                
                setSavedJobs(updatedJobs);
            } else {
                setError("Failed to fetch saved jobs.");
            }
        } catch (err) {
            console.error("Error fetching saved jobs:", err);
            setError("An error occurred while fetching saved jobs.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
            const applicationsResponse = await axios.get(`${API_BASE_URL}/jobs/applications`, { 
                withCredentials: true 
            });
            
            if (applicationsResponse.data.success) {
                const jobsWithApplicationIds = applicationsResponse.data.applications.map(app => ({
                    ...app.job,
                    applicationId: app._id,
                    applicationStatus: app.status,
                    hasApplied: true
                }));
                setAppliedJobs(jobsWithApplicationIds);
            } else {
                setError("Failed to fetch your job applications.");
            }
        } catch (err) {
            console.error("Error fetching job applications:", err);
            setError(err.response?.data?.message || "An error occurred while fetching your job applications.");
        } finally {
            setLoading(false);
        }
    };

    // Toggle job save status
    const toggleSaveJob = async (jobId, isSaved) => {
        try {
            if (isSaved) {
                await axios.post(`${API_BASE_URL}/jobs/${jobId}/save/remove`, {}, { 
                    withCredentials: true 
                });
                
                setSavedJobs(savedJobs.filter(job => job._id !== jobId));
                
                if (activeTab === 'available') {
                    setJobs(jobs.map(job => 
                        job._id === jobId ? { ...job, isSaved: false } : job
                    ));
                }
                
                if (viewMode === 'detail' && currentJob && currentJob._id === jobId) {
                    setCurrentJob({...currentJob, isSaved: false});
                }
            } else {
                await axios.post(`${API_BASE_URL}/jobs/${jobId}/save`, {}, { 
                    withCredentials: true 
                });
                
                if (activeTab === 'available') {
                    setJobs(jobs.map(job => 
                        job._id === jobId ? { ...job, isSaved: true } : job
                    ));
                }
                
                if (activeTab === 'saved') {
                    fetchSavedJobs();
                }
                
                if (viewMode === 'detail' && currentJob && currentJob._id === jobId) {
                    setCurrentJob({...currentJob, isSaved: true});
                }
            }
        } catch (err) {
            console.error("Error toggling job saved status:", err);
            alert("There was an error updating your saved jobs.");
        }
    };

    // Apply for a job
    const applyToJob = async (jobId) => {
        try {
            await axios.post(`${API_BASE_URL}/jobs/${jobId}/apply`, {}, { 
                withCredentials: true 
            });
            alert("Your application has been submitted successfully!");
            
            if (activeTab === 'available') {
                await fetchAvailableJobs();
            } else if (activeTab === 'saved') {
                await fetchSavedJobs();
            }
            
            await fetchAppliedJobs();
            
            if (viewMode === 'detail' && currentJob && currentJob._id === jobId) {
                setCurrentJob({...currentJob, hasApplied: true});
            }
        } catch (err) {
            console.error("Error applying to job:", err);
            alert("There was an error submitting your application.");
        }
    };

    // Toggle dropdown menu
    const toggleDropdown = (e) => {
        e.stopPropagation();
        setShowDropdown(!showDropdown);
    };

    const toggleFiltersDropdown = (e) => {
        e.stopPropagation();
        setShowFiltersDropdown(!showFiltersDropdown);
    };

    const handleTabSelection = (tab) => {
        if (tab === 'available') {
            navigate('/find-jobs');
        } else if (tab === 'saved') {
            navigate('/find-jobs/saved');
        } else if (tab === 'proposals') {
            navigate('/find-jobs/proposals');
        }
        setShowDropdown(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const performSearch = () => {
        setFilteredJobs(getFilteredJobs());
    };

    useEffect(() => {
        if (viewMode === 'detail') return;
        
        setSearchTerm('');
        
        if (activeTab === 'available') {
            fetchAvailableJobs().then(() => {
                setFilteredJobs(getFilteredJobs());
            });
        } else if (activeTab === 'saved') {
            fetchSavedJobs().then(() => {
                setFilteredJobs(getFilteredJobs());
            });
        } else if (activeTab === 'proposals') {
            fetchAppliedJobs().then(() => {
                setFilteredJobs(getFilteredJobs());
            });
        }
    }, [activeTab, viewMode]);

    const getPageTitle = () => {
        switch(activeTab) {
            case 'available': return 'Find Work';
            case 'saved': return 'Saved Jobs';
            case 'proposals': return 'My Proposals';
            default: return 'Jobs';
        }
    };
    
    const getCurrentTabName = () => {
        switch(activeTab) {
            case 'available': return 'Find Work';
            case 'saved': return 'Saved Jobs';
            case 'proposals': return 'My Proposals';
            default: return 'Jobs';
        }
    };

    const getFilteredJobs = () => {
        let filteredJobs = [];
        
        if (activeTab === 'available') {
            filteredJobs = jobs.filter(job => !job.hasApplied);
        } else if (activeTab === 'saved') {
            filteredJobs = savedJobs.filter(job => !job.hasApplied);
        } else if (activeTab === 'proposals') {
            filteredJobs = [...appliedJobs];
        }
        
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase().trim();
            filteredJobs = filteredJobs.filter(job => {
                const jobTitle = job.title.toLowerCase();
                return jobTitle.includes(term);
            });
        }
        
        if (filters.skills.length > 0 || (filters.otherSkillsEnabled && filters.otherSkills.trim())) {
            filteredJobs = filteredJobs.filter(job => {
                if (filters.skills.length > 0 && 
                    filters.skills.some(skill => job.skills.includes(skill))) {
                    return true;
                }
                
                if (filters.otherSkillsEnabled && filters.otherSkills.trim()) {
                    const otherSkillsList = filters.otherSkills
                        .split(',')
                        .map(skill => skill.trim().toLowerCase())
                        .filter(skill => skill.length > 0);
                    
                    return job.skills.some(jobSkill => 
                        otherSkillsList.some(otherSkill => 
                            jobSkill.toLowerCase().includes(otherSkill)
                        )
                    );
                }
                
                return filters.skills.length === 0 && 
                       (!filters.otherSkillsEnabled || !filters.otherSkills.trim());
            });
        }
        
        if (filters.skills.length > 0) {
            filteredJobs = filteredJobs.filter(job => 
                filters.skills.some(skill => job.skills.includes(skill))
            );
        }
        
        if (filters.scope) {
            filteredJobs = filteredJobs.filter(job => job.scope === filters.scope);
        }
        
        if (filters.budgetType) {
            filteredJobs = filteredJobs.filter(job => job.budgetType === filters.budgetType);
            
            if (filters.budgetType === 'hourly' && (filters.budgetMin || filters.budgetMax)) {
                filteredJobs = filteredJobs.filter(job => {
                    if (filters.budgetMin && parseInt(job.hourlyFrom) < parseInt(filters.budgetMin)) {
                        return false;
                    }
                    if (filters.budgetMax && parseInt(job.hourlyTo) > parseInt(filters.budgetMax)) {
                        return false;
                    }
                    return true;
                });
            } else if (filters.budgetType === 'fixed' && (filters.budgetMin || filters.budgetMax)) {
                filteredJobs = filteredJobs.filter(job => {
                    if (filters.budgetMin && parseInt(job.fixedAmount) < parseInt(filters.budgetMin)) {
                        return false;
                    }
                    if (filters.budgetMax && parseInt(job.fixedAmount) > parseInt(filters.budgetMax)) {
                        return false;
                    }
                    return true;
                });
            }
        }
        
        return filteredJobs;
    };

    useEffect(() => {
        if (viewMode === 'list') {
            setFilteredJobs(getFilteredJobs());
        }
    }, [jobs, savedJobs, appliedJobs, activeTab, searchTerm, filters, viewMode]);

    const handleViewApplication = async (jobId) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${API_BASE_URL}/jobs/job-application/${jobId}`,
                { withCredentials: true }
            );
            
            if (response.data.success && response.data.application) {
                navigate(`/view-application/${response.data.application._id}`);
            } else {
                setError("No application found for this job");
            }
        } catch (err) {
            console.error("Error finding application:", err);
            setError(err.response?.data?.message || "Error finding your application");
        } finally {
            setLoading(false);
        }
    };

    const renderJobDetail = () => {
        if (!currentJob) return null;
        
        return (
            <div className="job-detail-view">
                <div className="job-detail-header">
                    <button 
                        className="back-button" 
                        onClick={() => navigate('/find-jobs')}
                    >
                        <FaArrowLeft /> Back to Jobs
                    </button>
                    <h1>{currentJob.title}</h1>
                </div>
                
                <div className="job-detail-card">
                    <div className="job-meta">
                        <div className="meta-item">
                            <span className="label">Budget:</span>
                            <span className="value budget">
                                {currentJob.budgetType === "hourly"
                                    ? `$${currentJob.hourlyFrom} - $${currentJob.hourlyTo}/hr`
                                    : `$${currentJob.fixedAmount} Fixed`}
                            </span>
                        </div>
                        <div className="meta-item">
                            <span className="label">Scope:</span>
                            <span className="value">{currentJob.scope}</span>
                        </div>
                        <div className="meta-item">
                            <span className="label">Posted:</span>
                            <span className="value">
                                {new Date(currentJob.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div className="job-description-full">
                        <h2>Description</h2>
                        <p>{currentJob.description}</p>
                    </div>
                    <div className="job-skills-section">
                        <h2>Skills Required</h2>
                        <div className="skills-detail">
                            {currentJob.skills?.map((skill, index) => (
                                <span key={index} className="skill-tag">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {currentJob.files?.length > 0 && (
                        <div className="job-attachments-section">
                            <h2>Attachments</h2>
                            <div className="attachments">
                                {currentJob.files.map((file, index) => (
                                    <a 
                                        key={index}
                                        href={file.path} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="file-link"
                                    >
                                        <FaRegFileAlt />
                                        {file.filename}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="job-detail-actions">
                        {currentJob.hasApplied ? (
                            <div className="already-applied">
                                <FaCheckCircle />
                                <span>You've already applied to this job</span>
                            </div>
                        ) : (
                            <button 
                                className="apply-button" 
                                onClick={() => navigate(`/jobs/apply/${currentJob._id}`)}
                            >
                                Apply Now
                            </button>
                        )}
                        <button 
                            className={`save-button-detail ${currentJob.isSaved ? 'saved' : ''}`}
                            onClick={() => toggleSaveJob(currentJob._id, currentJob.isSaved)}
                        >
                            {currentJob.isSaved ? (
                                <>
                                    <FaBookmark />
                                    <span>Saved</span>
                                </>
                            ) : (
                                <>
                                    <FaRegBookmark />
                                    <span>Save Job</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading">
                <FaSpinner className="spin" />
                Loading jobs...
            </div>
        );
    }
    if (error) {
        return (
            <div className="error">
                <FaExclamationCircle />
                {error}
            </div>
        );
    }

    return (
        <div className={`employee-dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
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
                                                Verify Account
                                            </button>
                                        )}
                                        
                                        <button 
                                            className="profile-dropdown-link"
                                            onClick={() => {
                                                setShowRatingModal(true);
                                                setShowProfileDropdown(false);
                                            }}
                                        >
                                            <FaStar /> My Ratings & Reviews
                                        </button>
                                        
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

            <div className="find-jobs-container">
                {viewMode === 'detail' ? (
                    renderJobDetail()
                ) : (
                    <>
                        <div className="search-filter-container">
                            <div className="search-bar">
                                <FaSearch className="search-icon" />
                                <input 
                                    type="text"
                                    placeholder="Search jobs..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    onKeyPress={(e) => e.key === 'Enter' && performSearch()}
                                />
                                <button 
                                    className="search-button"
                                    onClick={performSearch}
                                >
                                    Search
                                </button>
                            </div>

                            {(activeTab === 'available' || activeTab === 'saved') && (
                                <div className="additional-filters">
                                    <div className="filters-dropdown" ref={filtersDropdownRef}>
                                        <button 
                                            className="filters-dropdown-toggle"
                                            onClick={toggleFiltersDropdown}
                                        >
                                            Filters
                                            <FaChevronDown className={`dropdown-icon ${showFiltersDropdown ? 'rotate' : ''}`} />
                                        </button>
                                        {showFiltersDropdown && (
                                            <div className="filters-dropdown-menu">
                                                <div className="filter-section">
                                                    <h4>Budget Type</h4>
                                                    <div className="filter-options">
                                                        <label>
                                                            <input 
                                                                type="radio"
                                                                name="budgetType"
                                                                value="hourly"
                                                                checked={filters.budgetType === 'hourly'}
                                                                onChange={() => setFilters({...filters, budgetType: 'hourly'})}
                                                            />
                                                            Hourly
                                                        </label>
                                                        <label>
                                                            <input 
                                                                type="radio"
                                                                name="budgetType"
                                                                value="fixed"
                                                                checked={filters.budgetType === 'fixed'}
                                                                onChange={() => setFilters({...filters, budgetType: 'fixed'})}
                                                            />
                                                            Fixed
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="filter-section">
                                                    <h4>Budget Range</h4>
                                                    <div className="budget-inputs">
                                                        <input 
                                                            type="number"
                                                            placeholder="Min $"
                                                            value={filters.budgetMin}
                                                            onChange={(e) => setFilters({...filters, budgetMin: e.target.value})}
                                                        />
                                                        <span>to</span>
                                                        <input 
                                                            type="number"
                                                            placeholder="Max $"
                                                            value={filters.budgetMax}
                                                            onChange={(e) => setFilters({...filters, budgetMax: e.target.value})}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="filter-section">
                                                    <h4>Skills</h4>
                                                    <div className="skills-filter">
                                                        <div className="skill-options">
                                                            {['JavaScript', 'React', 'Node.js', 'Python', 'Design'].map(skill => (
                                                                <label key={skill}>
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={filters.skills.includes(skill)}
                                                                        onChange={() => {
                                                                            if (filters.skills.includes(skill)) {
                                                                                setFilters({
                                                                                    ...filters, 
                                                                                    skills: filters.skills.filter(s => s !== skill)
                                                                                });
                                                                            } else {
                                                                                setFilters({
                                                                                    ...filters,
                                                                                    skills: [...filters.skills, skill]
                                                                                });
                                                                            }
                                                                        }}
                                                                    />
                                                                    {skill}
                                                                </label>
                                                            ))}
                                                            <label className="others-skill-option">
                                                                <input 
                                                                    type="checkbox"
                                                                    checked={filters.otherSkillsEnabled}
                                                                    onChange={() => {
                                                                        setFilters({
                                                                            ...filters, 
                                                                            otherSkillsEnabled: !filters.otherSkillsEnabled,
                                                                            otherSkills: filters.otherSkillsEnabled ? "" : filters.otherSkills
                                                                        });
                                                                    }}
                                                                />
                                                                Others
                                                            </label>
                                                            
                                                            {filters.otherSkillsEnabled && (
                                                                <div className="other-skills-input">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Enter skills (comma separated)"
                                                                        value={filters.otherSkills || ""}
                                                                        onChange={(e) => setFilters({...filters, otherSkills: e.target.value})}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="filter-actions">
                                                    <button 
                                                        className="apply-filters"
                                                        onClick={() => {
                                                            performSearch();
                                                            setShowFiltersDropdown(false);
                                                        }}
                                                    >
                                                        Apply Filters
                                                    </button>
                                                    <button 
                                                        className="clear-filters"
                                                        onClick={() => {
                                                            setFilters({
                                                                skills: [],
                                                                budgetType: '',
                                                                budgetMin: '',
                                                                budgetMax: '',
                                                                otherSkillsEnabled: false,
                                                                otherSkills: ''
                                                            });
                                                            setShowFiltersDropdown(false);
                                                            performSearch();
                                                        }}
                                                    >
                                                        Clear All
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {filteredJobs.length === 0 ? (
                            <div className="empty-state">
                                {activeTab === 'available' && (
                                    <>
                                        <img src="/empty-jobs.svg" alt="No jobs" />
                                        <p>No jobs matching your criteria</p>
                                    </>
                                )}
                                {activeTab === 'saved' && (
                                    <>
                                        <img src="/empty-saved.svg" alt="No saved jobs" />
                                        <p>You haven't saved any jobs yet</p>
                                    </>
                                )}
                                {activeTab === 'proposals' && (
                                    <>
                                        <img src="/empty-proposals.svg" alt="No applications" />
                                        <p>You haven't applied to any jobs yet</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="job-grid">
                                {filteredJobs.map((job) => (
                                    <div key={job._id} className="job-card">
                                        <div className="card-header">
                                            <h3>{job.title}</h3>
                                            
                                            {activeTab === 'proposals' && (
                                                <div className="application-status">
                                                    {job.applicationStatus === 'accepted' ? (
                                                        <FaCheckCircle />
                                                    ) : job.applicationStatus === 'rejected' ? (
                                                        <FaExclamationCircle />
                                                    ) : job.applicationStatus === 'withdrawn' ? (
                                                        <FaTrash />
                                                    ) : (
                                                        <FaClock />
                                                    )}
                                                    <span>
                                                        {job.applicationStatus ? 
                                                            job.applicationStatus.charAt(0).toUpperCase() + job.applicationStatus.slice(1) : 
                                                            'Pending Review'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="description">{job.description}</p>
                                            
                                        <div className="job-details">
                                            <div className="detail-item">
                                                <span>Skills:</span>
                                                <div className="skills">
                                                    {job.skills?.map((skill, index) => (
                                                        <span key={index} className="skill-tag">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span>Scope:</span>
                                                    <span className="highlight">{job.scope}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span>Budget:</span>
                                                    <span className="highlight">
                                                        {job.budgetType === "hourly"
                                                            ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
                                                            : `$${job.fixedAmount} Fixed`}
                                                    </span>
                                                </div>
                                            </div>
                                            {job.files?.length > 0 && (
                                                <div className="detail-item">
                                                    <span>Attachments:</span>
                                                    <div className="attachments">
                                                        {job.files.map((file, index) => (
                                                            <a 
                                                                key={index}
                                                                href={file.path} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="file-link"
                                                            >
                                                                <FaRegFileAlt />
                                                                {file.filename}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {activeTab === 'proposals' && (
                                            <div className="application-info">
                                                <p>Applied on: {new Date(job.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        )}

                                        <div className="job-actions">
                                            <button 
                                                className="view-details-button" 
                                                onClick={() => {
                                                    if (activeTab === 'proposals') {
                                                        navigate(`/view-application/${job.applicationId}`);
                                                    } else {
                                                        navigate(`/find-jobs/details/${job._id}`);
                                                    }
                                                }}
                                            >
                                                {activeTab === 'proposals' ? 'View Application' : 'View Details'}
                                            </button>

                                            {activeTab === 'available' && (
                                                job.isSaved ? (
                                                    <button 
                                                        className="save-button-inline saved"
                                                        onClick={() => toggleSaveJob(job._id, true)}
                                                    >
                                                        <FaBookmark />
                                                        <span>Saved</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="save-button-inline"
                                                        onClick={() => toggleSaveJob(job._id, false)}
                                                    >
                                                        <FaRegBookmark />
                                                        <span>Save</span>
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {showRatingModal && (
                <RatingModal
                    isOpen={true}
                    onClose={() => setShowRatingModal(false)}
                    viewOnly={true}
                />
            )}

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
                                <FaLinkedinIn />
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

export default FindJobs;
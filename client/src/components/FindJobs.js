import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaRegFileAlt, FaSpinner, FaExclamationCircle, FaClock, FaCheckCircle, FaRegBookmark,
         FaBookmark, FaSearch, FaChevronDown, FaArrowLeft } from 'react-icons/fa';
import './FindJobs.css';

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
        budgetMax: ''
    });
    const [filteredJobs, setFilteredJobs] = useState([]);
    const [currentJob, setCurrentJob] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [showFiltersDropdown, setShowFiltersDropdown] = useState(false);
    const filtersDropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (filtersDropdownRef.current && !filtersDropdownRef.current.contains(event.target)) {
                setShowFiltersDropdown(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    // Handle URL params and navigation
    useEffect(() => {
        // Reset loading state with each URL change
        setLoading(true);
        
        if (jobId) {
            setViewMode('detail');
            fetchJobDetails(jobId);
        } else {
            setViewMode('list');
            
            // Set the active tab based on the URL view parameter
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
            // First try to find it in the available jobs
            const availableResponse = await axios.get("http://localhost:4000/api/jobs/available", { 
                withCredentials: true 
            });
            
            if (availableResponse.data.success) {
                const job = availableResponse.data.jobs.find(j => j._id === id);
                if (job) {
                    // Check if job is saved
                    const savedResponse = await axios.get("http://localhost:4000/api/jobs/saved", { 
                        withCredentials: true 
                    });
                    
                    if (savedResponse.data.success) {
                        const savedJobIds = savedResponse.data.jobs.map(j => j._id);
                        job.isSaved = savedJobIds.includes(id);
                    }
                    
                    // Check if job is applied
                    const appliedResponse = await axios.get("http://localhost:4000/api/jobs/applied", { 
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
            
            // If not found, try saved jobs
            const savedResponse = await axios.get("http://localhost:4000/api/jobs/saved", { 
                withCredentials: true 
            });
            
            if (savedResponse.data.success) {
                const job = savedResponse.data.jobs.find(j => j._id === id);
                if (job) {
                    job.isSaved = true;
                    
                    // Check if job is applied
                    const appliedResponse = await axios.get("http://localhost:4000/api/jobs/applied", { 
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
            
            // Finally try applied jobs
            const appliedResponse = await axios.get("http://localhost:4000/api/jobs/applied", { 
                withCredentials: true 
            });
            
            if (appliedResponse.data.success) {
                const job = appliedResponse.data.jobs.find(j => j._id === id);
                if (job) {
                    job.hasApplied = true;
                    
                    // Check if job is saved
                    const savedJobIds = savedResponse.data.success 
                        ? savedResponse.data.jobs.map(j => j._id)
                        : [];
                    job.isSaved = savedJobIds.includes(id);
                    
                    setCurrentJob(job);
                    setLoading(false);
                    return;
                }
            }
            
            // If we get here, job wasn't found
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
            const response = await axios.get("http://localhost:4000/api/jobs/available", { 
                withCredentials: true 
            });
            
            // Fetch applied jobs list first to check if any jobs have been applied
            const appliedResponse = await axios.get("http://localhost:4000/api/jobs/applied", {
                withCredentials: true
            });
            
            // Get the IDs of all applied jobs
            const appliedJobIds = appliedResponse.data.success 
                ? appliedResponse.data.jobs.map(job => job._id) 
                : [];
            
            // Also get saved jobs to mark them properly
            const savedResponse = await axios.get("http://localhost:4000/api/jobs/saved", {
                withCredentials: true
            });
            
            // Get the IDs of all saved jobs
            const savedJobIds = savedResponse.data.success 
                ? savedResponse.data.jobs.map(job => job._id) 
                : [];
                
            // Mark jobs as applied and saved if they're in the respective lists
            const updatedJobs = response.data.jobs.map(job => ({
                ...job,
                hasApplied: appliedJobIds.includes(job._id),
                isSaved: savedJobIds.includes(job._id) // Add this to track saved status
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
            const response = await axios.get("http://localhost:4000/api/jobs/saved", { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                // Fetch applied jobs list first to check if any jobs have been applied
                const appliedResponse = await axios.get("http://localhost:4000/api/jobs/applied", {
                    withCredentials: true
                });
                
                // Get the IDs of all applied jobs
                const appliedJobIds = appliedResponse.data.success 
                    ? appliedResponse.data.jobs.map(job => job._id) 
                    : [];
                    
                // Mark jobs as applied if they're in the applied list
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

    // Fetch applied jobs
    const fetchAppliedJobs = async () => {
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:4000/api/jobs/applied", { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                setAppliedJobs(response.data.jobs);
            } else {
                setError("Failed to fetch your job applications.");
            }
        } catch (err) {
            console.error("Error fetching job applications:", err);
            setError("An error occurred while fetching your job applications.");
        } finally {
            setLoading(false);
        }
    };

    // Toggle job save status
    const toggleSaveJob = async (jobId, isSaved) => {
        try {
            if (isSaved) {
                // Unsave job - Fix: The endpoint should match the route defined in jobRoutes.js
                await axios.post(`http://localhost:4000/api/jobs/${jobId}/save/remove`, {}, { 
                    withCredentials: true 
                });
                
                setSavedJobs(savedJobs.filter(job => job._id !== jobId));
                
                // Update the jobs list if we're on the available tab
                if (activeTab === 'available') {
                    setJobs(jobs.map(job => 
                        job._id === jobId ? { ...job, isSaved: false } : job
                    ));
                }
                
                // Update current job if we're in detail view
                if (viewMode === 'detail' && currentJob && currentJob._id === jobId) {
                    setCurrentJob({...currentJob, isSaved: false});
                }
            } else {
                // Save job - Fix: The endpoint should match the route defined in jobRoutes.js
                await axios.post(`http://localhost:4000/api/jobs/${jobId}/save`, {}, { 
                    withCredentials: true 
                });
                
                // If viewing available jobs, mark this job as saved
                if (activeTab === 'available') {
                    setJobs(jobs.map(job => 
                        job._id === jobId ? { ...job, isSaved: true } : job
                    ));
                }
                
                // If on saved tab, might want to refresh the saved jobs list
                if (activeTab === 'saved') {
                    fetchSavedJobs();
                }
                
                // Update current job if we're in detail view
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
            // Fix: The endpoint should match the route defined in jobRoutes.js
            await axios.post(`http://localhost:4000/api/jobs/${jobId}/apply`, {}, { 
                withCredentials: true 
            });
            alert("Your application has been submitted successfully!");
            
            // Refresh the current tab and proposals tab
            if (activeTab === 'available') {
                await fetchAvailableJobs(); // Refresh available jobs
            } else if (activeTab === 'saved') {
                await fetchSavedJobs(); // Refresh saved jobs
            }
            
            // Also refresh applied jobs for the proposals tab
            await fetchAppliedJobs();
            
            // Update current job if we're in detail view
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

    // Add a toggle function for the filters dropdown
    const toggleFiltersDropdown = (e) => {
        e.stopPropagation();
        setShowFiltersDropdown(!showFiltersDropdown);
    };

    // Update handleTabSelection function to properly navigate
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

    // Update search handler
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Add function to handle search button click
    const performSearch = () => {
        // Force update of filtered jobs
        setFilteredJobs(getFilteredJobs());
    };

    // Load jobs based on active tab
    useEffect(() => {
        if (viewMode === 'detail') return; // Don't load tab data in detail view
        
        setSearchTerm('');
        
        if (activeTab === 'available') {
            fetchAvailableJobs().then(() => {
                // Update filtered jobs after fetching
                setFilteredJobs(getFilteredJobs());
            });
        } else if (activeTab === 'saved') {
            fetchSavedJobs().then(() => {
                // Update filtered jobs after fetching
                setFilteredJobs(getFilteredJobs());
            });
        } else if (activeTab === 'proposals') {
            fetchAppliedJobs().then(() => {
                // Update filtered jobs after fetching
                setFilteredJobs(getFilteredJobs());
            });
        }
    }, [activeTab, viewMode]);
    // Add this function right next to your getCurrentTabName function
    // Get page title based on active tab
    const getPageTitle = () => {
        switch(activeTab) {
            case 'available': return 'Find Work';
            case 'saved': return 'Saved Jobs';
            case 'proposals': return 'My Proposals';
            default: return 'Jobs';
        }
    };
    
    // Add this function before the getPageTitle function
    // Get the current tab name for dropdown display
    const getCurrentTabName = () => {
        switch(activeTab) {
            case 'available': return 'Find Work';
            case 'saved': return 'Saved Jobs';
            case 'proposals': return 'My Proposals';
            default: return 'Jobs';
        }
    };

    // Filter jobs based on search and filters
    const getFilteredJobs = () => {
        let filteredJobs = [];
        
        // Determine which job list to use based on active tab
        if (activeTab === 'available') {
            // Filter out jobs that have already been applied to
            filteredJobs = jobs.filter(job => !job.hasApplied);
        } else if (activeTab === 'saved') {
            // Filter out jobs that have already been applied to
            filteredJobs = savedJobs.filter(job => !job.hasApplied);
        } else if (activeTab === 'proposals') {
            filteredJobs = [...appliedJobs];
        }
        
        // Apply search term filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filteredJobs = filteredJobs.filter(job => {
                // Check if any letter in the search term matches the job title
                const jobTitle = job.title.toLowerCase();
                
                // Match if any letter from the search term is found in the title
                for (let i = 0; i < term.length; i++) {
                    if (jobTitle.includes(term[i])) {
                        return true;
                    }
                }
                
                // Also check full word matches in description and skills
                return job.description.toLowerCase().includes(term) || 
                      job.skills.some(skill => skill.toLowerCase().includes(term));
            });
        }
        
        // Apply additional filters (skills, scope, budget, etc.)
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
            
            // Additional budget range filtering
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
        // Update the filteredJobs state whenever searchTerm or filters change
        if (viewMode === 'list') {
            setFilteredJobs(getFilteredJobs());
        }
    }, [jobs, savedJobs, appliedJobs, activeTab, searchTerm, filters, viewMode]);

    // Job detail view rendering
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
                                onClick={() => applyToJob(currentJob._id)}
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

    // Loading and error handling
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

    // Render either job list or job detail based on viewMode
    return (
        <div className="find-jobs-container">
            {viewMode === 'detail' ? (
                renderJobDetail()
            ) : (
                <>
                    <div className="header">
                        <div className="page-title">
                            <h1>{getPageTitle()}</h1>
                        </div>
                        
                        <div className="job-nav-dropdown" ref={dropdownRef}>
                            <button 
                                className="dropdown-toggle"
                                onClick={toggleDropdown}
                            >
                                {getCurrentTabName()}
                                <FaChevronDown className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`} />
                            </button>
                            {showDropdown && (
                                <div className="job-dropdown-menu">
                                    <button 
                                        className={activeTab === 'available' ? 'active' : ''}
                                        onClick={() => navigate('/find-jobs')}
                                    >
                                        Find Work
                                    </button>
                                    <button 
                                        className={activeTab === 'saved' ? 'active' : ''}
                                        onClick={() => navigate('/find-jobs/saved')}
                                    >
                                        Saved Jobs
                                    </button>
                                    <button 
                                        className={activeTab === 'proposals' ? 'active' : ''}
                                        onClick={() => navigate('/find-jobs/proposals')}
                                    >
                                        My Proposals
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Back to Dashboard button */}
                        <button 
                            className="back-to-dashboard-button"
                            onClick={() => navigate('/employee-dashboard')}
                        >
                            Go Back to Dashboard
                        </button>
                    </div>

                    {/* Search and filter section - only show on available and saved tabs */}
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

                        {/* Additional filters - only show for available and saved tabs */}
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
                                            {/* Your filter options here */}
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

                                            {/* Add budget range inputs */}
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

                                            {/* Add skills filter */}
                                            <div className="filter-section">
                                                <h4>Skills</h4>
                                                <div className="skills-filter">
                                                    {/* A simple implementation - in a real app you'd have a more dynamic skills selector */}
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
                                                            budgetMax: ''
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

                    {/* Job listings */}
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
                                        
                                        {/* Show application status for proposals tab */}
                                        {activeTab === 'proposals' && (
                                            <div className="application-status">
                                                <FaClock />
                                                <span>Pending Review</span>
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

                                    {/* Application info for proposals tab */}
                                    {activeTab === 'proposals' && (
                                        <div className="application-info">
                                            <p>Applied on: {new Date(job.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    )}

                                    <div className="job-actions">
                                        <button 
                                            className="view-details-button" 
                                            onClick={() => navigate(`/find-jobs/details/${job._id}`)}
                                        >
                                            View Details
                                        </button>

                                        {/* Save button - only for available tab */}
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
    );
};

export default FindJobs;
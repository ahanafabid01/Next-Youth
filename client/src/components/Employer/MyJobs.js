import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useCallback, memo } from "react";
import axios from "axios";
import { 
  FaTrash, 
  FaRegFileAlt, 
  FaSpinner, 
  FaExclamationCircle, 
  FaBriefcase, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaClock, 
  FaChevronRight,
  FaChevronDown,
  FaPlus
} from "react-icons/fa";
import "./MyJobs.css";
import RatingModal from '../Connections/RatingModal';

// Memoized Job Card component for better performance
const JobCard = memo(({ 
  job, 
  expandedJobId, 
  toggleJobExpansion, 
  handleUpdateJobStatus, 
  handleDeleteJob, 
  updatingJobIds, 
  formatDate 
}) => {
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [applicantInfo, setApplicantInfo] = useState(null);

  // Add this function to fetch applicant info
  const fetchApplicantInfo = async (jobId) => {
    try {
      const response = await axios.get(
        `API_BASE_URL/jobs/job-application/${jobId}`,
        { withCredentials: true }
      );
      if (response.data.success && response.data.application) {
        setApplicantInfo(response.data.application.applicant);
      }
    } catch (err) {
      console.error("Error fetching applicant info:", err);
    }
  };

  // Modify the click handler for Completed status
  const handleComplete = async (e) => {
    e.stopPropagation();
    
    try {
      // First update the job status
      await handleUpdateJobStatus(job._id, "Completed", e);
      
      // Get the dropdown menu element
      const dropdownMenu = e.target.closest('.status-dropdown-menu');
      if (dropdownMenu) {
        dropdownMenu.classList.remove("show");
      }
      
      // Add a slight delay before showing the modal to ensure status update completes
      setTimeout(async () => {
        // Fetch applicant info and show rating modal
        await fetchApplicantInfo(job._id);
        setShowRatingModal(true);
      }, 100);
    } catch (error) {
      console.error("Error completing job:", error);
    }
  };

  // Helper function to format status class correctly
  const getStatusClass = (status) => {
    if (!status) return "status-available";
    
    // Ensure consistent status class formatting
    const formattedStatus = status.toLowerCase().replace(/\s+/g, "-");
    return `status-${formattedStatus}`;
  };

  return (
    <div 
      className={`job-card ${expandedJobId === job._id ? 'expanded' : ''}`}
      onClick={() => toggleJobExpansion(job._id)}
    >
      <div className="job-card-header">
        <div className="job-title-section">
          <h3 className="job-title">{job.title}</h3>
          <div className="status-dropdown">
            <button
              className={`status-button status-${job.status?.toLowerCase().replace(/\s+/g, "-") || "available"}`}
              onClick={(e) => {
                e.stopPropagation();
                e.currentTarget.nextElementSibling.classList.toggle("show");
              }}
              disabled={updatingJobIds.includes(job._id)}
              aria-label="Open status dropdown"
              type="button"
            >
              <span>{job.status || "Available"}</span>
              <span className="dropdown-arrow">▼</span>
              {updatingJobIds.includes(job._id) && (
                <FaSpinner className="status-spinner spin" aria-hidden="true" />
              )}
            </button>
            <div className="status-dropdown-menu">
              <div
                className="status-option status-available"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateJobStatus(job._id, "Available", e);
                  e.currentTarget.parentElement.classList.remove("show");
                }}
              >
                Available
              </div>
              <div
                className="status-option status-in-progress"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateJobStatus(job._id, "In Progress", e);
                  e.currentTarget.parentElement.classList.remove("show");
                }}
              >
                In Progress
              </div>
              <div
                className="status-option status-on-hold"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateJobStatus(job._id, "On Hold", e);
                  e.currentTarget.parentElement.classList.remove("show");
                }}
              >
                On Hold
              </div>
              <div
                className="status-option status-completed"
                onClick={handleComplete}
              >
                Completed
              </div>
            </div>
          </div>
        </div>
        <button 
          className="job-card-toggle-btn" 
          onClick={(e) => {
            e.stopPropagation();
            toggleJobExpansion(job._id);
          }}
          aria-label={expandedJobId === job._id ? "Collapse job details" : "Expand job details"}
          aria-expanded={expandedJobId === job._id}
        >
          {expandedJobId === job._id ? (
            <FaChevronDown className="toggle-icon" aria-hidden="true" />
          ) : (
            <FaChevronRight className="toggle-icon" aria-hidden="true" />
          )}
        </button>
      </div>
      
      <div className="job-meta">
        <div className="job-meta-item">
          <FaCalendarAlt aria-hidden="true" />
          <span>Posted: {formatDate(job.createdAt)}</span>
        </div>
        <div className="job-meta-item">
          <FaClock aria-hidden="true" />
          <span>{job.scope || "Not specified"}</span>
        </div>
        <div className="job-meta-item">
          <FaDollarSign aria-hidden="true" />
          <span>
            {job.budgetType === "hourly"
              ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
              : job.fixedAmount ? `$${job.fixedAmount} Fixed` : "Budget not specified"}
          </span>
        </div>
      </div>
      
      <div className="job-content">
        <p className="job-description">
          {job.description?.length > 150 && expandedJobId !== job._id
            ? `${job.description.substring(0, 150)}...`
            : job.description || "No description provided"}
        </p>
        
        {expandedJobId === job._id && (
          <div className="job-details-expanded">
            <div className="job-skills-section">
              <h4>Required Skills</h4>
              <div className="job-skills">
                {job.skills?.length > 0 ? job.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                )) : (
                  <span className="no-skills">No specific skills listed</span>
                )}
              </div>
            </div>
            
            {job.files?.length > 0 && (
              <div className="job-attachments-section">
                <h4>Attachments</h4>
                <div className="job-attachments">
                  {job.files.map((file, index) => (
                    <a 
                      key={index}
                      href={file.path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="attachment-link"
                      title={file.filename}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaRegFileAlt aria-hidden="true" />
                      <span className="filename">{file.filename}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="job-card-footer">
        <div className="status-control-wrapper">
          {/* Status controls are moved above to header section */}
        </div>
        
        <button 
          onClick={(e) => handleDeleteJob(job._id, e)}
          className="delete-button"
          disabled={updatingJobIds.includes(job._id)}
          aria-label={`Delete job: ${job.title}`}
        >
          <FaTrash aria-hidden="true" /> <span className="btn-text">Delete</span>
        </button>
      </div>

      {showRatingModal && applicantInfo && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setApplicantInfo(null);
          }}
          jobTitle={job.title}
          applicant={applicantInfo}
          jobId={job._id}
          onRatingSubmit={() => {
            setShowRatingModal(false);
            setApplicantInfo(null);
          }}
        />
      )}
    </div>
  );
});

const MyJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingJobIds, setUpdatingJobIds] = useState([]);
    const [expandedJobId, setExpandedJobId] = useState(null);
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    // Add this state
    const [paginationRange, setPaginationRange] = useState([]);

    // Add these with your other pagination calculations
    const indexOfLastJob = currentPage * itemsPerPage;
    const indexOfFirstJob = indexOfLastJob - itemsPerPage;

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/jobs`, { 
                    withCredentials: true 
                });
                if (response.data.success) {
                    // Sort jobs by creation date (newest first)
                    const sortedJobs = [...response.data.jobs].sort((a, b) => 
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    setJobs(sortedJobs);
                } else {
                    setError("Failed to fetch jobs.");
                }
            } catch (err) {
                console.error("Error fetching jobs:", err);
                setError("An error occurred while fetching jobs.");
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, []);

    // Calculate pagination values
    const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(jobs.length / itemsPerPage);

    // Add this effect to calculate pagination range with ellipsis
    useEffect(() => {
        const generatePaginationRange = () => {
            const range = [];
            const maxPagesVisible = 5; // Maximum number of page buttons to show
            
            if (totalPages <= maxPagesVisible) {
                // If there are fewer pages than the max visible, show all pages
                for (let i = 1; i <= totalPages; i++) {
                    range.push(i);
                }
            } else {
                // Always show the first page
                range.push(1);
                
                const leftSideOffset = Math.floor(maxPagesVisible / 2);
                const rightSideOffset = maxPagesVisible - leftSideOffset - 1;
                
                // Calculate start and end page
                let startPage = Math.max(2, currentPage - leftSideOffset);
                let endPage = Math.min(totalPages - 1, currentPage + rightSideOffset);
                
                // Adjust if the range is too small on either side
                if (startPage <= 2) {
                    endPage = Math.min(1 + maxPagesVisible - 1, totalPages - 1);
                }
                
                if (endPage >= totalPages - 1) {
                    startPage = Math.max(totalPages - maxPagesVisible + 1, 2);
                }
                
                // Add ellipsis on left side if needed
                if (startPage > 2) {
                    range.push('...');
                }
                
                // Add middle pages
                for (let i = startPage; i <= endPage; i++) {
                    range.push(i);
                }
                
                // Add ellipsis on right side if needed
                if (endPage < totalPages - 1) {
                    range.push('...');
                }
                
                // Always show the last page
                if (totalPages > 1) {
                    range.push(totalPages);
                }
            }
            
            setPaginationRange(range);
        };
        
        generatePaginationRange();
    }, [totalPages, currentPage]);

    // Change page
    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
            // Scroll to top of job listings
            window.scrollTo({
                top: document.querySelector('.myjobs-container').offsetTop - 20,
                behavior: 'smooth'
            });
        }
    };

    // Adjust items per page based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setItemsPerPage(4);
            } else if (window.innerWidth < 1200) {
                setItemsPerPage(6);
            } else {
                setItemsPerPage(8);
            }
        };

        // Initial setup
        handleResize();

        // Add event listener
        window.addEventListener('resize', handleResize);
        
        // Clean up
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset to first page when itemsPerPage changes
    useEffect(() => {
        setCurrentPage(1);
    }, [itemsPerPage]);

    const handleDeleteJob = useCallback(async (jobId, event) => {
        // Prevent event bubbling to parent elements
        event.stopPropagation();
        
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const response = await axios.delete(
                `API_BASE_URL/jobs/${jobId}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                setJobs(prev => prev.filter((job) => job._id !== jobId));
                console.log("Job deleted successfully!");
            } else {
                console.error("Failed to delete job:", response.data.message);
            }
        } catch (error) {
            console.error("Error deleting job:", error.response?.data || error.message);
        }
    }, []);

    const handleUpdateJobStatus = useCallback(async (jobId, newStatus, event) => {
        // Prevent event bubbling
        if (event) event.stopPropagation();
        
        // Prevent multiple updates for the same job
        if (updatingJobIds.includes(jobId)) return;
        
        // Get current job status
        const currentJob = jobs.find(job => job._id === jobId);
        if (currentJob && currentJob.status === newStatus) {
            // No need to update if status hasn't changed
            return;
        }
        
        try {
            // Mark this job as updating
            setUpdatingJobIds(prev => [...prev, jobId]);
            
            const response = await axios.put(
                `API_BASE_URL/jobs/${jobId}/status`,
                { status: newStatus },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                // Update the job in local state
                setJobs(prevJobs => 
                    prevJobs.map(job => 
                        job._id === jobId ? { ...job, status: newStatus } : job
                    )
                );
                console.log("Job status updated successfully!");
            } else {
                console.error("Failed to update status:", response.data.message);
            }
        } catch (error) {
            console.error("Error updating job status:", error);
            
            if (error.response?.status === 401) {
                console.error("Your session has expired. Please login again.");
                // Optionally redirect to login page
                // navigate('/login');
            }
        } finally {
            // Remove this job from updating list
            setUpdatingJobIds(prev => prev.filter(id => id !== jobId));
        }
    }, [jobs, updatingJobIds]);

    const toggleJobExpansion = useCallback((jobId) => {
        setExpandedJobId(prev => prev === jobId ? null : jobId);
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }, []);

    const navigateToPostJob = useCallback(() => {
        window.location.href = "/post-job";
    }, []);

    if (loading) {
        return (
            <div className="myjobs-container">
                <div className="myjobs-loading">
                    <div className="loading-spinner">
                        <FaSpinner className="spin" aria-hidden="true" />
                    </div>
                    <p>Loading your jobs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="myjobs-container">
                <div className="myjobs-error">
                    <FaExclamationCircle aria-hidden="true" />
                    <h3>Something went wrong</h3>
                    <p>{error}</p>
                    <button 
                        className="retry-button"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="myjobs-container">
            <div className="myjobs-header">
                <div className="myjobs-title-wrapper">
                    <h1 className="myjobs-title">My Posted Jobs</h1>
                    <div className="job-count-pill">{jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}</div>
                </div>
                
                <div className="myjobs-actions">
                    <button 
                        className="post-job-button" 
                        onClick={navigateToPostJob}
                        aria-label="Post a new job"
                    >
                        <FaPlus aria-hidden="true" /> Post New Job
                    </button>
                </div>
            </div>

            {jobs.length === 0 && !loading ? (
                <div className="myjobs-empty-state">
                    <div className="empty-icon">
                        <FaBriefcase aria-hidden="true" />
                    </div>
                    <h2>No Jobs Found</h2>
                    <p>You haven't posted any jobs yet. Create your first job posting to start finding talent.</p>
                    <button 
                        className="create-job-button"
                        onClick={navigateToPostJob}
                        aria-label="Create your first job posting"
                    >
                        Create Your First Job
                    </button>
                </div>
            ) : (
                <>
                    <div className="myjobs-grid" role="list" aria-label="Your posted jobs">
                        {currentJobs.map((job) => (
                            <JobCard
                                key={job._id}
                                job={job}
                                expandedJobId={expandedJobId}
                                toggleJobExpansion={toggleJobExpansion}
                                handleUpdateJobStatus={handleUpdateJobStatus}
                                handleDeleteJob={handleDeleteJob}
                                updatingJobIds={updatingJobIds}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <div className="pagination-info">
                                Showing {jobs.length > 0 ? indexOfFirstJob + 1 : 0} to {Math.min(indexOfLastJob, jobs.length)} of {jobs.length} jobs
                            </div>
                            
                            <div className="pagination-controls">
                                <button 
                                    className="pagination-button" 
                                    onClick={() => paginate(1)}
                                    disabled={currentPage === 1}
                                    title="First Page"
                                    aria-label="Go to first page"
                                >
                                    <span className="pagination-arrow">«</span>
                                </button>
                                <button 
                                    className="pagination-button" 
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    title="Previous Page"
                                    aria-label="Go to previous page"
                                >
                                    <span className="pagination-arrow">‹</span>
                                </button>
                                
                                {/* Dynamic page numbers with ellipsis */}
                                {paginationRange.map((page, index) => (
                                    page === '...' ? (
                                        <div key={`ellipsis-${index}`} className="pagination-ellipsis">...</div>
                                    ) : (
                                        <button
                                            key={index}
                                            onClick={() => paginate(page)}
                                            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                                            aria-label={`Page ${page}`}
                                            aria-current={currentPage === page}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                                
                                <button 
                                    className="pagination-button" 
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    title="Next Page"
                                    aria-label="Go to next page"
                                >
                                    <span className="pagination-arrow">›</span>
                                </button>
                                <button 
                                    className="pagination-button" 
                                    onClick={() => paginate(totalPages)}
                                    disabled={currentPage === totalPages}
                                    title="Last Page"
                                    aria-label="Go to last page"
                                >
                                    <span className="pagination-arrow">»</span>
                                </button>
                            </div>
                            
                            <div className="pagination-options">
                                <label htmlFor="jobs-per-page">Show</label>
                                <select
                                    id="jobs-per-page"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page when changing items per page
                                    }}
                                    aria-label="Select number of jobs per page"
                                >
                                    <option value="4">4</option>
                                    <option value="6">6</option>
                                    <option value="8">8</option>
                                    <option value="12">12</option>
                                </select>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyJobs;
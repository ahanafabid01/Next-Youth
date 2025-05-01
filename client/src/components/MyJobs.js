import React, { useState, useEffect, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateJobStatus(job._id, "Completed", e);
                  e.currentTarget.parentElement.classList.remove("show");
                }}
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
    </div>
  );
});

const MyJobs = ({ onPostJobClick }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingJobIds, setUpdatingJobIds] = useState([]);
    const [expandedJobId, setExpandedJobId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:4000/api/jobs", { 
                    withCredentials: true 
                });
                if (response.data.success) {
                    setJobs(response.data.jobs);
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

    const handleDeleteJob = useCallback(async (jobId, event) => {
        // Prevent event bubbling to parent elements
        event.stopPropagation();
        
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            const response = await axios.delete(
                `http://localhost:4000/api/jobs/${jobId}`,
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
                `http://localhost:4000/api/jobs/${jobId}/status`,
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
        if (onPostJobClick) {
            onPostJobClick();
        } else {
            // Fallback to direct navigation if not in dashboard context
            navigate('/post-job');
        }
    }, [onPostJobClick, navigate]);

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

            {jobs.length === 0 ? (
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
                <div className="myjobs-grid" role="list" aria-label="Your posted jobs">
                    {jobs.map((job) => (
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
            )}
        </div>
    );
};

export default MyJobs;
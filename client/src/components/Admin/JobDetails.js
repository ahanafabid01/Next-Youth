import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./AdminDashboard.css";
import "./JobDetails.css";
import axios from "axios";
import { 
    FaTrash, 
    FaRegFileAlt, 
    FaSearch, 
    FaFilter, 
    FaPaperPlane, 
    FaPlus, 
    FaAngleLeft, 
    FaAngleRight,
    FaExclamationTriangle,
    FaCalendarAlt,
    FaBuilding,
    FaBriefcase,
    FaDollarSign,
    FaChartLine,
    FaCheckCircle // Added missing import
} from "react-icons/fa";
import { notifyDataUpdate } from './Statistics';
import { dataStore } from '../../utils/eventEmitter';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

const JobDetails = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [jobsPerPage] = useState(6);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [darkMode, setDarkMode] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [emailData, setEmailData] = useState({
        subject: "",
        recipients: [],
        message: ""
    });
    const [sending, setSending] = useState(false);
    const [sendingSuccess, setSendingSuccess] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState({
        allUsers: false,
        verifiedUsers: false,
        matchingSkills: false
    });
    
    // Check for saved theme preference when component mounts
    useEffect(() => {
        const savedTheme = localStorage.getItem("adminTheme");
        if (savedTheme === "dark") {
            setDarkMode(true);
        }
        
        // Listen for theme changes from other components
        const handleStorageChange = () => {
            setDarkMode(localStorage.getItem("adminTheme") === "dark");
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleRecipientChange = (e) => {
        const { name, checked } = e.target;
        setSelectedRecipients({
            ...selectedRecipients,
            [name]: checked
        });
    };

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:4000/api/jobs/available", {
                withCredentials: true
            });

            if (response.data && response.data.success) {
                console.log("Jobs data received:", response.data.jobs);
                setJobs(response.data.jobs);
                
                // Store the data in our shared dataStore
                dataStore.setJobs(response.data.jobs);
            } else {
                throw new Error(response.data?.message || "Failed to fetch jobs");
            }
        } catch (err) {
            console.error("Error fetching jobs:", err);
            setError(`Failed to load jobs: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Format budget display based on budget type
    const formatBudget = (job) => {
        if (!job || !job.budgetType) return "N/A";
        
        if (job.budgetType === "hourly") {
            return `$${job.hourlyFrom || 0} - $${job.hourlyTo || 0}/hr`;
        } else if (job.budgetType === "fixed") {
            return `$${job.fixedAmount || 0} fixed`;
        }
        return "N/A";
    };

    // Format date to be more readable
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Calculate time ago for display
    const getTimeAgo = (dateString) => {
        if (!dateString) return "";
        
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffDay > 30) {
            const diffMonth = Math.floor(diffDay / 30);
            return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
        }
        if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        return 'just now';
    };

    // Truncate long text
    const truncateText = (text, maxLength = 100) => {
        if (!text) return "";
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    // Handle job deletion
    const handleDeleteJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;
        
        try {
            setLoading(true);
            const response = await axios.delete(`http://localhost:4000/api/jobs/${jobId}`, { 
                withCredentials: true 
            });
            
            if (response.data.success) {
                setJobs(jobs.filter(job => job._id !== jobId));
                
                // Notify the Statistics component that data has changed
                notifyDataUpdate('jobs');
                
                alert("Job deleted successfully");
            } else {
                alert(response.data.message || "Failed to delete job");
            }
        } catch (err) {
            console.error("Error deleting job:", err);
            
            if (err.response?.status === 403) {
                alert("You don't have permission to delete this job. Admin access required.");
            } else if (err.response?.status === 404) {
                alert("Job not found. It may have been already deleted.");
            } else {
                alert(`Error: ${err.response?.data?.message || err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Open email modal with job information
    const openEmailModal = (job) => {
        setSelectedJob(job);
        
        // Pre-populate email template
        setEmailData({
            subject: `New Job Opportunity: ${job.title}`,
            recipients: [],
            message: `
Dear [Recipient],

We're excited to share a new job opportunity that might interest you:

Job Title: ${job.title}
Company: ${job.company || 'Our Client'}
Budget: ${formatBudget(job)}
Scope: ${job.scope || 'Not specified'}

Job Description:
${job.description || 'Please contact us for more details.'}

To apply or learn more about this opportunity, please visit our job board or contact us directly.

Best regards,
NextYouth Team
            `
        });
        
        setShowEmailModal(true);
    };

    // Handle sending email - Fixed function with proper error handling
    const handleSendEmail = async (e) => {
        e.preventDefault();
        
        // Validate recipient selection
        if (!selectedRecipients.allUsers && 
            !selectedRecipients.verifiedUsers && 
            !selectedRecipients.matchingSkills) {
            alert("Please select at least one recipient group");
            return;
        }
        
        try {
            setSending(true);
            setError(null); // Reset any previous errors
            
            const response = await axios.post(
                "http://localhost:4000/api/notifications/job-notification", 
                {
                    jobId: selectedJob._id,
                    subject: emailData.subject,
                    message: emailData.message,
                    recipients: {
                        allUsers: selectedRecipients.allUsers,
                        verifiedUsers: selectedRecipients.verifiedUsers,
                        matchingSkills: selectedRecipients.matchingSkills
                    }
                },
                { withCredentials: true }
            );
            
            if (response.data.success) {
                setSendingSuccess(true);
                
                // Reset the form after 2 seconds and close the modal
                setTimeout(() => {
                    setSendingSuccess(false);
                    setShowEmailModal(false);
                    setSelectedRecipients({
                        allUsers: false,
                        verifiedUsers: false,
                        matchingSkills: false
                    });
                }, 2000);
            } else {
                throw new Error(response.data.message || "Failed to send notifications");
            }
        } catch (err) {
            console.error("Error sending notifications:", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setSending(false);
        }
    };

    // Filter and search jobs
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (job.description && job.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (filterStatus === "all") return matchesSearch;
        return matchesSearch && job.status.toLowerCase() === filterStatus.toLowerCase();
    });
    
    // Pagination logic
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    if (loading && jobs.length === 0) {
        return (
            <div className={`job-details-dashboard ${darkMode ? 'job-details-dark-mode' : ''}`}>
                <Sidebar />
                <div className="job-details-main">
                    <div className="job-details-loading">
                        <div className="job-details-spinner"></div>
                        <p>Loading jobs data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`job-details-dashboard ${darkMode ? 'job-details-dark-mode' : ''}`}>
            <Sidebar />
            <div className="job-details-main">
                <div className="job-details-header">
                    <div className="job-details-logo-container">
                        <img 
                            src={darkMode ? logoDark : logoLight} 
                            alt="NextYouth Admin" 
                            className="job-details-logo" 
                        />
                        <h1>Job Management</h1>
                    </div>
                    
                    <div className="job-details-stats">
                        <div className="job-details-stat">
                            <div className="job-details-stat-icon">
                                <FaBriefcase />
                            </div>
                            <div className="job-details-stat-text">
                                <span>Total Jobs</span>
                                <h3>{jobs.length}</h3>
                            </div>
                        </div>
                        
                        <div className="job-details-stat">
                            <div className="job-details-stat-icon">
                                <FaChartLine />
                            </div>
                            <div className="job-details-stat-text">
                                <span>Active Jobs</span>
                                <h3>{jobs.filter(job => job.status === 'active' || job.status === 'available').length}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="job-details-controls">
                    <div className="job-details-search">
                        <div className="job-details-search-input">
                            <FaSearch />
                            <input 
                                type="text" 
                                placeholder="Search jobs..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <div className="job-details-filter">
                            <FaFilter />
                            <select 
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="closed">Closed</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                    
                    <button className="job-details-add-btn">
                        <FaPlus /> Add Job
                    </button>
                </div>

                {error && (
                    <div className="job-details-error">
                        <FaExclamationTriangle />
                        <p>{error}</p>
                    </div>
                )}

                <div className="job-details-container">
                    {currentJobs.length > 0 ? (
                        currentJobs.map(job => (
                            <div className="job-details-card" key={job._id}>
                                <div className="job-details-card-header">
                                    <h3>{job.title}</h3>
                                    <span className={`job-details-status job-details-status-${job.status.toLowerCase()}`}>
                                        {job.status}
                                    </span>
                                </div>
                                
                                {job.description && (
                                    <div className="job-details-description">
                                        {truncateText(job.description, 150)}
                                    </div>
                                )}
                                
                                <div className="job-details-meta">
                                    {job.company && (
                                        <div className="job-details-meta-item">
                                            <FaBuilding />
                                            <span>{job.company}</span>
                                        </div>
                                    )}
                                    
                                    <div className="job-details-meta-item">
                                        <FaDollarSign />
                                        <span>{formatBudget(job)}</span>
                                    </div>
                                    
                                    <div className="job-details-meta-item">
                                        <FaBriefcase />
                                        <span>{job.scope || 'Not specified'}</span>
                                    </div>
                                    
                                    <div className="job-details-meta-item">
                                        <FaCalendarAlt />
                                        <span>{formatDate(job.createdAt)} ({getTimeAgo(job.createdAt)})</span>
                                    </div>
                                </div>
                                
                                {job.skills && job.skills.length > 0 && (
                                    <div className="job-details-skills">
                                        {job.skills.slice(0, 4).map((skill, index) => (
                                            <span key={index} className="job-details-skill-tag">{skill}</span>
                                        ))}
                                        {job.skills.length > 4 && (
                                            <span className="job-details-skill-tag job-details-more-skills">
                                                +{job.skills.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                                
                                <div className="job-details-actions">
                                    <button 
                                        className="job-details-action-btn job-details-email-btn"
                                        onClick={() => openEmailModal(job)}
                                    >
                                        <FaPaperPlane /> Notify Users
                                    </button>
                                    
                                    <button 
                                        className="job-details-action-btn job-details-delete-btn"
                                        onClick={() => handleDeleteJob(job._id)}
                                    >
                                        <FaTrash /> Delete
                                    </button>
                                </div>
                                
                                {job.files && job.files.length > 0 && (
                                    <div className="job-details-file-indicator">
                                        <FaRegFileAlt /> {job.files.length} file{job.files.length !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="job-details-no-data">
                            <FaBriefcase />
                            <h3>No jobs found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    )}
                </div>

                {filteredJobs.length > jobsPerPage && (
                    <div className="job-details-pagination">
                        <button 
                            onClick={prevPage} 
                            disabled={currentPage === 1}
                            className="job-details-pagination-btn"
                        >
                            <FaAngleLeft />
                        </button>
                        
                        {[...Array(totalPages)].map((_, index) => {
                            // Only show current page, first, last, and 1 page before and after current
                            if (
                                index === 0 || 
                                index === totalPages - 1 || 
                                index === currentPage - 1 ||
                                index === currentPage - 2 && currentPage > 2 ||
                                index === currentPage && currentPage < totalPages - 1
                            ) {
                                return (
                                    <button
                                        key={index}
                                        onClick={() => paginate(index + 1)}
                                        className={`job-details-pagination-btn ${currentPage === index + 1 ? 'job-details-pagination-active' : ''}`}
                                    >
                                        {index + 1}
                                    </button>
                                );
                            }
                            // Show ellipsis for skipped pages
                            else if (
                                (index === 1 && currentPage > 3) ||
                                (index === totalPages - 2 && currentPage < totalPages - 2)
                            ) {
                                return <span key={index} className="job-details-pagination-ellipsis">...</span>;
                            }
                            return null;
                        })}
                        
                        <button 
                            onClick={nextPage} 
                            disabled={currentPage === totalPages}
                            className="job-details-pagination-btn"
                        >
                            <FaAngleRight />
                        </button>
                    </div>
                )}
            </div>
            
            {/* Email Modal */}
            {showEmailModal && selectedJob && (
                <div className="job-details-modal-overlay">
                    <div className="job-details-modal">
                        <div className="job-details-modal-header">
                            <h3>Notify Users About Job</h3>
                            <button onClick={() => setShowEmailModal(false)}>×</button>
                        </div>
                        
                        <form onSubmit={handleSendEmail}>
                            <div className="job-details-modal-body">
                                <div className="job-details-form-group">
                                    <label>Subject</label>
                                    <input 
                                        type="text" 
                                        value={emailData.subject}
                                        onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                                        required
                                    />
                                </div>
                                
                                <div className="job-details-form-group">
                                    <label>Select Recipients</label>
                                    <div className="job-details-checkbox-group">
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                name="allUsers" 
                                                checked={selectedRecipients.allUsers}
                                                onChange={handleRecipientChange}
                                            /> 
                                            All Users
                                        </label>
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                name="verifiedUsers" 
                                                checked={selectedRecipients.verifiedUsers}
                                                onChange={handleRecipientChange}
                                            /> 
                                            Verified Users Only
                                        </label>
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                name="matchingSkills" 
                                                checked={selectedRecipients.matchingSkills}
                                                onChange={handleRecipientChange}
                                            /> 
                                            Users with Matching Skills
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="job-details-form-group">
                                    <label>Message Template</label>
                                    <textarea 
                                        value={emailData.message}
                                        onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                                        rows={10}
                                        required
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="job-details-modal-footer">
                                {error && (
                                    <div className="job-details-error notification-error">
                                        <FaExclamationTriangle /> {error}
                                    </div>
                                )}
                                
                                {sendingSuccess && (
                                    <div className="job-details-success">
                                        <FaCheckCircle /> Notifications sent successfully!
                                    </div>
                                )}
                                
                                <div className="job-details-modal-buttons">
                                    <button 
                                        type="button"
                                        className="job-details-btn-secondary"
                                        onClick={() => setShowEmailModal(false)}
                                        disabled={sending}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        className="job-details-btn-primary"
                                        disabled={sending}
                                    >
                                        {sending ? (
                                            <>
                                                <div className="job-details-spinner-small"></div> Sending...
                                            </>
                                        ) : (
                                            <>
                                                <FaPaperPlane /> Send Notification
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobDetails;
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaRegFileAlt, FaChevronDown } from 'react-icons/fa';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [showJobsDropdown, setShowJobsDropdown] = useState(false);
    const [availableJobs, setAvailableJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const jobsDropdownRef = useRef(null);

    // State to store user data
    const [user, setUser] = useState({ 
        name: '', 
        profilePicture: '' // Add profilePicture to state
    });

    // Fetch user data from the server
    const fetchUserData = async () => {
        try {
            const response = await axios.get('http://localhost:4000/api/auth/me', { withCredentials: true });
            if (response.data.success) {
                setUser(response.data.user); // Update state with fetched user data
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    // Fetch available jobs
    const fetchAvailableJobs = async () => {
        setLoading(true);
        try {
            // Get available jobs
            const jobsResponse = await axios.get("http://localhost:4000/api/jobs/available", { 
                withCredentials: true 
            });
            
            // Get applied jobs to filter them out
            const appliedResponse = await axios.get("http://localhost:4000/api/jobs/applied", { 
                withCredentials: true 
            });
            
            if (jobsResponse.data.success) {
                const allJobs = jobsResponse.data.jobs;
                
                // Get list of applied job IDs
                const appliedJobIds = appliedResponse.data.success 
                    ? appliedResponse.data.jobs.map(job => job._id)
                    : [];
                
                // Filter out jobs that have been applied to
                const unappliedJobs = allJobs.filter(job => !appliedJobIds.includes(job._id));
                
                // Display only the first 3 available jobs that haven't been applied to
                setAvailableJobs(unappliedJobs.slice(0, 3));
            } else {
                setError("Failed to fetch available jobs.");
            }
        } catch (err) {
            console.error("Error fetching jobs:", err);
            setError("An error occurred while fetching available jobs.");
        } finally {
            setLoading(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (jobsDropdownRef.current && !jobsDropdownRef.current.contains(event.target)) {
                setShowJobsDropdown(false);
            }
        };

        document.addEventListener('click', handleOutsideClick);
        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    }, []);

    useEffect(() => {
        fetchUserData();
        fetchAvailableJobs();
    }, []);

    const toggleJobsDropdown = (e) => {
        e.stopPropagation(); // Prevent the outside click handler from firing
        setShowJobsDropdown(!showJobsDropdown);
    };

    // Navigate to job details page
    const viewJobDetails = (jobId) => {
        navigate(`/find-jobs/details/${jobId}`);
    };

    // Handle navigation to different job sections
    const navigateToJobSection = (section) => {
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
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            const response = await axios.post('http://localhost:4000/api/auth/logout', {}, { withCredentials: true });
            if (response.data.success) {
                alert('You have been logged out.');
                navigate('/login');
            }
        } catch (error) {
            console.error('Error logging out:', error);
            alert('Logout failed. Please try again.');
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                {/* Profile picture */}
                {user.profilePicture ? (
                    <img 
                        src={user.profilePicture} 
                        alt="Profile" 
                        className="dashboard-profile-pic" 
                    />
                ) : (
                    <div className="dashboard-profile-placeholder">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                )}
                <h1>Welcome, {user.name || 'User'}!</h1>
            </div>
            
            <p>Welcome to your dashboard! Use the options below to navigate.</p>
            
            <div className="button-group">
                <button
                    className="action-button"
                    onClick={() => navigate('/employee-profile')}
                >
                    My Profile
                </button>

                {/* Find Jobs dropdown */}
                <div className="dropdown-container" ref={jobsDropdownRef}>
                    <button
                        className="action-button dropdown-toggle"
                        onClick={toggleJobsDropdown}
                    >
                        Find Jobs <FaChevronDown className={`dropdown-icon ${showJobsDropdown ? 'rotate' : ''}`} />
                    </button>
                    {showJobsDropdown && (
                        <div className="dropdown-menu">
                            <button 
                                className="dropdown-item"
                                onClick={() => navigateToJobSection('find-work')}
                            >
                                Find Work
                            </button>
                            <button 
                                className="dropdown-item"
                                onClick={() => navigateToJobSection('saved-jobs')}
                            >
                                Saved Jobs
                            </button>
                            <button 
                                className="dropdown-item"
                                onClick={() => navigateToJobSection('proposals')}
                            >
                                Proposals
                            </button>
                        </div>
                    )}
                </div>

                <button
                    className="action-button logout-btn"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>

            <div className="available-jobs-section">
                <div className="section-header">
                    <h2>Available Jobs</h2>
                    <button 
                        className="see-all-button" 
                        onClick={() => navigate('/find-jobs')}
                    >
                        See All
                    </button>
                </div>
                
                {loading ? (
                    <p>Loading available jobs...</p>
                ) : error ? (
                    <p className="error-message">{error}</p>
                ) : availableJobs.length === 0 ? (
                    <p>No available jobs at the moment.</p>
                ) : (
                    <div className="available-jobs-preview">
                        {availableJobs.map((job) => (
                            <div key={job._id} className="job-preview-card">
                                <h3>{job.title}</h3>
                                <p className="job-description-preview">
                                    {job.description.length > 100 
                                        ? `${job.description.substring(0, 100)}...` 
                                        : job.description}
                                </p>
                                <div className="job-preview-details">
                                    <div className="job-skills-preview">
                                        {job.skills.slice(0, 3).map((skill, index) => (
                                            <span key={index} className="skill-tag-preview">
                                                {skill}
                                            </span>
                                        ))}
                                        {job.skills.length > 3 && <span className="more-skills">+{job.skills.length - 3}</span>}
                                    </div>
                                    <p className="job-budget">
                                        {job.budgetType === "hourly"
                                            ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
                                            : `$${job.fixedAmount} Fixed`}
                                    </p>
                                </div>
                                <div className="job-preview-footer">
                                    <button 
                                        className="view-job-button" 
                                        onClick={() => viewJobDetails(job._id)}
                                    >
                                        View Details
                                    </button>
                                    {job.files?.length > 0 && (
                                        <div className="job-attachments-preview">
                                            <FaRegFileAlt /> {job.files.length} attachment{job.files.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeDashboard;
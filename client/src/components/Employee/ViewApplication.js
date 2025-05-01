import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaDownload, FaRegFileAlt, FaSpinner, 
         FaExclamationCircle, FaDollarSign, FaClock, 
         FaEdit, FaTrash, FaCheckCircle, FaBriefcase, 
         FaFileContract, FaCommentDots } from 'react-icons/fa';
import './ViewApplication.css';

const ViewApplication = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Fetch application data
    useEffect(() => {
        const fetchApplicationData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    `http://localhost:4000/api/jobs/application/${applicationId}`, 
                    { withCredentials: true }
                );
                
                if (response.data.success) {
                    setApplication(response.data.application);
                    setJob(response.data.application.job);
                } else {
                    setError("Failed to load application details");
                }
            } catch (err) {
                console.error("Error fetching application:", err);
                setError("Error loading application details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [applicationId]);

    // Handle application withdrawal/deletion
    const handleDeleteApplication = async () => {
        try {
            setLoading(true);
            const response = await axios.delete(
                `http://localhost:4000/api/jobs/application/${applicationId}`,
                { withCredentials: true }
            );
            
            if (response.data.success) {
                alert("Application withdrawn successfully");
                navigate('/find-jobs/proposals');
            } else {
                setError(response.data.message || "Failed to withdraw application");
            }
        } catch (err) {
            console.error("Error withdrawing application:", err);
            setError(err.response?.data?.message || "An error occurred while withdrawing your application");
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <div className="application-loading">
                <FaSpinner className="spinning" />
                <p>Loading application details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="application-error">
                <FaExclamationCircle />
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => navigate('/find-jobs/proposals')}>Back to Proposals</button>
            </div>
        );
    }

    if (!application) {
        return (
            <div className="application-error">
                <FaExclamationCircle />
                <h3>Application Not Found</h3>
                <p>The application you're looking for doesn't exist or has been removed.</p>
                <button onClick={() => navigate('/find-jobs/proposals')}>Back to Proposals</button>
            </div>
        );
    }

    return (
        <div className="view-application-container">
            {/* Back button */}
            <button 
                className="back-to-proposals-button"
                onClick={() => navigate('/find-jobs/proposals')}
            >
                <FaArrowLeft /> Back to Proposals
            </button>

            {/* Application header */}
            <div className="application-page-header">
                <div className="header-content">
                    <h1>Your Job Application</h1>
                    <p className="header-subtitle">
                        {application.status === 'pending' && 'Pending review by employer'}
                        {application.status === 'accepted' && 'Application accepted!'}
                        {application.status === 'rejected' && 'Application not selected'}
                        {application.status === 'withdrawn' && 'Application withdrawn'}
                    </p>
                </div>
                <div className="header-icon">
                    <FaBriefcase />
                </div>
            </div>

            {/* Job Details */}
            <div className="application-section job-details-section">
                <div className="section-header">
                    <div className="section-icon">
                        <FaFileContract />
                    </div>
                    <h2>Job Details</h2>
                </div>
                
                <div className="section-content">
                    <h3 className="job-title">{job?.title}</h3>
                    
                    <div className="job-info-grid">
                        <div className="job-info-item">
                            <div className="info-icon">
                                <FaDollarSign />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Budget:</span>
                                <span className="info-value">
                                    {job?.budgetType === "hourly"
                                        ? `$${job?.hourlyFrom} - $${job?.hourlyTo}/hr`
                                        : `$${job?.fixedAmount} Fixed`}
                                </span>
                            </div>
                        </div>
                        <div className="job-info-item">
                            <div className="info-icon">
                                <FaClock />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Scope:</span>
                                <span className="info-value">{job?.scope}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="job-description-container">
                        <h4>Description</h4>
                        <div className="job-description-content">
                            <p>{job?.description}</p>
                        </div>
                    </div>
                    
                    {job?.skills?.length > 0 && (
                        <div className="job-skills-container">
                            <h4>Required Skills</h4>
                            <div className="skills-list">
                                {job.skills.map((skill, index) => (
                                    <span key={index} className="skill-tag">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Application Details */}
            <div className="application-section application-details-section">
                <div className="section-header">
                    <div className="section-icon">
                        <FaDollarSign />
                    </div>
                    <h2>Your Application Details</h2>
                </div>
                
                <div className="section-content">
                    <div className="application-status">
                        <h4>Application Status</h4>
                        <div className={`status-badge ${application.status}`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </div>
                    </div>
                    
                    <div className="application-info-grid">
                        <div className="application-info-item">
                            <div className="info-icon">
                                <FaDollarSign />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Your Bid:</span>
                                <span className="info-value">${application.bid}</span>
                            </div>
                        </div>
                        <div className="application-info-item">
                            <div className="info-icon">
                                <FaDollarSign />
                            </div>
                            <div className="info-content">
                                <span className="info-label">You'll Receive:</span>
                                <span className="info-value">${application.receivedAmount}</span>
                            </div>
                        </div>
                        <div className="application-info-item">
                            <div className="info-icon">
                                <FaClock />
                            </div>
                            <div className="info-content">
                                <span className="info-label">Estimated Duration:</span>
                                <span className="info-value">{application.duration}</span>
                            </div>
                        </div>
                    </div>

                    {application.coverLetter && (
                        <div className="cover-letter-container">
                            <h4>Your Cover Letter</h4>
                            <div className="cover-letter-content">
                                <p>{application.coverLetter}</p>
                            </div>
                        </div>
                    )}
                    
                    {application.attachments && application.attachments.length > 0 && (
                        <div className="attachments-container">
                            <h4>Your Attachments</h4>
                            <div className="attachments-list">
                                {application.attachments.map((file, index) => (
                                    <a 
                                        key={index}
                                        href={file.path} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="attachment-link"
                                        download
                                    >
                                        <FaRegFileAlt />
                                        <span className="attachment-name">{file.filename}</span>
                                        <FaDownload className="download-icon" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="application-meta">
                        <div className="application-date">
                            <strong>Applied on:</strong> {new Date(application.createdAt).toLocaleDateString()}
                        </div>
                        {application.updatedAt !== application.createdAt && (
                            <div className="application-update-date">
                                <strong>Last updated:</strong> {new Date(application.updatedAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    
                    {application.status === 'pending' && (
                        <div className="application-actions">
                            <button 
                                className="edit-application-button"
                                onClick={() => navigate(`/edit-application/${applicationId}`)}
                            >
                                <FaEdit /> Edit Application
                            </button>
                            <button 
                                className="withdraw-application-button"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <FaTrash /> Withdraw Application
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="delete-confirmation-modal">
                        <h3>Withdraw Application</h3>
                        <p>Are you sure you want to withdraw your application? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="cancel-modal-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                            <button className="delete-modal-btn" onClick={handleDeleteApplication}>Withdraw Application</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewApplication;
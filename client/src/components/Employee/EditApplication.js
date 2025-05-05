import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaDollarSign, 
         FaClock, FaUpload, FaFileContract, FaRegFileAlt, FaDownload,
         FaCommentDots, FaTimes, FaBriefcase } from 'react-icons/fa';
import './ViewApplication.css';  // Using ViewApplication.css instead of EditApplication.css

const EditApplication = () => {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        bid: '',
        receivedAmount: '',
        duration: '',
        coverLetter: ''
    });
    const [job, setJob] = useState(null);
    const [files, setFiles] = useState([]);
    const [existingFiles, setExistingFiles] = useState([]);
    const fileInputRef = useRef(null);
    
    // Service fee percentage
    const serviceFeePercentage = 5;
    
    // Get theme from localStorage or default to light
    const isDarkMode = localStorage.getItem("dashboard-theme") === "dark";

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
                    const application = response.data.application;
                    setFormData({
                        bid: application.bid,
                        receivedAmount: application.receivedAmount,
                        duration: application.duration,
                        coverLetter: application.coverLetter || ''
                    });
                    setJob(application.job);
                    setExistingFiles(application.attachments || []);
                } else {
                    setError("Failed to load application details");
                }
            } catch (err) {
                console.error("Error fetching application:", err);
                setError(err.response?.data?.message || "Error loading application details. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchApplicationData();
    }, [applicationId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'bid') {
            const bid = Number(value);
            const fee = (bid * serviceFeePercentage) / 100;
            setFormData(prev => ({
                ...prev,
                bid: value,
                receivedAmount: (bid - fee).toFixed(2)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...selectedFiles]);
    };
    
    const removeFile = (index) => {
        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setSubmitting(true);
            
            // Create form data for multipart file upload
            const formDataToSend = new FormData();
            formDataToSend.append('bid', formData.bid);
            formDataToSend.append('receivedAmount', formData.receivedAmount);
            formDataToSend.append('duration', formData.duration);
            formDataToSend.append('coverLetter', formData.coverLetter);
            
            // Append files if any
            files.forEach(file => {
                formDataToSend.append('attachments', file);
            });
            
            const response = await axios.put(
                `http://localhost:4000/api/jobs/application/${applicationId}`,
                formDataToSend,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data.success) {
                alert("Application updated successfully!");
                navigate(`/view-application/${applicationId}`);
            } else {
                setError(response.data.message || "Failed to update application");
            }
        } catch (err) {
            console.error("Error updating application:", err);
            setError(err.response?.data?.message || "An error occurred. Please try again.");
        } finally {
            setSubmitting(false);
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
                <button onClick={() => navigate(`/view-application/${applicationId}`)}>Back to Application</button>
            </div>
        );
    }

    return (
        <div className={`view-application-container ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Back to application button */}
            <button 
                className="back-to-proposals-button"
                onClick={() => navigate(`/view-application/${applicationId}`)}
            >
                <FaArrowLeft /> Back to Application
            </button>

            {/* Application header */}
            <div className="application-page-header">
                <div className="header-content">
                    <h1>Edit Your Application</h1>
                    <p className="header-subtitle">
                        {job && `For: ${job.title}`}
                    </p>
                </div>
                <div className="header-icon">
                    <FaBriefcase />
                </div>
            </div>

            {/* Job Details Section */}
            {job && (
                <div className="application-section job-details-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaFileContract />
                        </div>
                        <h2>Job Details</h2>
                    </div>
                    
                    <div className="section-content">
                        <h3 className="job-title">{job.title}</h3>
                        
                        <div className="job-info-grid">
                            <div className="job-info-item">
                                <div className="info-icon">
                                    <FaDollarSign />
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Budget:</span>
                                    <span className="info-value">
                                        {job.budgetType === "hourly"
                                            ? `$${job.hourlyFrom} - $${job.hourlyTo}/hr`
                                            : `$${job.fixedAmount} Fixed`}
                                    </span>
                                </div>
                            </div>
                            <div className="job-info-item">
                                <div className="info-icon">
                                    <FaClock />
                                </div>
                                <div className="info-content">
                                    <span className="info-label">Scope:</span>
                                    <span className="info-value">{job.scope}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="job-description-container">
                            <h4>Description</h4>
                            <div className="job-description-content">
                                <p>{job.description}</p>
                            </div>
                        </div>
                        
                        <div className="job-skills-container">
                            <h4>Required Skills</h4>
                            <div className="skills-list">
                                {job.skills?.map((skill, index) => (
                                    <span key={index} className="skill-tag">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSubmit}>
                <div className="application-section application-details-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaDollarSign />
                        </div>
                        <h2>Update Terms & Payment</h2>
                    </div>
                    
                    <div className="section-content">
                        <div className="cover-letter-container">
                            <h4><FaDollarSign /> Your Bid (Total Amount)</h4>
                            <div className="cover-letter-content">
                                <input
                                    type="number"
                                    id="bid"
                                    name="bid"
                                    value={formData.bid}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    min="1"
                                    required
                                    style={{
                                        width: "100%", 
                                        padding: "10px", 
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-color, #eaeaea)",
                                        marginBottom: "10px"
                                    }}
                                />
                            </div>
                        </div>

                        <div className="cover-letter-container">
                            <h4><FaDollarSign /> You'll Receive</h4>
                            <div className="cover-letter-content">
                                <input
                                    type="number"
                                    id="receivedAmount"
                                    name="receivedAmount"
                                    value={formData.receivedAmount}
                                    disabled
                                    style={{
                                        width: "100%", 
                                        padding: "10px", 
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-color, #eaeaea)",
                                        backgroundColor: "var(--disabled-bg, #f5f5f5)",
                                        marginBottom: "5px"
                                    }}
                                />
                                <small>This is the amount after {serviceFeePercentage}% platform fee</small>
                            </div>
                        </div>

                        <div className="cover-letter-container">
                            <h4><FaClock /> Estimated Duration</h4>
                            <div className="cover-letter-content">
                                <select
                                    id="duration"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: "100%", 
                                        padding: "10px", 
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-color, #eaeaea)"
                                    }}
                                >
                                    <option value="">Select duration</option>
                                    <option value="less than 1 month">Less than 1 month</option>
                                    <option value="1-3 months">1-3 months</option>
                                    <option value="3-6 months">3-6 months</option>
                                    <option value="more than 6 months">More than 6 months</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="application-section">
                    <div className="section-header">
                        <div className="section-icon">
                            <FaCommentDots />
                        </div>
                        <h2>Additional Details</h2>
                    </div>
                    
                    <div className="section-content">
                        <div className="cover-letter-container">
                            <h4>Cover Letter</h4>
                            <div className="cover-letter-content">
                                <textarea
                                    id="coverLetter"
                                    name="coverLetter"
                                    value={formData.coverLetter}
                                    onChange={handleInputChange}
                                    rows="6"
                                    placeholder="Explain why you're the best fit for this job"
                                    style={{
                                        width: "100%", 
                                        padding: "10px", 
                                        borderRadius: "8px",
                                        border: "1px solid var(--border-color, #eaeaea)",
                                        marginBottom: "5px"
                                    }}
                                />
                                <small>
                                    {formData.coverLetter?.length || 0}/5000 characters
                                </small>
                            </div>
                        </div>

                        <div className="cover-letter-container">
                            <h4><FaUpload /> Add More Attachments</h4>
                            <div className="cover-letter-content">
                                <input
                                    type="file"
                                    id="attachments"
                                    name="attachments"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    style={{ display: 'none' }}
                                />
                                <button 
                                    type="button" 
                                    className="edit-application-button"
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ marginBottom: "15px" }}
                                >
                                    <FaUpload /> Select Files
                                </button>
                                
                                {files.length > 0 && (
                                    <div className="attachments-container" style={{ padding: "0" }}>
                                        <h4>New Files to Upload</h4>
                                        <ul className="attachments-list">
                                            {files.map((file, index) => (
                                                <li key={index} 
                                                    style={{
                                                        display: "flex", 
                                                        alignItems: "center",
                                                        gap: "0.75rem",
                                                        padding: "0.75rem 1rem",
                                                        backgroundColor: "var(--primary-light, rgba(67, 97, 238, 0.05))",
                                                        borderRadius: "8px",
                                                        marginBottom: "8px"
                                                    }}
                                                >
                                                    <FaRegFileAlt />
                                                    <span style={{ flex: 1 }}>{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        style={{
                                                            background: "none",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            color: "var(--error-color, #ff4d4f)"
                                                        }}
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {existingFiles.length > 0 && (
                            <div className="attachments-container">
                                <h4>Current Attachments</h4>
                                <div className="attachments-list">
                                    {existingFiles.map((file, index) => (
                                        <a 
                                            key={index}
                                            href={file.path} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="attachment-link"
                                        >
                                            <FaRegFileAlt />
                                            <span className="attachment-name">{file.filename}</span>
                                            <FaDownload className="download-icon" />
                                        </a>
                                    ))}
                                </div>
                                <small>Note: Your existing attachments will be kept</small>
                            </div>
                        )}
                    </div>
                </div>

                <div className="application-actions">
                    <button
                        type="button"
                        className="withdraw-application-button"
                        onClick={() => navigate(`/view-application/${applicationId}`)}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="edit-application-button"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <FaSpinner className="spinning" /> Updating...
                            </>
                        ) : (
                            'Update Application'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditApplication;
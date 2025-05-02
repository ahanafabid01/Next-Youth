import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCheck, FaTimes, FaEye, FaSpinner, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Applications.css";
import API_BASE_URL from '../../config';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new endpoint specifically for employer applications
      const response = await axios.get(`${API_BASE_URL}/jobs/employer-applications`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setApplications(response.data.applications);
      } else {
        throw new Error("Failed to fetch applications");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.message || "An error occurred while fetching applications");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:4000/api/jobs/application/${applicationId}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Update the local state to reflect the status change
        setApplications(applications.map(app => 
          app._id === applicationId ? { ...app, status: newStatus } : app
        ));
        
        if (selectedApplication && selectedApplication._id === applicationId) {
          setSelectedApplication({ ...selectedApplication, status: newStatus });
        }
      }
    } catch (err) {
      console.error(`Error updating application status to ${newStatus}:`, err);
      alert(err.response?.data?.message || `Failed to update application status to ${newStatus}`);
    }
  };

  const handleViewProfile = (userId) => {
    if (userId) {
      navigate(`/view-profile/${userId}`);
    }
  };

  // Application detail modal
  const ApplicationDetailModal = () => {
    if (!selectedApplication) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content application-detail-modal">
          <div className="modal-header">
            <h3>Application Details</h3>
            <button onClick={() => setShowDetailModal(false)} className="close-button">
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="detail-section">
              <h4>Job Details</h4>
              <p><strong>Job Title:</strong> {selectedApplication.job.title}</p>
              <p><strong>Posted On:</strong> {new Date(selectedApplication.job.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="detail-section">
              <h4>Applicant Information</h4>
              <p><strong>Name:</strong> {selectedApplication.applicant ? selectedApplication.applicant.name : "Unknown User"}</p>
              <p><strong>Email:</strong> {selectedApplication.applicant ? selectedApplication.applicant.email : "N/A"}</p>
              <p><strong>Applied On:</strong> {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
              {selectedApplication.applicant && (
                <button 
                  className="view-profile-button"
                  onClick={() => handleViewProfile(selectedApplication.applicant._id)}
                >
                  View Applicant Profile
                </button>
              )}
            </div>
            
            <div className="detail-section">
              <h4>Application Details</h4>
              <p><strong>Bid Amount:</strong> ${selectedApplication.bid}</p>
              <p><strong>Duration:</strong> {selectedApplication.duration}</p>
              <p><strong>Status:</strong> 
                <span className={`status-badge ${selectedApplication.status}`}>
                  {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                </span>
              </p>
            </div>
            
            {selectedApplication.coverLetter && (
              <div className="detail-section">
                <h4>Cover Letter</h4>
                <div className="cover-letter">
                  {selectedApplication.coverLetter}
                </div>
              </div>
            )}
            
            {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
              <div className="detail-section">
                <h4>Attachments</h4>
                <div className="attachments-list">
                  {selectedApplication.attachments.map((attachment, index) => (
                    <a 
                      key={index} 
                      href={attachment.path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      {attachment.filename}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            {selectedApplication.status === "pending" && (
              <div className="action-buttons">
                <button 
                  className="accept-button"
                  onClick={() => updateApplicationStatus(selectedApplication._id, "accepted")}
                >
                  <FaCheck /> Accept Application
                </button>
                <button 
                  className="reject-button"
                  onClick={() => updateApplicationStatus(selectedApplication._id, "rejected")}
                >
                  <FaTimes /> Reject Application
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="applications-container">
        <div className="loading-container">
          <FaSpinner className="spinning" />
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="applications-container">
        <div className="error-container">
          <FaExclamationCircle className="error-icon" />
          <p className="error-message">{error}</p>
          <button onClick={fetchApplications} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="applications-container">
      <div className="applications-header">
        <h1>Job Applications</h1>
        <p>Review and manage applications for your job postings</p>
      </div>
      
      {applications.length === 0 ? (
        <div className="no-applications">
          <p>No applications have been received for your job posts yet.</p>
        </div>
      ) : (
        <div className="applications-table-container">
          <table className="applications-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Job Title</th>
                <th>Bid</th>
                <th>Duration</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application._id} className={`application-row ${application.status}`}>
                  <td>{application.applicant ? application.applicant.name : "Unknown User"}</td>
                  <td>{application.job ? application.job.title : "Unknown Job"}</td>
                  <td>${application.bid}</td>
                  <td>{application.duration}</td>
                  <td>{new Date(application.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge ${application.status}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        title="View Details" 
                        className="view-button"
                        onClick={() => handleViewDetails(application)}
                      >
                        <FaEye />
                      </button>
                      
                      {application.status === "pending" && (
                        <>
                          <button 
                            title="Accept Application" 
                            className="accept-button"
                            onClick={() => updateApplicationStatus(application._id, "accepted")}
                          >
                            <FaCheck />
                          </button>
                          <button 
                            title="Reject Application" 
                            className="reject-button"
                            onClick={() => updateApplicationStatus(application._id, "rejected")}
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {showDetailModal && <ApplicationDetailModal />}
    </div>
  );
};

export default Applications;
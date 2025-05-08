import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./AdminDashboard.css";
import "./Applications.css";
import axios from "axios";
import { FaEye, FaCheck, FaTimesCircle, FaRegClock } from "react-icons/fa";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      // This endpoint would need to be implemented on your server
      const response = await axios.get("http://localhost:4000/api/jobs/admin/applications", {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        setApplications(response.data.applications);
      } else {
        throw new Error(response.data?.message || "Failed to fetch applications");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(`Failed to load applications: ${err.message}`);
      setLoading(false);
    }
  };

  // Format date for better readability
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge based on status
  const getStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <span className="status-badge accepted"><FaCheck /> Accepted</span>;
      case 'rejected':
        return <span className="status-badge rejected"><FaTimesCircle /> Rejected</span>;
      case 'pending':
      default:
        return <span className="status-badge pending"><FaRegClock /> Pending</span>;
    }
  };

  // Open modal to view application details
  const openDetailModal = (application) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedApplication(null);
  };

  // Render loading state
  if (loading) return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="loading">Loading applications data...</div>
      </div>
    </div>
  );

  // Render error state
  if (error) return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="error-message">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-container">
          <h1>Job Applications</h1>
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Applications</h3>
              <p>{applications.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending</h3>
              <p>{applications.filter(app => app.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>Accepted</h3>
              <p>{applications.filter(app => app.status === 'accepted').length}</p>
            </div>
            <div className="stat-card">
              <h3>Rejected</h3>
              <p>{applications.filter(app => app.status === 'rejected').length}</p>
            </div>
          </div>
          
          <div className="applications-table-container">
            <h2>Applications Management</h2>
            <table className="applications-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Job</th>
                  <th>Bid</th>
                  <th>Duration</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length > 0 ? (
                  applications.map(app => (
                    <tr key={app._id}>
                      <td>{app.applicant?.name || "Unknown"}</td>
                      <td>{app.job?.title || "Unknown Job"}</td>
                      <td>${app.bid}</td>
                      <td>{app.duration}</td>
                      <td>{formatDate(app.createdAt)}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>
                        <button 
                          className="action-btn view-btn"
                          onClick={() => openDetailModal(app)}
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">No applications found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Application Detail Modal */}
          {showDetailModal && selectedApplication && (
            <div className="modal-overlay">
              <div className="application-detail-modal">
                <div className="modal-header">
                  <h2>Application Details</h2>
                  <button className="close-modal" onClick={closeModal}>&times;</button>
                </div>
                <div className="modal-content">
                  <div className="application-info">
                    <h3>Job Information</h3>
                    <p><strong>Title:</strong> {selectedApplication.job?.title}</p>
                    <p><strong>Description:</strong> {selectedApplication.job?.description}</p>
                    
                    <h3>Applicant Information</h3>
                    <p><strong>Name:</strong> {selectedApplication.applicant?.name}</p>
                    <p><strong>Email:</strong> {selectedApplication.applicant?.email}</p>
                    
                    <h3>Proposal Details</h3>
                    <p><strong>Bid Amount:</strong> ${selectedApplication.bid}</p>
                    <p><strong>Duration:</strong> {selectedApplication.duration}</p>
                    <p><strong>Status:</strong> {selectedApplication.status}</p>
                    
                    <h3>Cover Letter</h3>
                    <div className="cover-letter">
                      {selectedApplication.coverLetter || "No cover letter provided"}
                    </div>
                    
                    {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                      <div className="attachments">
                        <h3>Attachments</h3>
                        <ul>
                          {selectedApplication.attachments.map((file, index) => (
                            <li key={index}>
                              <a href={file.path} target="_blank" rel="noreferrer">{file.filename}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="action-btn close-btn" onClick={closeModal}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;
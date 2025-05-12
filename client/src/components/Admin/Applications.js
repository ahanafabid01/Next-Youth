import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./Applications.css";
import axios from "axios";
import { 
  FaEye, 
  FaCheck, 
  FaTimesCircle, 
  FaRegClock, 
  FaChevronLeft, 
  FaChevronRight, 
  FaFilter, 
  FaDownload,
  FaSearch,
  FaClipboardList,
  FaInfoCircle,
  FaCalendarAlt
} from "react-icons/fa";
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [statusUpdateFeedback, setStatusUpdateFeedback] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filtering state
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
    
    // Check theme from localStorage
    const savedTheme = localStorage.getItem("adminTheme");
    setDarkMode(savedTheme === "dark");
    
    // Listen for theme changes
    const handleStorageChange = () => {
      const currentTheme = localStorage.getItem("adminTheme");
      setDarkMode(currentTheme === "dark");
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/jobs/admin/applications`, {
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
        return <span className="app-mgmt-status-badge app-mgmt-accepted"><FaCheck /> Accepted</span>;
      case 'rejected':
        return <span className="app-mgmt-status-badge app-mgmt-rejected"><FaTimesCircle /> Rejected</span>;
      case 'pending':
      default:
        return <span className="app-mgmt-status-badge app-mgmt-pending"><FaRegClock /> Pending</span>;
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

  // Updated version of the function
  const updateApplicationStatus = async (id, newStatus) => {
    try {
      setStatusUpdateFeedback({ type: 'loading', message: `Updating status to ${newStatus}...` });
      
      const response = await axios.put(
        `API_BASE_URL/jobs/applications/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      if (response.data && response.data.success) {
        // Update local state to reflect the change
        setApplications(prevApps => 
          prevApps.map(app => 
            app._id === id ? { ...app, status: newStatus } : app
          )
        );
        
        // If we're updating the currently selected application, update it too
        if (selectedApplication && selectedApplication._id === id) {
          setSelectedApplication({
            ...selectedApplication,
            status: newStatus
          });
        }
        
        setStatusUpdateFeedback({ 
          type: 'success', 
          message: `Status successfully updated to ${newStatus}` 
        });
        
        // Clear feedback after 3 seconds
        setTimeout(() => setStatusUpdateFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Error updating application status:", err);
      setStatusUpdateFeedback({ 
        type: 'error', 
        message: `Failed to update status: ${err.message || 'Unknown error'}` 
      });
      // Keep error message visible longer
      setTimeout(() => setStatusUpdateFeedback(null), 5000);
    }
  };

  // Filter applications based on status and search term
  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = 
      searchTerm === '' || 
      app.applicant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Applicant', 'Job', 'Bid', 'Duration', 'Applied Date', 'Status'];
    const csvData = filteredApplications.map(app => [
      app.applicant?.name || "Unknown",
      app.job?.title || "Unknown Job",
      app.bid,
      app.duration,
      formatDate(app.createdAt),
      app.status
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `applications_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render loading state
  if (loading) return (
    <div className={`app-mgmt-dashboard ${darkMode ? 'app-mgmt-dark-mode' : ''}`}>
      <Sidebar />
      <div className="app-mgmt-main-content">
        <div className="app-mgmt-loading">
          <div className="app-mgmt-spinner"></div>
          <p>Loading applications data...</p>
        </div>
      </div>
    </div>
  );

  // Render error state
  if (error) return (
    <div className={`app-mgmt-dashboard ${darkMode ? 'app-mgmt-dark-mode' : ''}`}>
      <Sidebar />
      <div className="app-mgmt-main-content">
        <div className="app-mgmt-error-message">
          <div className="app-mgmt-error-icon">!</div>
          <h3>Error Loading Applications</h3>
          <p>{error}</p>
          <button onClick={fetchApplications} className="app-mgmt-retry-btn">Retry</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`app-mgmt-dashboard ${darkMode ? 'app-mgmt-dark-mode' : ''}`}>
      <Sidebar />
      <div className="app-mgmt-main-content">
          <div className="app-mgmt-title">
            <h1>Job Applications Management</h1>
            <p className="app-mgmt-header-subtitle">Track and manage application statuses efficiently in one place.</p>
            <br></br>
          </div>
        
        <div className="app-mgmt-container">
          <div className="app-mgmt-stats-grid">
            <div className="app-mgmt-stat-card app-mgmt-total">
              <div className="app-mgmt-stat-icon">
                <FaClipboardList />
              </div>
              <div className="app-mgmt-stat-content">
                <h3>Total Applications</h3>
                <p className="app-mgmt-stat-number">{applications.length}</p>
              </div>
            </div>
            <div className="app-mgmt-stat-card app-mgmt-pending-card">
              <div className="app-mgmt-stat-icon">
                <FaRegClock />
              </div>
              <div className="app-mgmt-stat-content">
                <h3>Pending Review</h3>
                <p className="app-mgmt-stat-number">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
            </div>
            <div className="app-mgmt-stat-card app-mgmt-accepted-card">
              <div className="app-mgmt-stat-icon">
                <FaCheck />
              </div>
              <div className="app-mgmt-stat-content">
                <h3>Accepted</h3>
                <p className="app-mgmt-stat-number">
                  {applications.filter(app => app.status === 'accepted').length}
                </p>
              </div>
            </div>
            <div className="app-mgmt-stat-card app-mgmt-rejected-card">
              <div className="app-mgmt-stat-icon">
                <FaTimesCircle />
              </div>
              <div className="app-mgmt-stat-content">
                <h3>Rejected</h3>
                <p className="app-mgmt-stat-number">
                  {applications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="app-mgmt-table-container">
            <div className="app-mgmt-table-header">
              <h2>Applications Overview</h2>
              <div className="app-mgmt-table-actions">
                <div className="app-mgmt-search-box">
                  <input
                    type="text"
                    placeholder="Search by name or job title..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <FaSearch className="app-mgmt-search-icon" />
                </div>
                
                <div className="app-mgmt-filter-box">
                  <FaFilter className="app-mgmt-filter-icon" />
                  <select 
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <button 
                  className="app-mgmt-export-btn"
                  onClick={exportToCSV}
                  title="Export to CSV"
                >
                  <FaDownload /> Export Data
                </button>
              </div>
            </div>
            
            <div className="app-mgmt-table-responsive">
              <table className="app-mgmt-applications-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Job Title</th>
                    <th className="app-mgmt-hide-sm">Bid</th>
                    <th className="app-mgmt-hide-sm">Duration</th>
                    <th className="app-mgmt-hide-md">Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map(app => (
                      <tr key={app._id}>
                        <td className="app-mgmt-applicant-name">
                          {app.applicant?.name || "Unknown"}
                        </td>
                        <td className="app-mgmt-job-title">
                          {app.job?.title || "Unknown Job"}
                        </td>
                        <td className="app-mgmt-hide-sm">
                          ${app.bid}
                        </td>
                        <td className="app-mgmt-hide-sm">
                          {app.duration}
                        </td>
                        <td className="app-mgmt-hide-md">
                          {formatDate(app.createdAt)}
                        </td>
                        <td>
                          {getStatusBadge(app.status)}
                        </td>
                        <td>
                          <div className="app-mgmt-actions">
                            <button 
                              className="app-mgmt-action-btn app-mgmt-view-btn"
                              onClick={() => openDetailModal(app)}
                              title="View application details"
                            >
                              <FaEye />
                              <span className="app-mgmt-action-text">View</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="app-mgmt-no-data">
                        <FaInfoCircle /> No applications match your current filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {filteredApplications.length > itemsPerPage && (
              <div className="app-mgmt-pagination">
                <button 
                  onClick={() => paginate(Math.max(currentPage - 1, 1))} 
                  disabled={currentPage === 1}
                  className="app-mgmt-page-btn"
                  aria-label="Previous page"
                >
                  <FaChevronLeft />
                </button>
                
                <div className="app-mgmt-page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around the current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => paginate(pageNum)}
                        className={`app-mgmt-page-num ${currentPage === pageNum ? 'app-mgmt-active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="app-mgmt-page-ellipsis">...</span>
                      <button
                        onClick={() => paginate(totalPages)}
                        className={`app-mgmt-page-num ${currentPage === totalPages ? 'app-mgmt-active' : ''}`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button 
                  onClick={() => paginate(Math.min(currentPage + 1, totalPages))} 
                  disabled={currentPage === totalPages}
                  className="app-mgmt-page-btn"
                  aria-label="Next page"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
            
            <div className="app-mgmt-table-footer">
              <div className="app-mgmt-items-per-page">
                <span>Show:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>items per page</span>
              </div>
              
              <div className="app-mgmt-showing-info">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredApplications.length)} of {filteredApplications.length} applications
              </div>
            </div>
          </div>
        </div>
        
        {/* Application Detail Modal */}
        {showDetailModal && selectedApplication && (
          <div className="app-mgmt-modal-overlay">
            <div className="app-mgmt-application-detail-modal">
              <div className="app-mgmt-modal-header">
                <h2>Application Details</h2>
                <button className="app-mgmt-close-modal" onClick={closeModal}>&times;</button>
              </div>
              <div className="app-mgmt-modal-content">
                <div className="app-mgmt-modal-section app-mgmt-job-section">
                  <h3>Job Information</h3>
                  <div className="app-mgmt-detail-group">
                    <label>Title:</label>
                    <p>{selectedApplication.job?.title}</p>
                  </div>
                  <div className="app-mgmt-detail-group">
                    <label>Description:</label>
                    <p>{selectedApplication.job?.description}</p>
                  </div>
                  <div className="app-mgmt-detail-group">
                    <label>Budget:</label>
                    <p>${selectedApplication.job?.budget}</p>
                  </div>
                </div>
                
                <div className="app-mgmt-modal-section app-mgmt-applicant-section">
                  <h3>Applicant Information</h3>
                  <div className="app-mgmt-detail-group">
                    <label>Name:</label>
                    <p>{selectedApplication.applicant?.name}</p>
                  </div>
                  <div className="app-mgmt-detail-group">
                    <label>Email:</label>
                    <p>{selectedApplication.applicant?.email}</p>
                  </div>
                  <div className="app-mgmt-detail-group">
                    <label><FaCalendarAlt /> Applied:</label>
                    <p>{formatDate(selectedApplication.createdAt)}</p>
                  </div>
                </div>
                
                <div className="app-mgmt-modal-section app-mgmt-proposal-section">
                  <h3>Proposal Details</h3>
                  <div className="app-mgmt-detail-group">
                    <label>Bid Amount:</label>
                    <p>${selectedApplication.bid}</p>
                  </div>
                  <div className="app-mgmt-detail-group">
                    <label>Duration:</label>
                    <p>{selectedApplication.duration}</p>
                  </div>
                  <div className="app-mgmt-detail-group">
                    <label>Status:</label>
                    <p>{getStatusBadge(selectedApplication.status)}</p>
                  </div>
                </div>
                
                <div className="app-mgmt-modal-section app-mgmt-cover-letter-section">
                  <h3>Cover Letter</h3>
                  <div className="app-mgmt-cover-letter">
                    {selectedApplication.coverLetter || "No cover letter provided"}
                  </div>
                </div>
                
                {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                  <div className="app-mgmt-modal-section app-mgmt-attachments-section">
                    <h3>Attachments</h3>
                    <ul className="app-mgmt-attachments-list">
                      {selectedApplication.attachments.map((file, index) => (
                        <li key={index}>
                          <a href={file.path} target="_blank" rel="noreferrer">{file.filename}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="app-mgmt-modal-footer">
                {statusUpdateFeedback && (
                  <div className={`app-mgmt-status-feedback app-mgmt-${statusUpdateFeedback.type}`}>
                    {statusUpdateFeedback.type === 'loading' && <div className="app-mgmt-mini-spinner"></div>}
                    {statusUpdateFeedback.type === 'success' && <FaCheck />}
                    {statusUpdateFeedback.type === 'error' && <FaTimesCircle />}
                    <span>{statusUpdateFeedback.message}</span>
                  </div>
                )}
                <button className="app-mgmt-close-btn" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
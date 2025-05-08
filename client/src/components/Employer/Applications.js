import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaCheck, FaTimes, FaEye, FaSpinner, FaExclamationCircle, FaSearch,
  FaFileAlt, FaUser, FaBriefcase, FaCalendarAlt, FaMoneyBillWave,
  FaClock, FaFilter, FaPlus, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Applications.css";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginationRange, setPaginationRange] = useState([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the new endpoint specifically for employer applications
      const response = await axios.get("http://localhost:4000/api/jobs/employer-applications", {
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

  const filteredApplications = applications.filter(app => {
    // Status filter
    if (activeFilter !== "all" && app.status !== activeFilter) {
      return false;
    }
    
    // Search filter - check if applicant name or job title includes search term
    if (searchTerm && !((app.applicant?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
        (app.job?.title || "").toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }
    
    return true;
  });

  // Calculate pagination information
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);

  // Handle pagination
  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // Scroll to top of applications container
      document.querySelector('.applications-container')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Generate pagination range with ellipsis
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

  // Reset to first page when filters change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  // Reset to first page when search changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Calculate statistics
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === "pending").length,
    accepted: applications.filter(app => app.status === "accepted").length,
    rejected: applications.filter(app => app.status === "rejected").length
  };

  // Application detail modal
  const ApplicationDetailModal = () => {
    if (!selectedApplication) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content application-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Application Details</h3>
            <button onClick={() => setShowDetailModal(false)} className="close-button">
              <FaTimes />
            </button>
          </div>
          
          <div className="modal-body">
            <div className="detail-section">
              <h4><FaBriefcase /> Job Details</h4>
              <p><strong>Job Title:</strong> {selectedApplication.job.title}</p>
              <p><strong>Posted On:</strong> {new Date(selectedApplication.job.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div className="detail-section">
              <h4><FaUser /> Applicant Information</h4>
              <p><strong>Name:</strong> {selectedApplication.applicant ? selectedApplication.applicant.name : "Unknown User"}</p>
              <p><strong>Email:</strong> {selectedApplication.applicant ? selectedApplication.applicant.email : "N/A"}</p>
              <p><strong>Applied On:</strong> {new Date(selectedApplication.createdAt).toLocaleDateString()}</p>
              {selectedApplication.applicant && (
                <button 
                  className="view-profile-button"
                  onClick={() => handleViewProfile(selectedApplication.applicant._id)}
                >
                  <FaUser /> View Applicant Profile
                </button>
              )}
            </div>
            
            <div className="detail-section">
              <h4><FaFileAlt /> Application Details</h4>
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
                <h4><FaFileAlt /> Cover Letter</h4>
                <div className="cover-letter">
                  {selectedApplication.coverLetter}
                </div>
              </div>
            )}
            
            {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
              <div className="detail-section">
                <h4><FaFileAlt /> Attachments</h4>
                <div className="attachments-list">
                  {selectedApplication.attachments.map((attachment, index) => (
                    <a 
                      key={index} 
                      href={attachment.path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="attachment-link"
                    >
                      <FaFileAlt /> {attachment.filename}
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
      
      {/* Stats Dashboard */}
      <div className="applications-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FaFileAlt />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <FaClock />
          </div>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon accepted">
            <FaCheck />
          </div>
          <div className="stat-value">{stats.accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rejected">
            <FaTimes />
          </div>
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="status-filters">
          <button 
            className={`status-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            All
          </button>
          <button 
            className={`status-filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            Pending
          </button>
          <button 
            className={`status-filter-btn ${activeFilter === 'accepted' ? 'active' : ''}`}
            onClick={() => handleFilterChange('accepted')}
          >
            Accepted
          </button>
          <button 
            className={`status-filter-btn ${activeFilter === 'rejected' ? 'active' : ''}`}
            onClick={() => handleFilterChange('rejected')}
          >
            Rejected
          </button>
        </div>
        
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by applicant or job..." 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>
      
      {applications.length === 0 ? (
        <div className="no-applications">
          <FaFileAlt className="no-applications-icon" />
          <p>No applications have been received for your job posts yet.</p>
          <button onClick={() => navigate('/employer/post-job')} className="post-job-btn">
            <FaPlus /> Post a New Job
          </button>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="no-applications">
          <FaFilter className="no-applications-icon" />
          <p>No applications match your current filters.</p>
          <button onClick={() => {setActiveFilter('all'); setSearchTerm('')}} className="post-job-btn">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
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
                {currentApplications.map((application) => (
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
          
          {/* Pagination Controls */}
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {filteredApplications.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredApplications.length)} of {filteredApplications.length} entries
            </div>
            
            <div className="pagination-controls">
              <button 
                className="pagination-button" 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <FaChevronLeft />
              </button>
              
              {paginationRange.map((page, index) => (
                page === '...' ? (
                  <div key={`ellipsis-${index}`} className="pagination-ellipsis">...</div>
                ) : (
                  <button
                    key={index}
                    onClick={() => paginate(page)}
                    className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                )
              ))}
              
              <button 
                className="pagination-button" 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                title="Next Page"
              >
                <FaChevronRight />
              </button>
            </div>
            
            <div className="pagination-options">
              <label htmlFor="items-per-page">Show</label>
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing items per page
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
        </>
      )}
      
      {showDetailModal && <ApplicationDetailModal />}
    </div>
  );
};

export default Applications;
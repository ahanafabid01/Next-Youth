import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./Consultations.css";
import axios from "axios";
import { 
  FaSearch, 
  FaCalendarCheck, 
  FaCalendarAlt, 
  FaCalendarTimes, 
  FaCalendarWeek,
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaEye, 
  FaPencilAlt,
  FaChevronLeft,
  FaChevronRight,
  FaBars,
  FaAngleDown
} from "react-icons/fa";
import { notifyDataUpdate } from './Statistics';
import { dataStore, eventEmitter } from '../../utils/eventEmitter';

const Consultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({ status: "", consultationNotes: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeStatusDropdown, setActiveStatusDropdown] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  
  // Check for saved theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("adminTheme");
    setDarkMode(savedTheme === "dark");
    
    // Listen for theme changes
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("adminTheme") === "dark");
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    fetchConsultations();
    
    // Set up listener for data updates
    const unsubscribe = eventEmitter.on('dataUpdated', ({ type }) => {
      if (type === 'consultations') {
        fetchConsultations();
      }
    });
    
    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (activeStatusDropdown && !e.target.closest('.admin-consult-status-dropdown')) {
        setActiveStatusDropdown(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      unsubscribe();
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeStatusDropdown]);

  // Apply filters whenever consultations, searchTerm or statusFilter changes
  useEffect(() => {
    let result = [...consultations];
    
    // Apply search filter
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.fullName && item.fullName.toLowerCase().includes(lowerCaseSearch)) || 
        (item.email && item.email.toLowerCase().includes(lowerCaseSearch)) ||
        (item.company && item.company.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(item => 
        item.status === statusFilter || 
        (!item.status && statusFilter === "pending")
      );
    }
    
    // Sort by creation date (newest first)
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredConsultations(result);
    
    // Only reset to page 1 if the filter actually changes the results
    // and if we're not already on page 1
    if (result.length !== filteredConsultations.length) {
      setCurrentPage(1);
    }
  }, [consultations, searchTerm, statusFilter]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/contact/all`, {
        withCredentials: true
      });

      if (response.data && response.data.success) {
        const fetchedConsultations = response.data.consultations;
        
        // Convert any null status to 'pending'
        const processedConsultations = fetchedConsultations.map(consultation => ({
          ...consultation,
          status: consultation.status || 'pending'
        }));
        
        setConsultations(processedConsultations);
        dataStore.setConsultations(processedConsultations);
      } else {
        throw new Error(response.data?.message || "Failed to fetch consultations");
      }
    } catch (err) {
      console.error("Error fetching consultations:", err);
      setError(`Failed to load consultations: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredConsultations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);

  // Pagination controls
  const paginate = (pageNumber) => {
    // Stop any potential event bubbling issues
    setCurrentPage(pageNumber);
  };
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  // Function to send status update email notification
  const sendStatusUpdateEmail = async (consultation, status) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/contact/notify`,
        {
          consultationId: consultation._id,
          status,
          recipientEmail: consultation.email,
          recipientName: consultation.fullName,
          preferredDate: consultation.preferredDate,
          preferredTime: consultation.preferredTime,
          serviceType: consultation.serviceType,
          consultationNotes: consultation.consultationNotes || ""
        },
        { withCredentials: true }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to send notification email");
      }
    } catch (err) {
      console.error("Error sending notification email:", err);
    }
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge based on status
  const getStatusBadge = (status, consultationId) => {
    const isActive = activeStatusDropdown === consultationId;
    
    const statusBadge = (
      <div className="admin-consult-status-dropdown" onClick={(e) => {
        e.stopPropagation();
        setActiveStatusDropdown(isActive ? null : consultationId);
      }}>
        {(() => {
          switch (status) {
            case 'confirmed':
              return <span className="admin-consult-status-badge confirmed"><FaCheck /> Confirmed</span>;
            case 'completed':
              return <span className="admin-consult-status-badge completed"><FaCalendarCheck /> Completed</span>;
            case 'cancelled':
              return <span className="admin-consult-status-badge cancelled"><FaTimes /> Cancelled</span>;
            case 'pending':
            default:
              return <span className="admin-consult-status-badge pending"><FaClock /> Pending</span>;
          }
        })()}
        <FaAngleDown className="admin-consult-status-dropdown-icon" />
        
        {isActive && (
          <div className="admin-consult-status-dropdown-menu">
            <button 
              className="admin-consult-status-option pending" 
              onClick={() => handleDirectStatusChange(consultationId, 'pending')}
            >
              <FaClock /> Pending
            </button>
            <button 
              className="admin-consult-status-option confirmed" 
              onClick={() => handleDirectStatusChange(consultationId, 'confirmed')}
            >
              <FaCheck /> Confirmed
            </button>
            <button 
              className="admin-consult-status-option completed" 
              onClick={() => handleDirectStatusChange(consultationId, 'completed')}
            >
              <FaCalendarCheck /> Completed
            </button>
            <button 
              className="admin-consult-status-option cancelled" 
              onClick={() => handleDirectStatusChange(consultationId, 'cancelled')}
            >
              <FaTimes /> Cancelled
            </button>
          </div>
        )}
      </div>
    );
    
    return statusBadge;
  };

  const handleDirectStatusChange = async (consultationId, newStatus) => {
    try {
      const consultation = consultations.find(item => item._id === consultationId);
      const updateData = { 
        status: newStatus,
        consultationNotes: consultation.consultationNotes || ''
      };
      
      const response = await axios.patch(
        `API_BASE_URL/contact/update/${consultationId}`,
        updateData,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the consultation in the state
        const updatedConsultation = { ...consultation, status: newStatus };
        setConsultations(consultations.map(item => 
          item._id === consultationId ? updatedConsultation : item
        ));
        
        // Send notification email about status change
        await sendStatusUpdateEmail(updatedConsultation, newStatus);
        
        // Notify the Statistics component that data has changed
        notifyDataUpdate('consultations');
        
        // Close dropdown
        setActiveStatusDropdown(null);
      } else {
        throw new Error(response.data.message || "Failed to update consultation status");
      }
    } catch (err) {
      console.error("Error updating consultation status:", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  // Get preferred time in readable format
  const getPreferredTime = (timeCode) => {
    switch (timeCode) {
      case 'morning':
        return "Morning (9AM - 12PM)";
      case 'afternoon':
        return "Afternoon (12PM - 3PM)";
      case 'evening':
        return "Evening (3PM - 6PM)";
      default:
        return timeCode || "Not specified";
    }
  };

  // Get service type in readable format
  const getServiceType = (serviceType) => {
    switch (serviceType) {
      case 'enterprise':
        return "Enterprise Solutions";
      case 'smb':
        return "Small & Medium Business";
      case 'freelancers':
        return "Freelancer & Agency";
      case 'custom':
        return "Custom Solutions";
      default:
        return serviceType || "Not specified";
    }
  };

  // Handle opening detail modal
  const openDetailModal = (consultation) => {
    setSelectedConsultation(consultation);
    setShowDetailModal(true);
  };

  // Handle opening update modal
  const openUpdateModal = (consultation) => {
    setSelectedConsultation(consultation);
    setUpdateData({
      status: consultation.status || 'pending',
      consultationNotes: consultation.consultationNotes || ''
    });
    setShowUpdateModal(true);
  };

  // Handle closing modals
  const closeModals = () => {
    setShowDetailModal(false);
    setShowUpdateModal(false);
    setSelectedConsultation(null);
    setUpdateData({ status: "", consultationNotes: "" });
  };

  // Handle update input change
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle submission of update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setActionLoading(true);
      const response = await axios.patch(
        `API_BASE_URL/contact/update/${selectedConsultation._id}`,
        updateData,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update the consultation in the state
        const updatedConsultation = { 
          ...selectedConsultation, 
          ...updateData 
        };
        
        setConsultations(consultations.map(item => 
          item._id === selectedConsultation._id ? updatedConsultation : item
        ));
        
        // If status has changed, send notification email
        if (updatedConsultation.status !== selectedConsultation.status) {
          await sendStatusUpdateEmail(updatedConsultation, updatedConsultation.status);
        }
        
        closeModals();
        
        // Notify the Statistics component that data has changed
        notifyDataUpdate('consultations');
      } else {
        throw new Error(response.data.message || "Failed to update consultation");
      }
    } catch (err) {
      console.error("Error updating consultation:", err);
      alert(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getPendingCount = () => consultations.filter(item => item.status === 'pending' || !item.status).length;
  const getConfirmedCount = () => consultations.filter(item => item.status === 'confirmed').length;
  const getCompletedCount = () => consultations.filter(item => item.status === 'completed').length;
  const getCancelledCount = () => consultations.filter(item => item.status === 'cancelled').length;

  if (loading) {
    return (
      <div className={`admin-consult-container ${darkMode ? 'admin-dash-dark-mode' : ''}`}>
        <Sidebar />
        <div className="admin-consult-main">
          <div className="admin-consult-loading">Loading consultations data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-consult-container ${darkMode ? 'admin-dash-dark-mode' : ''}`}>
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="admin-consult-mobile-header">
        <button 
          className="admin-consult-mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>
        <div className="admin-consult-mobile-title">Consultation Requests</div>
      </div>
      
      <div className="admin-consult-main">
        <div className="admin-consult-header">
          <div className="admin-consult-title">
            <h1>Consultation Requests</h1>
            <p>Manage and track all consultation requests efficiently</p>
          </div>
        </div>
        
        <div className="admin-consult-stats-grid">
          <div className="admin-consult-stat-card">
            <div className="admin-consult-stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="admin-consult-stat-title">Total Consultations</div>
            <div className="admin-consult-stat-value">{consultations.length}</div>
          </div>
          
          <div className="admin-consult-stat-card">
            <div className="admin-consult-stat-icon">
              <FaClock />
            </div>
            <div className="admin-consult-stat-title">Pending</div>
            <div className="admin-consult-stat-value">{getPendingCount()}</div>
          </div>
          
          <div className="admin-consult-stat-card">
            <div className="admin-consult-stat-icon">
              <FaCalendarCheck />
            </div>
            <div className="admin-consult-stat-title">Completed</div>
            <div className="admin-consult-stat-value">{getCompletedCount()}</div>
          </div>
          
          <div className="admin-consult-stat-card">
            <div className="admin-consult-stat-icon">
              <FaCalendarWeek />
            </div>
            <div className="admin-consult-stat-title">Confirmed</div>
            <div className="admin-consult-stat-value">{getConfirmedCount()}</div>
          </div>
        </div>
        
        <div className="admin-consult-table-container">
          <div className="admin-consult-table-header">
            <h2><FaCalendarAlt /> Consultation Management</h2>
            <div className="admin-consult-filters">
              <div className="admin-consult-search">
                <span className="admin-consult-search-icon"><FaSearch /></span>
                <input 
                  type="text" 
                  placeholder="Search by name, email, company..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="admin-consult-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <table className="admin-consult-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Service Type</th>
                <th>Preferred Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map(consultation => (
                  <tr key={consultation._id}>
                    <td>{consultation.fullName || 'N/A'}</td>
                    <td>{consultation.company || 'N/A'}</td>
                    <td>{getServiceType(consultation.serviceType)}</td>
                    <td>{formatDate(consultation.preferredDate)}</td>
                    <td>{getStatusBadge(consultation.status, consultation._id)}</td>
                    <td>
                      <button 
                        className="admin-consult-action-btn view-btn"
                        onClick={() => openDetailModal(consultation)}
                      >
                        <FaEye /> View
                      </button>
                      <button 
                        className="admin-consult-action-btn edit-btn"
                        onClick={() => openUpdateModal(consultation)}
                      >
                        <FaPencilAlt /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="admin-consult-no-data">
                    {error ? error : "No consultation requests match your filters"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          <div className="admin-consult-pagination">
            <div className="admin-consult-pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredConsultations.length)} of {filteredConsultations.length} entries
            </div>
            <div className="admin-consult-pagination-controls">
              <button 
                className="admin-consult-pagination-button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  goToPreviousPage();
                }}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </button>
              
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                
                return (
                  <button 
                    key={pageNum}
                    className={`admin-consult-pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      paginate(pageNum);
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                className="admin-consult-pagination-button"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent event bubbling
                  goToNextPage();
                }}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedConsultation && (
          <div className="admin-consult-modal-overlay">
            <div className="admin-consult-detail-modal">
              <div className="admin-consult-modal-header">
                <h2>Consultation Details</h2>
                <button className="admin-consult-close-modal" onClick={closeModals}>&times;</button>
              </div>
              <div className="admin-consult-modal-content">
                <div className="admin-consult-detail-section">
                  <h3>Personal Information</h3>
                  <div className="admin-consult-detail-grid">
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Full Name</span>
                      <span className="admin-consult-detail-value">{selectedConsultation.fullName || 'N/A'}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Email</span>
                      <span className="admin-consult-detail-value">{selectedConsultation.email || 'N/A'}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Company</span>
                      <span className="admin-consult-detail-value">{selectedConsultation.company || 'N/A'}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Phone</span>
                      <span className="admin-consult-detail-value">{selectedConsultation.phone || 'Not provided'}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-consult-detail-section">
                  <h3>Consultation Information</h3>
                  <div className="admin-consult-detail-grid">
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Business Size</span>
                      <span className="admin-consult-detail-value">{selectedConsultation.businessSize || 'N/A'}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Service Type</span>
                      <span className="admin-consult-detail-value">{getServiceType(selectedConsultation.serviceType)}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Preferred Date</span>
                      <span className="admin-consult-detail-value">{formatDate(selectedConsultation.preferredDate)}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Preferred Time</span>
                      <span className="admin-consult-detail-value">{getPreferredTime(selectedConsultation.preferredTime)}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Status</span>
                      <span className="admin-consult-detail-value">{getStatusBadge(selectedConsultation.status, selectedConsultation._id)}</span>
                    </div>
                    <div className="admin-consult-detail-item">
                      <span className="admin-consult-detail-label">Request Date</span>
                      <span className="admin-consult-detail-value">{formatDate(selectedConsultation.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-consult-detail-section">
                  <h3>Message</h3>
                  <div className="admin-consult-message-content">
                    {selectedConsultation.message || 'No message provided'}
                  </div>
                </div>

                {selectedConsultation.consultationNotes && (
                  <div className="admin-consult-detail-section">
                    <h3>Admin Notes</h3>
                    <div className="admin-consult-note-content">
                      {selectedConsultation.consultationNotes}
                    </div>
                  </div>
                )}
              </div>
              <div className="admin-consult-modal-footer">
                <button 
                  className="admin-consult-modal-btn primary"
                  onClick={() => openUpdateModal(selectedConsultation)}
                >
                  Edit Consultation
                </button>
                <button 
                  className="admin-consult-modal-btn secondary"
                  onClick={closeModals}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Modal */}
        {showUpdateModal && selectedConsultation && (
          <div className="admin-consult-modal-overlay">
            <div className="admin-consult-update-modal">
              <div className="admin-consult-modal-header">
                <h2>Update Consultation</h2>
                <button className="admin-consult-close-modal" onClick={closeModals}>&times;</button>
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <div className="admin-consult-modal-content">
                  <div className="admin-consult-form-group">
                    <label htmlFor="status">Consultation Status</label>
                    <select 
                      id="status" 
                      name="status" 
                      value={updateData.status}
                      onChange={handleUpdateChange}
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="admin-consult-form-group">
                    <label htmlFor="consultationNotes">Admin Notes</label>
                    <textarea 
                      id="consultationNotes" 
                      name="consultationNotes" 
                      value={updateData.consultationNotes}
                      onChange={handleUpdateChange}
                      rows="5"
                      placeholder="Add notes about this consultation (optional)"
                    ></textarea>
                  </div>
                </div>
                <div className="admin-consult-modal-footer">
                  <button 
                    type="submit"
                    className="admin-consult-modal-btn primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button"
                    className="admin-consult-modal-btn secondary"
                    onClick={closeModals}
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultations;
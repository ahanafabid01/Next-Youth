import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaBuilding, FaSearch, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./DemoConsultations.css";

const DemoConsultations = () => {
  const [demoRequests, setDemoRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch demo requests
  useEffect(() => {
    const fetchDemoRequests = async () => {
      try {
        setLoading(true);
        // Corrected endpoint path
        const response = await axios.get("http://localhost:4000/api/contact/requests", {
          withCredentials: true // Cookie-based auth, no token needed
        });
        setDemoRequests(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch demo requests. Please try again.");
        console.error("Error fetching demo requests:", err);
        setLoading(false);
      }
    };

    fetchDemoRequests();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time preference
  const formatTimePreference = (timeSlot) => {
    switch (timeSlot) {
      case "morning":
        return "Morning (9:00 AM - 12:00 PM)";
      case "afternoon":
        return "Afternoon (12:00 PM - 5:00 PM)";
      case "evening":
        return "Evening (5:00 PM - 8:00 PM)";
      default:
        return timeSlot;
    }
  };

  // Function to send status update email notification
  const sendStatusUpdateEmail = async (demo, newStatus) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/contact/notify",
        {
          recipientEmail: demo.email,
          recipientName: demo.fullName,
          status: "confirmed", // Use "confirmed" instead of "scheduled" to match what the server expects
          preferredDate: demo.preferredDate,
          preferredTime: demo.preferredTime,
          serviceType: "demo", // Identify this as a demo request
          consultationNotes: demo.message || ""
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        console.log("Demo status notification email sent successfully");
      } else {
        throw new Error(response.data.message || "Failed to send notification email");
      }
    } catch (err) {
      console.error("Error sending demo status notification email:", err);
      // Don't alert here as it's a secondary action
    }
  };

  // Handle sorting
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort demo requests
  const sortedDemoRequests = [...demoRequests].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Filter and search demo requests
  const filteredDemoRequests = sortedDemoRequests.filter((demo) => {
    const matchesSearch =
      demo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demo.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === "all") return matchesSearch;
    
    // Check if status property exists on the demo object
    return matchesSearch && demo.status === filterStatus;
  });

  // Handle demo status change - update to match backend API
  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.put(
        `http://localhost:4000/api/contact/requests/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      // Find the demo object that was updated
      const updatedDemo = demoRequests.find(demo => demo._id === id);
      
      // Update local state
      setDemoRequests(
        demoRequests.map((demo) =>
          demo._id === id ? { ...demo, status: newStatus } : demo
        )
      );
      
      // Send email notification when status is changed to scheduled (confirmed)
      if (updatedDemo && newStatus === "scheduled") {
        await sendStatusUpdateEmail(updatedDemo, newStatus);
      }
      
      // Close modal if open
      if (showModal) {
        setShowModal(false);
      }
    } catch (err) {
      console.error("Error updating demo status:", err);
      alert("Failed to update demo status. Please try again.");
    }
  };

  // Handle view demo details
  const handleViewDetails = (demo) => {
    setSelectedDemo(demo);
    setShowModal(true);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="page-header">
          <h1>Demo Consultations</h1>
          <div className="header-actions">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search by name, email or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <FaSearch className="search-icon" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading demo requests...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="demo-stats">
              <div className="stat-card">
                <FaCalendarAlt className="stat-icon" />
                <div className="stat-content">
                  <h3>{demoRequests.length}</h3>
                  <p>Total Demo Requests</p>
                </div>
              </div>
              <div className="stat-card">
                <FaBuilding className="stat-icon" />
                <div className="stat-content">
                  <h3>{new Set(demoRequests.map(demo => demo.company)).size}</h3>
                  <p>Unique Companies</p>
                </div>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("createdAt")}>
                      Date Requested
                      {sortConfig.key === "createdAt" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSort("fullName")}>
                      Name
                      {sortConfig.key === "fullName" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSort("company")}>
                      Company
                      {sortConfig.key === "company" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </span>
                      )}
                    </th>
                    <th onClick={() => handleSort("preferredDate")}>
                      Preferred Date
                      {sortConfig.key === "preferredDate" && (
                        <span className="sort-icon">
                          {sortConfig.direction === "asc" ? <FaSortAmountUp /> : <FaSortAmountDown />}
                        </span>
                      )}
                    </th>
                    <th>Time Preference</th>
                    <th>Business Size</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDemoRequests.length > 0 ? (
                    filteredDemoRequests.map((demo) => (
                      <tr key={demo._id}>
                        <td>{formatDate(demo.createdAt)}</td>
                        <td>{demo.fullName}</td>
                        <td>{demo.company}</td>
                        <td>{formatDate(demo.preferredDate)}</td>
                        <td>{formatTimePreference(demo.preferredTime)}</td>
                        <td>{demo.businessSize}</td>
                        <td>
                          <span className={`status-badge ${demo.status || 'pending'}`}>
                            {demo.status ? demo.status.charAt(0).toUpperCase() + demo.status.slice(1) : 'Pending'}
                          </span>
                        </td>
                        <td className="action-buttons">
                          <button
                            className="view-btn"
                            onClick={() => handleViewDetails(demo)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-data">
                        No demo requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Demo Details Modal */}
        {showModal && selectedDemo && (
          <div className="modal-backdrop">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Demo Request Details</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-group">
                  <h3>Contact Information</h3>
                  <div className="detail-row">
                    <span className="detail-label">Full Name:</span>
                    <span className="detail-value">{selectedDemo.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedDemo.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedDemo.phone || "Not provided"}</span>
                  </div>
                </div>
                
                <div className="detail-group">
                  <h3>Company Details</h3>
                  <div className="detail-row">
                    <span className="detail-label">Company Name:</span>
                    <span className="detail-value">{selectedDemo.company}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Business Size:</span>
                    <span className="detail-value">{selectedDemo.businessSize} employees</span>
                  </div>
                </div>
                
                <div className="detail-group">
                  <h3>Demo Preferences</h3>
                  <div className="detail-row">
                    <span className="detail-label">Preferred Date:</span>
                    <span className="detail-value">{formatDate(selectedDemo.preferredDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Preferred Time:</span>
                    <span className="detail-value">{formatTimePreference(selectedDemo.preferredTime)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Service Type:</span>
                    <span className="detail-value">{selectedDemo.serviceType || "Demo"}</span>
                  </div>
                </div>
                
                {selectedDemo.message && (
                  <div className="detail-group">
                    <h3>Additional Message</h3>
                    <div className="message-box">{selectedDemo.message}</div>
                  </div>
                )}
                
                <div className="detail-group">
                  <h3>Status Management</h3>
                  <div className="status-buttons">
                    <button 
                      className="status-btn pending"
                      onClick={() => handleStatusChange(selectedDemo._id, "pending")}
                    >
                      Mark as Pending
                    </button>
                    <button 
                      className="status-btn scheduled"
                      onClick={() => handleStatusChange(selectedDemo._id, "scheduled")}
                    >
                      Mark as Scheduled
                    </button>
                    <button 
                      className="status-btn completed"
                      onClick={() => handleStatusChange(selectedDemo._id, "completed")}
                    >
                      Mark as Completed
                    </button>
                    <button 
                      className="status-btn cancelled"
                      onClick={() => handleStatusChange(selectedDemo._id, "cancelled")}
                    >
                      Cancel Demo
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoConsultations;
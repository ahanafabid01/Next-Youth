import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./AdminDashboard.css";
import "./Consultations.css";
import axios from "axios";
import { FaEdit, FaCheck, FaTimes, FaClock, FaCalendarCheck } from "react-icons/fa";
import { notifyDataUpdate } from './Statistics';

const Consultations = () => {
    const [consultations, setConsultations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedConsultation, setSelectedConsultation] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [updateData, setUpdateData] = useState({ status: "", consultationNotes: "" });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchConsultations();
    }, []);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const response = await axios.get("http://localhost:4000/api/contact/all", {
                withCredentials: true
            });

            if (response.data.success) {
                setConsultations(response.data.consultations);
            } else {
                throw new Error("Failed to fetch consultations");
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching consultations:", err);
            setError(`Failed to load consultations: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    // Function to send status update email notification
    const sendStatusUpdateEmail = async (consultation, status) => {
        try {
            const response = await axios.post(
                "http://localhost:4000/api/contact/notify",
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

            if (response.data.success) {
                console.log("Notification email sent successfully");
            } else {
                throw new Error(response.data.message || "Failed to send notification email");
            }
        } catch (err) {
            console.error("Error sending notification email:", err);
            // We don't alert here as it's a secondary action and shouldn't block the UI
        }
    };

    // Format date to be more readable
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get status badge based on status
    const getStatusBadge = (status) => {
        switch (status) {
            case 'confirmed':
                return <span className="status-badge confirmed"><FaCheck /> Confirmed</span>;
            case 'completed':
                return <span className="status-badge completed"><FaCalendarCheck /> Completed</span>;
            case 'cancelled':
                return <span className="status-badge cancelled"><FaTimes /> Cancelled</span>;
            case 'pending':
            default:
                return <span className="status-badge pending"><FaClock /> Pending</span>;
        }
    };

    // Replace the current handleDirectStatusChange function

    const handleDirectStatusChange = async (consultationId, newStatus) => {
        try {
            const consultation = consultations.find(item => item._id === consultationId);
            const updateData = { 
                status: newStatus,
                consultationNotes: consultation.consultationNotes || ''
            };
            
            const response = await axios.patch(
                `http://localhost:4000/api/contact/update/${consultationId}`,
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
                return timeCode;
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
                return serviceType;
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
                `http://localhost:4000/api/contact/update/${selectedConsultation._id}`,
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
                alert("Consultation updated successfully");
                
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

    if (loading) return <div className="loading">Loading consultations data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="main-content">
                <div className="dashboard-container">
                    <h1>Consultation Requests</h1>
                    <div className="dashboard-stats">
                        <div className="stat-card">
                            <h3>Total Consultations</h3>
                            <p>{consultations.length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Pending</h3>
                            <p>{consultations.filter(item => item.status === 'pending').length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Confirmed</h3>
                            <p>{consultations.filter(item => item.status === 'confirmed').length}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Completed</h3>
                            <p>{consultations.filter(item => item.status === 'completed').length}</p>
                        </div>
                    </div>
                    
                    <div className="consultations-table-container">
                        <h2>Consultation Management ({consultations.length})</h2>
                        <table className="consultations-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Service Type</th>
                                    <th>Preferred Date</th>
                                    <th>Preferred Time</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consultations.length > 0 ? (
                                    consultations.map(consultation => (
                                        <tr key={consultation._id}>
                                            <td>{consultation.fullName}</td>
                                            <td>{consultation.company}</td>
                                            <td>{getServiceType(consultation.serviceType)}</td>
                                            <td>{formatDate(consultation.preferredDate)}</td>
                                            <td>{getPreferredTime(consultation.preferredTime)}</td>
                                            <td>
                                                <div className="status-cell">
                                                    <select 
                                                        value={consultation.status || 'pending'}
                                                        onChange={(e) => handleDirectStatusChange(consultation._id, e.target.value)}
                                                        className="status-select"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="confirmed">Confirmed</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    {getStatusBadge(consultation.status)}
                                                </div>
                                            </td>
                                            <td className="action-buttons-cell">
                                                <button 
                                                    className="action-btn view-btn"
                                                    onClick={() => openDetailModal(consultation)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-data">No consultation requests found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Detail Modal */}
                    {showDetailModal && selectedConsultation && (
                        <div className="modal-overlay">
                            <div className="consultation-detail-modal">
                                <div className="modal-header">
                                    <h2>Consultation Details</h2>
                                    <button className="close-modal" onClick={closeModals}>&times;</button>
                                </div>
                                <div className="modal-content">
                                    <div className="detail-section">
                                        <h3>Personal Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Full Name:</span>
                                                <span className="detail-value">{selectedConsultation.fullName}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Email:</span>
                                                <span className="detail-value">{selectedConsultation.email}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Company:</span>
                                                <span className="detail-value">{selectedConsultation.company}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Phone:</span>
                                                <span className="detail-value">{selectedConsultation.phone || 'Not provided'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Business Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Business Size:</span>
                                                <span className="detail-value">{selectedConsultation.businessSize}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Service Type:</span>
                                                <span className="detail-value">{getServiceType(selectedConsultation.serviceType)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Appointment Details</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="detail-label">Preferred Date:</span>
                                                <span className="detail-value">{formatDate(selectedConsultation.preferredDate)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Preferred Time:</span>
                                                <span className="detail-value">{getPreferredTime(selectedConsultation.preferredTime)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Status:</span>
                                                <span className="detail-value">{getStatusBadge(selectedConsultation.status)}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="detail-label">Request Date:</span>
                                                <span className="detail-value">{formatDate(selectedConsultation.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h3>Message</h3>
                                        <div className="message-content">
                                            {selectedConsultation.message || 'No message provided'}
                                        </div>
                                    </div>

                                    {selectedConsultation.consultationNotes && (
                                        <div className="detail-section">
                                            <h3>Admin Notes</h3>
                                            <div className="note-content">
                                                {selectedConsultation.consultationNotes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button 
                                        className="action-btn close-btn"
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
                        <div className="modal-overlay">
                            <div className="consultation-update-modal">
                                <div className="modal-header">
                                    <h2>Update Consultation</h2>
                                    <button className="close-modal" onClick={closeModals}>&times;</button>
                                </div>
                                <form onSubmit={handleUpdateSubmit}>
                                    <div className="modal-content">
                                        <div className="update-section">
                                            <div className="form-group">
                                                <label htmlFor="status">Status</label>
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

                                            <div className="form-group">
                                                <label htmlFor="consultationNotes">Notes</label>
                                                <textarea 
                                                    id="consultationNotes" 
                                                    name="consultationNotes" 
                                                    value={updateData.consultationNotes}
                                                    onChange={handleUpdateChange}
                                                    rows="5"
                                                    placeholder="Add notes about this consultation"
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button 
                                            type="submit"
                                            className="action-btn save-btn"
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button 
                                            type="button"
                                            className="action-btn cancel-btn"
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
        </div>
    );
};

export default Consultations;
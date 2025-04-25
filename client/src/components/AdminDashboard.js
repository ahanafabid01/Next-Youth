import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import axios from "axios";

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [verificationNote, setVerificationNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("http://localhost:4000/api/auth/admin/users", {
                withCredentials: true
            });
            
            if (response.data && response.data.success) {
                setUsers(response.data.users);
            } else {
                throw new Error(response.data?.message || "Failed to fetch users");
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(`Failed to load users: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        }
    };

    // Function to get verification status badge
    const getVerificationBadge = (status) => {
        if (!status) return <span className="badge pending">Not Submitted</span>;
        
        switch (status) {
            case 'verified':
                return <span className="badge verified">Verified</span>;
            case 'rejected':
                return <span className="badge rejected">Rejected</span>;
            case 'pending':
                return <span className="badge pending">Pending</span>;
            default:
                return <span className="badge pending">Not Submitted</span>;
        }
    };

    // Open modal to view ID images and handle verification
    const openVerificationModal = (user) => {
        setSelectedUser(user);
        setVerificationNote("");
        setShowModal(true);
    };

    // Close the modal
    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    // Handle verification action (approve or reject)
    const handleVerificationAction = async (action) => {
        if (!selectedUser) return;
        
        setActionLoading(true);
        try {
            const response = await axios.post(
                `http://localhost:4000/api/auth/admin/verify-user`,
                {
                    userId: selectedUser._id,
                    status: action,
                    notes: verificationNote
                },
                { withCredentials: true }
            );
            
            if (response.data && response.data.success) {
                // Update the user in the local state
                const updatedUsers = users.map(user => 
                    user._id === selectedUser._id 
                    ? {...user, idVerification: {...user.idVerification, status: action, notes: verificationNote}} 
                    : user
                );
                setUsers(updatedUsers);
                closeModal();
                alert(`User verification ${action === 'verified' ? 'approved' : 'rejected'} successfully!`);
            }
        } catch (err) {
            console.error(`Error ${action} verification:`, err);
            alert(`Failed to ${action === 'verified' ? 'approve' : 'reject'} verification: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading users data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="dashboard-container">
            <h1>Admin Dashboard</h1>
            <div className="dashboard-stats">
                <div className="stat-card">
                    <h3>Total Users</h3>
                    <p>{users.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Verified Users</h3>
                    <p>{users.filter(user => user.idVerification && user.idVerification.status === 'verified').length}</p>
                </div>
                <div className="stat-card">
                    <h3>Pending Verification</h3>
                    <p>{users.filter(user => user.idVerification && user.idVerification.status === 'pending').length}</p>
                </div>
            </div>
            
            <div className="users-table-container">
                <h2>User Management</h2>
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>User Type</th>
                            <th>ID Verification</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phoneNumber || "Not provided"}</td>
                                    <td className="user-type">{user.user_type}</td>
                                    <td>
                                        {getVerificationBadge(user.idVerification?.status)}
                                    </td>
                                    <td>
                                        <button 
                                            className="action-btn view-btn"
                                            onClick={() => window.location.href = `/admin/user/${user._id}`}
                                        >
                                            View
                                        </button>
                                        {user.idVerification?.frontImage && user.idVerification?.backImage && (
                                            <button 
                                                className="action-btn id-btn"
                                                onClick={() => openVerificationModal(user)}
                                            >
                                                Review ID
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-data">No users found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Verification Modal */}
            {showModal && selectedUser && (
                <div className="modal-overlay">
                    <div className="verification-modal">
                        <div className="modal-header">
                            <h2>ID Verification - {selectedUser.name}</h2>
                            <button className="close-modal" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-content">
                            <div className="id-images">
                                <div className="id-image-container">
                                    <h3>Front of ID</h3>
                                    <img 
                                        src={selectedUser.idVerification.frontImage} 
                                        alt="Front of ID" 
                                        className="id-image" 
                                    />
                                </div>
                                <div className="id-image-container">
                                    <h3>Back of ID</h3>
                                    <img 
                                        src={selectedUser.idVerification.backImage} 
                                        alt="Back of ID" 
                                        className="id-image" 
                                    />
                                </div>
                            </div>
                            
                            <div className="verification-actions">
                                <div className="verification-notes">
                                    <label htmlFor="verificationNote">Admin Notes:</label>
                                    <textarea 
                                        id="verificationNote"
                                        value={verificationNote}
                                        onChange={(e) => setVerificationNote(e.target.value)}
                                        placeholder="Add notes about this verification (optional)"
                                        rows={3}
                                    />
                                </div>
                                
                                <div className="action-buttons">
                                    <button 
                                        className="action-btn reject-btn"
                                        onClick={() => handleVerificationAction('rejected')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : 'Reject Verification'}
                                    </button>
                                    <button 
                                        className="action-btn approve-btn"
                                        onClick={() => handleVerificationAction('verified')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Processing...' : 'Approve Verification'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
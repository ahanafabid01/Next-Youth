import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { FaUsers, FaCheckCircle, FaIdCard, FaSearch, FaArrowLeft, FaArrowRight, FaUserAltSlash, FaFilter, FaSortAlphaDown, FaSortAlphaUp } from "react-icons/fa";
import "./Users.css";
import axios from "axios";
import { notifyDataUpdate } from './Statistics';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [verificationNote, setVerificationNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem("adminTheme") === "dark");
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(8);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterType, setFilterType] = useState("all");
    const [sortDirection, setSortDirection] = useState("desc"); // desc = newest first

    // Listen for theme changes
    useEffect(() => {
        const handleStorageChange = () => {
            setDarkMode(localStorage.getItem("adminTheme") === "dark");
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        applyFiltersAndSearch();
    }, [users, searchQuery, filterStatus, filterType, sortDirection]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
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

    const applyFiltersAndSearch = () => {
        let result = [...users];

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(user => 
                (user.name && user.name.toLowerCase().includes(query)) || 
                (user.email && user.email.toLowerCase().includes(query)) ||
                (user.phoneNumber && user.phoneNumber.toLowerCase().includes(query))
            );
        }

        // Apply verification status filter
        if (filterStatus !== "all") {
            result = result.filter(user => {
                if (filterStatus === "verified") {
                    return user.idVerification?.status === "verified";
                } else if (filterStatus === "pending") {
                    return user.idVerification?.status === "pending";
                } else if (filterStatus === "rejected") {
                    return user.idVerification?.status === "rejected";
                } else if (filterStatus === "notsubmitted") {
                    return !user.idVerification || !user.idVerification.status;
                }
                return true;
            });
        }

        // Apply user type filter
        if (filterType !== "all") {
            result = result.filter(user => user.user_type === filterType);
        }

        // Apply sorting
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime() || 0;
            const dateB = new Date(b.createdAt).getTime() || 0;
            return sortDirection === "desc" ? dateB - dateA : dateA - dateB;
        });

        setFilteredUsers(result);
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Function to get verification status badge
    const getVerificationBadge = (status) => {
        if (!status) return <span className="user-badge user-pending">Not Submitted</span>;
        
        switch (status) {
            case 'verified':
                return <span className="user-badge user-verified">Verified</span>;
            case 'rejected':
                return <span className="user-badge user-rejected">Rejected</span>;
            case 'pending':
                return <span className="user-badge user-pending">Pending</span>;
            default:
                return <span className="user-badge user-pending">Not Submitted</span>;
        }
    };

    // Open modal to view ID images and handle verification
    const openVerificationModal = (user) => {
        setSelectedUser(user);
        setVerificationNote(user.idVerification?.notes || "");
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
                notifyDataUpdate('users');
            }
        } catch (err) {
            console.error(`Error ${action} verification:`, err);
            alert(`Failed to ${action === 'verified' ? 'approve' : 'reject'} verification: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    // Handle user deletion
    const handleDeleteUser = async (userId) => {
        try {
            if (!userId) {
                alert('Error: User ID is missing');
                return;
            }
            
            setActionLoading(true);
            const response = await axios.delete(`http://localhost:4000/api/auth/delete-user/${userId}`, {
                withCredentials: true
            });
            
            if (response.data && response.data.success) {
                setUsers(users.filter(user => user._id !== userId));
                setShowDeleteModal(false);
                setUserToDelete(null);
                alert('User deleted successfully!');
                notifyDataUpdate('users');
            }
        } catch (err) {
            console.error("Error deleting user:", err);
            alert(`Failed to delete user: ${err.response?.data?.message || err.message}`);
        } finally {
            setActionLoading(false);
            setShowDeleteModal(false);
        }
    };

    // Helper function to check if user registered within last 24 hours
    const isNewUser = (date) => {
        const userDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - userDate);
        const diffHours = diffTime / (1000 * 60 * 60);
        return diffHours < 24;
    };
    
    // Calculate pagination info
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const nextPage = () => setCurrentPage(prev => prev < totalPages ? prev + 1 : prev);
    const prevPage = () => setCurrentPage(prev => prev > 1 ? prev - 1 : prev);

    if (loading) return (
        <div className={`user-container ${darkMode ? 'user-dark-mode' : ''}`}>
            <Sidebar />
            <div className="user-main">
                <div className="user-loading">
                    <div className="user-loading-spinner"></div>
                    <p>Loading users data...</p>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className={`user-container ${darkMode ? 'user-dark-mode' : ''}`}>
            <Sidebar />
            <div className="user-main">
                <div className="user-error">
                    <FaUserAltSlash size={48} />
                    <p>{error}</p>
                    <button className="user-btn user-primary" onClick={fetchUsers}>Try Again</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className={`user-container ${darkMode ? 'user-dark-mode' : ''}`}>
            <Sidebar />
            
            {/* Mobile Header */}
            <div className="user-mobile-header">
                <img 
                    src={darkMode ? logoDark : logoLight}
                    alt="NextYouth Admin" 
                    className="user-mobile-logo"
                />
            </div>
            
            <div className="user-main">
                <div className="user-header">
                    <div className="user-title-section">
                        <h1>User Management</h1>
                        <p>Manage, verify and monitor user accounts</p>
                    </div>
                </div>
                
                <div className="user-stats-section">
                    <div className="user-stat-card">
                        <div className="user-stat-icon">
                            <FaUsers />
                        </div>
                        <div className="user-stat-info">
                            <span className="user-stat-label">Total Users</span>
                            <span className="user-stat-value">{users.length}</span>
                        </div>
                    </div>
                    
                    <div className="user-stat-card">
                        <div className="user-stat-icon">
                            <FaCheckCircle />
                        </div>
                        <div className="user-stat-info">
                            <span className="user-stat-label">Verified Users</span>
                            <span className="user-stat-value">
                                {users.filter(user => user.idVerification?.status === 'verified').length}
                            </span>
                        </div>
                    </div>
                    
                    <div className="user-stat-card">
                        <div className="user-stat-icon">
                            <FaIdCard />
                        </div>
                        <div className="user-stat-info">
                            <span className="user-stat-label">Pending Verification</span>
                            <span className="user-stat-value">
                                {users.filter(user => user.idVerification?.status === 'pending').length}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="user-controls">
                    <div className="user-search">
                        <FaSearch className="user-search-icon" />
                        <input
                            type="text"
                            placeholder="Search users by name, email or phone..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="user-search-input"
                        />
                    </div>
                    
                    <div className="user-filters">
                        <div className="user-filter-group">
                            <label>Verification:</label>
                            <select 
                                value={filterStatus} 
                                onChange={e => setFilterStatus(e.target.value)}
                                className="user-select"
                            >
                                <option value="all">All Status</option>
                                <option value="verified">Verified</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Rejected</option>
                                <option value="notsubmitted">Not Submitted</option>
                            </select>
                        </div>
                        
                        <div className="user-filter-group">
                            <label>User Type:</label>
                            <select 
                                value={filterType}
                                onChange={e => setFilterType(e.target.value)}
                                className="user-select"
                            >
                                <option value="all">All Types</option>
                                <option value="student">Student</option>
                                <option value="professional">Professional</option>
                                <option value="company">Company</option>
                            </select>
                        </div>
                        
                        <button 
                            className="user-sort-btn"
                            onClick={() => setSortDirection(prev => prev === "desc" ? "asc" : "desc")}
                            title={sortDirection === "desc" ? "Newest first" : "Oldest first"}
                        >
                            {sortDirection === "desc" ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                            {sortDirection === "desc" ? " Newest" : " Oldest"}
                        </button>
                    </div>
                </div>
                
                <div className="user-table-container">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th className="user-hide-mobile">Phone</th>
                                <th className="user-hide-tablet">User Type</th>
                                <th>Verification</th>
                                <th className="user-hide-mobile">Joined Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentUsers.length > 0 ? (
                                currentUsers.map(user => (
                                    <tr key={user._id} className={isNewUser(user.createdAt) ? "user-new-row" : ""}>
                                        <td className="user-name-cell">
                                            {user.name}
                                            {isNewUser(user.createdAt) && <span className="user-new-badge">New</span>}
                                        </td>
                                        <td className="user-email-cell">{user.email}</td>
                                        <td className="user-hide-mobile">{user.phoneNumber || "Not provided"}</td>
                                        <td className={`user-type-cell user-hide-tablet user-type-${user.user_type}`}>
                                            {user.user_type}
                                        </td>
                                        <td>{getVerificationBadge(user.idVerification?.status)}</td>
                                        <td className="user-hide-mobile">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="user-actions">
                                            {user.idVerification?.frontImage && user.idVerification?.backImage && (
                                                <button 
                                                    className="user-btn user-review-btn"
                                                    onClick={() => openVerificationModal(user)}
                                                    title="Review ID Verification"
                                                >
                                                    <FaIdCard />
                                                </button>
                                            )}
                                            <button 
                                                className="user-btn user-delete-btn"
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setShowDeleteModal(true);
                                                }}
                                                title="Delete User"
                                            >
                                                <FaUserAltSlash />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="user-no-data">
                                        <div className="user-no-data-content">
                                            <FaSearch size={24} />
                                            <p>No users match your current filters</p>
                                            <button 
                                                className="user-btn user-primary" 
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setFilterStatus("all");
                                                    setFilterType("all");
                                                }}
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {filteredUsers.length > 0 && (
                    <div className="user-pagination">
                        <div className="user-pagination-info">
                            Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                        </div>
                        <div className="user-pagination-controls">
                            <button 
                                onClick={prevPage} 
                                disabled={currentPage === 1}
                                className="user-pagination-btn"
                            >
                                <FaArrowLeft />
                            </button>
                            
                            <div className="user-pagination-pages">
                                {totalPages <= 5 ? (
                                    Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => paginate(i + 1)}
                                            className={`user-pagination-btn ${currentPage === i + 1 ? 'user-active' : ''}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))
                                ) : (
                                    <>
                                        {currentPage > 2 && (
                                            <button
                                                onClick={() => paginate(1)}
                                                className="user-pagination-btn"
                                            >
                                                1
                                            </button>
                                        )}
                                        
                                        {currentPage > 3 && <span className="user-pagination-ellipsis">...</span>}
                                        
                                        {Array.from({ length: 3 }, (_, i) => {
                                            let pageNum = currentPage;
                                            if (currentPage === 1) {
                                                pageNum = i + 1;
                                            } else if (currentPage === totalPages) {
                                                pageNum = totalPages - 2 + i;
                                            } else {
                                                pageNum = currentPage - 1 + i;
                                            }
                                            
                                            if (pageNum > 0 && pageNum <= totalPages) {
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => paginate(pageNum)}
                                                        className={`user-pagination-btn ${currentPage === pageNum ? 'user-active' : ''}`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            }
                                            return null;
                                        })}
                                        
                                        {currentPage < totalPages - 2 && <span className="user-pagination-ellipsis">...</span>}
                                        
                                        {currentPage < totalPages - 1 && (
                                            <button
                                                onClick={() => paginate(totalPages)}
                                                className="user-pagination-btn"
                                            >
                                                {totalPages}
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                            
                            <button 
                                onClick={nextPage} 
                                disabled={currentPage === totalPages}
                                className="user-pagination-btn"
                            >
                                <FaArrowRight />
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Verification Modal */}
                {showModal && selectedUser && (
                    <div className="user-modal-overlay">
                        <div className="user-modal">
                            <div className="user-modal-header">
                                <h2>ID Verification - {selectedUser.name}</h2>
                                <button className="user-modal-close" onClick={closeModal}>&times;</button>
                            </div>
                            <div className="user-modal-content">
                                <div className="user-id-images">
                                    <div className="user-id-image-container">
                                        <h3>Front of ID</h3>
                                        <img 
                                            src={selectedUser.idVerification.frontImage} 
                                            alt="Front of ID" 
                                            className="user-id-image" 
                                        />
                                    </div>
                                    <div className="user-id-image-container">
                                        <h3>Back of ID</h3>
                                        <img 
                                            src={selectedUser.idVerification.backImage} 
                                            alt="Back of ID" 
                                            className="user-id-image" 
                                        />
                                    </div>
                                </div>
                                
                                <div className="user-verification-actions">
                                    <div className="user-verification-notes">
                                        <label htmlFor="verificationNote">Admin Notes:</label>
                                        <textarea 
                                            id="verificationNote"
                                            value={verificationNote}
                                            onChange={(e) => setVerificationNote(e.target.value)}
                                            placeholder="Add notes about this verification (optional)"
                                            rows={3}
                                        />
                                    </div>
                                    
                                    <div className="user-action-buttons">
                                        <button 
                                            className="user-btn user-reject-btn"
                                            onClick={() => handleVerificationAction('rejected')}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Processing...' : 'Reject Verification'}
                                        </button>
                                        <button 
                                            className="user-btn user-approve-btn"
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

                {/* Delete Confirmation Modal */}
                {showDeleteModal && userToDelete && (
                    <div className="user-modal-overlay">
                        <div className="user-modal user-delete-modal">
                            <div className="user-modal-header">
                                <h2>Confirm Delete</h2>
                                <button 
                                    className="user-modal-close"
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setUserToDelete(null);
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="user-modal-content">
                                <div className="user-delete-warning">
                                    <FaUserAltSlash size={48} />
                                    <p>Are you sure you want to delete user <strong>{userToDelete.name}</strong>?</p>
                                    <p className="user-warning-text">This action cannot be undone!</p>
                                </div>
                                <div className="user-action-buttons">
                                    <button 
                                        className="user-btn user-cancel-btn"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setUserToDelete(null);
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="user-btn user-confirm-delete-btn"
                                        onClick={() => handleDeleteUser(userToDelete._id)}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Deleting...' : 'Delete User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Users;
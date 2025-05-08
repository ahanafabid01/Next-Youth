import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserCircle, FaCreditCard, FaUserCog, FaMoneyBill, 
         FaLock, FaEnvelope, FaUser, FaCog, FaChevronRight, FaKey, FaUserEdit } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('user-settings');
    const [user, setUser] = useState({
        name: '',
        email: '',
        phoneNumber: null, // Change to null
        address: null,     // Change to null
        country: null      // Change to null
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [activeSubsection, setActiveSubsection] = useState('');
    const [showEditForm, setShowEditForm] = useState(false);
    const [editData, setEditData] = useState({
        name: '',
        email: '', // Add email field
        phoneNumber: '',
        address: '',
        country: ''
    });
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');

    const API_BASE_URL = 'http://localhost:4000/api';

    const fetchUserData = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true });
            if (response.data.success) {
                const userData = response.data.user;
                console.log('Raw user data from DB:', userData); // Debug log

                // Ensure empty strings are treated as null for consistency
                const processedData = {
                    name: userData.name || '',
                    email: userData.email || '',
                    phoneNumber: userData.phoneNumber || null,
                    address: userData.address || null,
                    country: userData.country || null,
                };

                console.log('Processed user data:', processedData); // Debug log
                setUser(processedData);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        }
    }, [API_BASE_URL, navigate]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData, showEditForm, updateSuccess]); // Add updateSuccess as dependency

    useEffect(() => {
        if (showEditForm) {
            setEditData({
                name: user.name || '',
                email: user.email || '', // Add email
                phoneNumber: user.phoneNumber || '',
                address: user.address || '',
                country: user.country || ''
            });
        }
    }, [showEditForm, user]);

    useEffect(() => {
        console.log('Current user state:', user); // Debug log
    }, [user]);

    useEffect(() => {
        console.log('Current editData state:', editData); // Debug log
    }, [editData]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        // Validate passwords
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError('Password must be at least 8 characters long');
            return;
        }

        try {
            const response = await axios.put(
                `${API_BASE_URL}/auth/change-password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                setPasswordSuccess('Password changed successfully! Please use your new password next time you login.');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setTimeout(() => {
                    setShowPasswordForm(false);
                    setPasswordSuccess('');
                    // Optionally log out the user
                    // navigate('/login');
                }, 3000);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to change password';
            setPasswordError(errorMessage);
            console.error('Password change error:', error);
        }
    };

    const handleContactUpdate = async (e) => {
        e.preventDefault();
        setUpdateError('');
        setUpdateSuccess('');

        try {
            console.log('Sending update with data:', editData);

            const response = await axios.put(
                `${API_BASE_URL}/auth/update-employee-profile`,
                editData,
                { withCredentials: true }
            );

            if (response.data.success) {
                console.log('Server response:', response.data); // Debug log

                const updatedUser = response.data.user;
                console.log('Updated user data:', updatedUser); // Debug log

                // Update the user state with the updated data
                setUser({
                    name: updatedUser.name || '',
                    email: updatedUser.email || '',
                    phoneNumber: updatedUser.phoneNumber || null,
                    address: updatedUser.address || null,
                    country: updatedUser.country || null,
                });

                setUpdateSuccess('Contact information updated successfully!');
                setTimeout(() => {
                    setShowEditForm(false);
                    setUpdateSuccess('');
                }, 2000);
            }
        } catch (error) {
            console.error('Error updating contact information:', error);
            setUpdateError(error.response?.data?.message || 'Failed to update contact information');
        }
    };

    const settingsSections = [
        {
            id: 'user-settings',
            title: 'User Settings',
            icon: <FaUserCog />,
            subsections: [
                { id: 'contact-info', title: 'Contact Information', icon: <FaEnvelope /> },
                { 
                    id: 'my-profile', 
                    title: 'My Profile', 
                    icon: <FaUser />,
                    onClick: () => navigate('/my-profile')
                },
                { id: 'profile-settings', title: 'Profile Settings', icon: <FaCog /> }
            ]
        },
        {
            id: 'billing',
            title: 'Billing & Payments',
            icon: <FaCreditCard />,
            subsections: [
                { id: 'payment-methods', title: 'Payment Methods' },
                { id: 'billing-history', title: 'Billing History' },
                { id: 'subscriptions', title: 'Subscriptions' }
            ]
        },
        {
            id: 'get-paid',
            title: 'Get Paid',
            icon: <FaMoneyBill />,
            subsections: [
                { id: 'payment-settings', title: 'Payment Settings' },
                { id: 'bank-accounts', title: 'Bank Accounts' },
                { id: 'tax-information', title: 'Tax Information' }
            ]
        },
        {
            id: 'security',
            title: 'Password & Security',
            icon: <FaLock />,
            subsections: [
                { 
                    id: 'password', 
                    title: 'Change Password',
                    icon: <FaKey />,
                    onClick: () => setShowPasswordForm(true)
                }
            ]
        }
    ];

    return (
        <div className="settings-page">
            <header className="settings-header">
                <div className="header-content">
                    <Link to="/" className="logo">Next Youth</Link>
                    <div className="user-info">
                        <FaUserCircle className="profile-icon" />
                        <span>{user.name}</span>
                    </div>
                </div>
            </header>

            <div className="settings-container">
                <aside className="settings-sidebar">
                    {settingsSections.map((section) => (
                        <div key={section.id} className="sidebar-section">
                            <button
                                className={`section-button ${activeSection === section.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <span className="section-icon">{section.icon}</span>
                                <span className="section-title">{section.title}</span>
                                <FaChevronRight className="chevron-icon" />
                            </button>
                            {activeSection === section.id && (
                                <div className="subsections">
                                    {section.subsections.map((subsection) => (
                                        // Update the subsection button onClick handler
                                        <button
                                            key={subsection.id}
                                            className="subsection-button"
                                            onClick={() => {
                                                if (subsection.onClick) {
                                                    subsection.onClick();
                                                } else {
                                                    setActiveSection(section.id);
                                                    setActiveSubsection(subsection.id);
                                                }
                                            }}
                                        >
                                            {subsection.icon && <span className="subsection-icon">{subsection.icon}</span>}
                                            <span>{subsection.title}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </aside>

                <main className="settings-content">
                    <div className="content-header">
                        <h1>{settingsSections.find(s => s.id === activeSection)?.title}</h1>
                    </div>
                    <div className="content-body">
                        {activeSection === 'user-settings' && activeSubsection === 'contact-info' && (
                            <div className="contact-info-container">
                                <div className="info-section">
                                    <div className="section-header">
                                        <h3>Contact Information</h3>
                                        <p className="section-description">
                                            Your contact details are used for communication and account purposes.
                                        </p>
                                    </div>
                                    
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <label>Full Name</label>
                                            <div className="info-value">
                                                {user.name || 'Not provided'}
                                            </div>
                                        </div>
                                        
                                        <div className="info-item">
                                            <label>Email Address</label>
                                            <div className="info-value">
                                                {user.email || 'Not provided'}
                                            </div>
                                        </div>
                                        
                                        <div className="info-item">
                                            <label>Phone Number</label>
                                            <div className="info-value">
                                                {user.phoneNumber ? user.phoneNumber : 'Not provided'}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <label>Address</label>
                                            <div className="info-value">
                                                {user.address ? user.address : 'Not provided'}
                                            </div>
                                        </div>

                                        <div className="info-item">
                                            <label>Country</label>
                                            <div className="info-value">
                                                {user.country ? user.country : 'Not provided'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="edit-section">
                                        <button 
                                            className="edit-button"
                                            onClick={async () => {
                                                // Fetch latest data before showing edit form
                                                await fetchUserData();
                                                setEditData({
                                                    name: user.name || '',
                                                    email: user.email || '', // Add email
                                                    phoneNumber: user.phoneNumber || '',
                                                    address: user.address || '',
                                                    country: user.country || ''
                                                });
                                                setShowEditForm(true);
                                            }}
                                        >
                                            <FaUserEdit /> Edit Contact Information
                                        </button>
                                    </div>

                                    <div className="danger-zone">
                                        <h4>Danger Zone</h4>
                                        <p className="danger-description">
                                            Once you delete your account, there is no going back. Please be certain.
                                        </p>
                                        <button 
                                            className="delete-account-button"
                                            onClick={() => {
                                                const confirmDelete = window.confirm(
                                                    "Are you sure you want to close your account? This action cannot be undone."
                                                );
                                                if (confirmDelete) {
                                                    // Add account deletion logic here
                                                    axios.delete(`${API_BASE_URL}/auth/delete-account`, {
                                                        withCredentials: true
                                                    })
                                                    .then(response => {
                                                        if (response.data.success) {
                                                            navigate('/login');
                                                        }
                                                    })
                                                    .catch(error => {
                                                        console.error('Error deleting account:', error);
                                                        alert('Failed to delete account. Please try again.');
                                                    });
                                                }
                                            }}
                                        >
                                            Close Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {showEditForm && (
                            <div className="edit-form-overlay">
                                <div className="edit-form-container">
                                    <h2>Edit Contact Information</h2>
                                    <p className="form-description">
                                        Update your contact details below.
                                    </p>
                                    {updateError && (
                                        <div className="error-message">{updateError}</div>
                                    )}
                                    {updateSuccess && (
                                        <div className="success-message">{updateSuccess}</div>
                                    )}
                                    <form onSubmit={handleContactUpdate}>
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <input
                                                type="text"
                                                value={editData.name}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    name: e.target.value
                                                })}
                                                placeholder="Enter your full name"
                                                className="styled-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    email: e.target.value
                                                })}
                                                placeholder="Enter your email address"
                                                className="styled-input"
                                                required
                                            />
                                            <small className="input-helper">This will be used for account login and communications</small>
                                        </div>
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={editData.phoneNumber}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    phoneNumber: e.target.value
                                                })}
                                                placeholder="Enter your phone number"
                                                className="styled-input"
                                            />
                                            <small className="input-helper">Include your country code for international numbers</small>
                                        </div>
                                        <div className="form-group">
                                            <label>Address</label>
                                            <input
                                                type="text"
                                                value={editData.address}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    address: e.target.value
                                                })}
                                                placeholder="Enter your full address"
                                                className="styled-input"
                                            />
                                            <small className="input-helper">Your current residential or business address</small>
                                        </div>
                                        <div className="form-group">
                                            <label>Country</label>
                                            <input
                                                type="text"
                                                value={editData.country}
                                                onChange={(e) => setEditData({
                                                    ...editData,
                                                    country: e.target.value
                                                })}
                                                placeholder="Enter your country of residence"
                                                className="styled-input"
                                            />
                                            <small className="input-helper">The country where you currently reside</small>
                                        </div>
                                        <div className="form-actions">
                                            <button 
                                                type="button" 
                                                className="cancel-button"
                                                onClick={() => {
                                                    setShowEditForm(false);
                                                    setUpdateError('');
                                                    setUpdateSuccess('');
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="submit-button"
                                            >
                                                Update Information
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        {showPasswordForm && (
                            <div className="password-form-overlay">
                                <div className="password-form-container">
                                    <h2>Change Password</h2>
                                    <p className="form-description">
                                        To change your password, please enter your current password followed by your new password.
                                    </p>
                                    {passwordError && (
                                        <div className="error-message">{passwordError}</div>
                                    )}
                                    {passwordSuccess && (
                                        <div className="success-message">{passwordSuccess}</div>
                                    )}
                                    <form onSubmit={handlePasswordChange}>
                                        <div className="form-group">
                                            <label>Current Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.currentPassword}
                                                onChange={(e) => setPasswordData({
                                                    ...passwordData,
                                                    currentPassword: e.target.value
                                                })}
                                                placeholder="Enter your current password"
                                                required
                                            />
                                            <small className="input-helper">Enter your existing password to verify your identity</small>
                                        </div>
                                        <div className="form-group">
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({
                                                    ...passwordData,
                                                    newPassword: e.target.value
                                                })}
                                                placeholder="Enter your new password"
                                                required
                                            />
                                            <small className="input-helper">Password must be at least 8 characters long</small>
                                        </div>
                                        <div className="form-group">
                                            <label>Confirm New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({
                                                    ...passwordData,
                                                    confirmPassword: e.target.value
                                                })}
                                                placeholder="Confirm your new password"
                                                required
                                            />
                                            <small className="input-helper">Re-enter your new password to confirm</small>
                                        </div>
                                        <div className="form-actions">
                                            <button 
                                                type="button" 
                                                className="cancel-button"
                                                onClick={() => {
                                                    setShowPasswordForm(false);
                                                    setPasswordError('');
                                                    setPasswordSuccess('');
                                                    setPasswordData({
                                                        currentPassword: '',
                                                        newPassword: '',
                                                        confirmPassword: ''
                                                    });
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="submit-button"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
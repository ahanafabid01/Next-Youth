import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaUserShield, FaSave, FaTrash, FaArrowLeft, FaBell, 
  FaUserEdit, FaLock, FaShieldAlt, FaSun, FaMoon, 
  FaExclamationTriangle, FaCheck, FaSpinner, FaCog,
  FaCreditCard // Add this import
} from 'react-icons/fa';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';
import './Settings.css';
import EmployeePayment from './EmployeePayment'; // Add this import

const Settings = () => {
  const navigate = useNavigate();
  const API_BASE_URL = 'API_BASE_URL';

  // State for theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });

  // State for active tab
  const [activeTab, setActiveTab] = useState('account');

  // User profile state
  const [user, setUser] = useState({
    name: '',
    email: '',
    profilePicture: '',
    phoneNumber: ''
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailJobAlerts: true,
    emailMessages: true,
    emailMarketing: false,
    appJobAlerts: true,
    appMessages: true,
    appUpdates: true
  });

  // State for loading, errors, and success messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Apply theme class
  useEffect(() => {
    const settingsElement = document.querySelector('.employee-settings-container');
    if (settingsElement) {
      settingsElement.classList.toggle('employee-settings-dark-mode', isDarkMode);
    }
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Fetch user profile data
  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, { 
        withCredentials: true 
      });
      
      // Log the entire response for debugging
      console.log("API Response:", response.data);
      
      if (response.data.success) {
        const userData = response.data.user;
        
        // Log the specific fields we're trying to extract
        console.log("User data fields:", {
          name: userData.name,
          email: userData.email,
          profilePic: userData.profilePic,
          profilePicture: userData.profilePicture,
          phone: userData.phone,
          phoneNumber: userData.phoneNumber
        });

        // Get complete profile with all fields
        const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
          withCredentials: true
        });

        console.log("Complete profile response:", profileResponse.data);
        
        if (profileResponse.data.success) {
          const completeUserData = profileResponse.data.user;
          
          // Set the user state with all available data
          setUser({
            name: userData.name || '',
            email: userData.email || '',
            profilePicture: userData.profilePicture || userData.profilePic || '',
            // Make sure to get phoneNumber from the complete profile data
            phoneNumber: completeUserData.phoneNumber || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error fetching user data'
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle dark/light theme
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Handle change for user profile fields
  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password field changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle notification setting toggles
  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Modify the saveProfileChanges function to handle both field names for better compatibility
  const saveProfileChanges = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    console.log("Updating profile with data:", {
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePicture: user.profilePicture
    });
    
    try {
      // First try updateEmployeeProfile endpoint which handles phone number correctly
      const response = await axios.put(
        `${API_BASE_URL}/auth/update-employee-profile`,
        {
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          profilePicture: user.profilePicture
        }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        await fetchUserData();
        setMessage({ type: 'success', text: 'Profile updated successfully' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error updating profile'
      });
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    
    setLoading(true);
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
        setMessage({ type: 'success', text: 'Password changed successfully' });
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error changing password'
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const deleteAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/delete-my-account`, 
        { password: deletePassword }, 
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Account deleted successfully' });
        // Navigate to login page after a delay
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error deleting account'
      });
    } finally {
      setLoading(false);
    }
  };

  // Save notification settings
  const saveNotificationSettings = () => {
    // This would typically call an API endpoint to save notification preferences
    // Since we don't have a specific endpoint for this, we'll just show a success message
    setMessage({ type: 'success', text: 'Notification preferences updated' });
  };

  // Message component for displaying success/error messages
  const MessageComponent = ({ message }) => {
    if (!message.text) return null;
    
    return (
      <div className={`employee-settings-message ${message.type === 'error' ? 'employee-settings-error' : 'employee-settings-success'}`}>
        {message.type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
        <p>{message.text}</p>
      </div>
    );
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a valid image file (JPEG or PNG)' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage({ type: 'error', text: 'Image file size should be less than 5MB' });
      return;
    }
    
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file); // Changed from 'profilePicture' to 'file' to match server expectation
      
      // Upload the file first
      const uploadResponse = await axios.post(`${API_BASE_URL}/auth/upload-profile-picture`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.data.success) {
        // Update state with new picture URL
        const profilePictureUrl = uploadResponse.data.url || uploadResponse.data.profilePictureUrl;
        
        setUser(prev => ({
          ...prev,
          profilePicture: profilePictureUrl
        }));
        
        // Now explicitly update the user profile with the new picture URL
        await axios.put(
          `${API_BASE_URL}/auth/update-profile`,
          {
            profilePicture: profilePictureUrl,
            // Include other necessary fields if required by your API
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber
          }, 
          { withCredentials: true }
        );
        
        setMessage({ type: 'success', text: 'Profile picture updated successfully' });
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Error updating profile picture'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-settings-container">
      {/* Header */}
      <header className="employee-settings-header">
        <div className="employee-settings-header-container">
          <div className="employee-settings-header-left">
            <Link to="/employee-dashboard" className="employee-settings-back-button">
              <FaArrowLeft /> Back to Dashboard
            </Link>
            <div className="employee-settings-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-settings-logo-image"
              />
            </div>
          </div>
          
          <div className="employee-settings-header-right">
            <button
              className="employee-settings-theme-toggle"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>
          </div>
        </div>
      </header>

      <div className="employee-settings-main">
        <div className="employee-settings-title">
          <h1>Account Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>

        {/* Settings navigation */}
        <div className="employee-settings-navigation">
          <button 
            className={`employee-settings-nav-button ${activeTab === 'account' ? 'active' : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <FaUserEdit />
            <span>Account</span>
          </button>
          <button 
            className={`employee-settings-nav-button ${activeTab === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveTab('payment')}
          >
            <FaCreditCard />
            <span>Payment & Billing</span>
          </button>
          <button 
            className={`employee-settings-nav-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FaLock />
            <span>Password & Security</span>
          </button>
          <button 
            className={`employee-settings-nav-button ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell />
            <span>Notifications</span>
          </button>
          <button 
            className={`employee-settings-nav-button ${activeTab === 'danger' ? 'active' : ''}`}
            onClick={() => setActiveTab('danger')}
          >
            <FaShieldAlt />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Settings content area */}
        <div className="employee-settings-content">
          <MessageComponent message={message} />
          
          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="employee-settings-panel">
              <h2>Contact Info</h2>
              <p className="employee-settings-description">
                Update your personal information and how it appears on your profile
              </p>
              
              <form className="employee-settings-form" onSubmit={saveProfileChanges}>
                <div className="employee-settings-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    value={user.name || ''}
                    onChange={handleUserChange}
                    placeholder="Your full name"
                  />
                </div>
                
                <div className="employee-settings-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={user.email || ''}
                    onChange={handleUserChange}
                    placeholder="Your email address"
                  />
                </div>
                
                <div className="employee-settings-form-group">
                  <label htmlFor="phoneNumber">Phone Number</label>
                  <input 
                    type="tel" 
                    id="phoneNumber" 
                    name="phoneNumber" 
                    value={user.phoneNumber || ''}
                    onChange={handleUserChange}
                    placeholder="Your phone number"
                  />
                </div>
                
                <div className="employee-settings-form-group">
                  <label htmlFor="profilePictureUpload">Profile Picture</label>
                  <div className="employee-settings-profile-upload">
                    {user.profilePicture && (
                      <div className="employee-settings-profile-preview">
                        <img src={user.profilePicture} alt="Profile Preview" />
                      </div>
                    )}
                    <div className="employee-settings-upload-controls">
                      <input 
                        type="file" 
                        id="profilePictureUpload" 
                        name="profilePictureUpload" 
                        onChange={handleProfilePictureUpload}
                        accept="image/jpeg, image/png, image/jpg"
                        className="employee-settings-file-input"
                      />
                      <label htmlFor="profilePictureUpload" className="employee-settings-upload-button">
                        {user.profilePicture ? "Change Picture" : "Upload Picture"}
                      </label>
                      <p className="employee-settings-help-text">
                        For best results, use an image of at least 400x400 pixels (JPEG or PNG)
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="employee-settings-form-actions">
                  <button 
                    type="submit" 
                    className="employee-settings-save-button"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="employee-settings-spinner" /> : <FaSave />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Payment & Billing Tab */}
          {activeTab === 'payment' && (
            <div className="employee-settings-panel">
              <h2>Payment & Billing</h2>
              <p className="employee-settings-description">
                Manage your payment methods and view your payment history
              </p>
              
              <EmployeePayment />
            </div>
          )}
          
          {/* Password & Security Tab */}
          {activeTab === 'security' && (
            <div className="employee-settings-panel">
              <h2>Password & Security</h2>
              <p className="employee-settings-description">
                Update your password and manage security settings
              </p>
              
              <form className="employee-settings-form" onSubmit={changePassword}>
                <div className="employee-settings-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input 
                    type="password" 
                    id="currentPassword" 
                    name="currentPassword" 
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    required
                  />
                </div>
                
                <div className="employee-settings-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    name="newPassword" 
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    required
                    minLength={8}
                  />
                  <p className="employee-settings-help-text">
                    Password must be at least 8 characters long
                  </p>
                </div>
                
                <div className="employee-settings-form-group">
                  <label htmlFor="confirmNewPassword">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="confirmNewPassword" 
                    name="confirmNewPassword" 
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                
                <div className="employee-settings-form-actions">
                  <button 
                    type="submit" 
                    className="employee-settings-save-button"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="employee-settings-spinner" /> : <FaLock />}
                    Change Password
                  </button>
                </div>
              </form>
              
              <div className="employee-settings-section">
                <h3>Two-Factor Authentication</h3>
                <p className="employee-settings-description">
                  Add an extra layer of security to your account
                </p>
                
                <div className="employee-settings-action-card">
                  <div className="employee-settings-action-content">
                    <FaUserShield className="employee-settings-action-icon" />
                    <div>
                      <h4>Two-Factor Authentication</h4>
                      <p>Protect your account by requiring a second form of verification when signing in</p>
                    </div>
                  </div>
                  <button className="employee-settings-action-button">
                    Enable
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="employee-settings-panel">
              <h2>Notification Preferences</h2>
              <p className="employee-settings-description">
                Control how you receive notifications and updates
              </p>
              
              <div className="employee-settings-section">
                <h3>Email Notifications</h3>
                
                <div className="employee-settings-toggle-group">
                  <div className="employee-settings-toggle-item">
                    <div>
                      <h4>Job Alerts</h4>
                      <p>Receive emails about new job opportunities matching your skills</p>
                    </div>
                    <label className="employee-settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.emailJobAlerts}
                        onChange={() => handleNotificationChange('emailJobAlerts')}
                      />
                      <span className="employee-settings-slider"></span>
                    </label>
                  </div>
                  
                  <div className="employee-settings-toggle-item">
                    <div>
                      <h4>Messages</h4>
                      <p>Receive emails about new messages from employers</p>
                    </div>
                    <label className="employee-settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.emailMessages}
                        onChange={() => handleNotificationChange('emailMessages')}
                      />
                      <span className="employee-settings-slider"></span>
                    </label>
                  </div>
                  
                  <div className="employee-settings-toggle-item">
                    <div>
                      <h4>Marketing</h4>
                      <p>Receive emails about platform updates, tips, and promotions</p>
                    </div>
                    <label className="employee-settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.emailMarketing}
                        onChange={() => handleNotificationChange('emailMarketing')}
                      />
                      <span className="employee-settings-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="employee-settings-section">
                <h3>In-App Notifications</h3>
                
                <div className="employee-settings-toggle-group">
                  <div className="employee-settings-toggle-item">
                    <div>
                      <h4>Job Alerts</h4>
                      <p>Receive in-app notifications about new job opportunities</p>
                    </div>
                    <label className="employee-settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.appJobAlerts}
                        onChange={() => handleNotificationChange('appJobAlerts')}
                      />
                      <span className="employee-settings-slider"></span>
                    </label>
                  </div>
                  
                  <div className="employee-settings-toggle-item">
                    <div>
                      <h4>Messages</h4>
                      <p>Receive in-app notifications about new messages</p>
                    </div>
                    <label className="employee-settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.appMessages}
                        onChange={() => handleNotificationChange('appMessages')}
                      />
                      <span className="employee-settings-slider"></span>
                    </label>
                  </div>
                  
                  <div className="employee-settings-toggle-item">
                    <div>
                      <h4>Platform Updates</h4>
                      <p>Receive in-app notifications about platform updates and tips</p>
                    </div>
                    <label className="employee-settings-switch">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.appUpdates}
                        onChange={() => handleNotificationChange('appUpdates')}
                      />
                      <span className="employee-settings-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="employee-settings-form-actions">
                <button 
                  className="employee-settings-save-button"
                  onClick={saveNotificationSettings}
                >
                  <FaSave />
                  Save Preferences
                </button>
              </div>
            </div>
          )}
          
          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="employee-settings-panel">
              <h2>Danger Zone</h2>
              <p className="employee-settings-description">
                Actions in this section can permanently affect your account
              </p>
              
              <div className="employee-settings-danger-zone">
                <div className="employee-settings-danger-card">
                  <div className="employee-settings-danger-content">
                    <FaTrash className="employee-settings-danger-icon" />
                    <div>
                      <h3>Delete Your Account</h3>
                      <p>This will permanently delete your account, all of your data, and remove access to all services.</p>
                    </div>
                  </div>
                  
                  {!deleteConfirm ? (
                    <button 
                      className="employee-settings-danger-button"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="employee-settings-delete-confirm">
                      <p>Please enter your password to confirm deletion:</p>
                      <form onSubmit={deleteAccount} className="employee-settings-delete-form">
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                        <div className="employee-settings-delete-actions">
                          <button 
                            type="button" 
                            className="employee-settings-cancel-button"
                            onClick={() => {
                              setDeleteConfirm(false);
                              setDeletePassword('');
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="employee-settings-confirm-delete"
                            disabled={loading}
                          >
                            {loading ? <FaSpinner className="employee-settings-spinner" /> : "Confirm Delete"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="employee-settings-footer">
        <div className="employee-settings-footer-container">
          <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
          <div className="employee-settings-footer-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/help">Help Center</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Settings;
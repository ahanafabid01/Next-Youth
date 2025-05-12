import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaUser,
  FaLock,
  FaBell,
  FaShieldAlt,
  FaSave,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaSpinner
} from "react-icons/fa";
import "./EmployerSettings.css";

const EmployerSettings = () => {
  // User profile state
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    country: ""
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    marketingEmails: false,
    systemAnnouncements: true
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showContactInfo: true
  });

  // UI states
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get("API_BASE_URL/auth/me", { 
          withCredentials: true 
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          setProfile({
            name: userData.name || "",
            email: userData.email || "",
            phoneNumber: userData.phoneNumber || "",
            country: userData.country || ""
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load your profile information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
    
    // Clear specific error when user is typing
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: null
      });
    }
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications({ ...notifications, [name]: checked });
  };

  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings({ 
      ...privacySettings, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await axios.put(
        "API_BASE_URL/auth/update-profile",
        profile,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }
    
    try {
      setSaving(true);
      const response = await axios.put(
        "API_BASE_URL/auth/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success("Password updated successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response?.status === 400) {
        setPasswordErrors({
          ...passwordErrors,
          currentPassword: "Current password is incorrect"
        });
      } else {
        toast.error("Failed to update password. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = () => {
    setSaving(true);
    // Simulate API call - would connect to a real endpoint in production
    setTimeout(() => {
      toast.success("Notification preferences saved");
      setSaving(false);
    }, 800);
  };

  const savePrivacySettings = () => {
    setSaving(true);
    // Simulate API call - would connect to a real endpoint in production
    setTimeout(() => {
      toast.success("Privacy settings updated");
      setSaving(false);
    }, 800);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      setDeleteError("Please enter your password");
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post(
        "API_BASE_URL/auth/delete-my-account",
        { password: deletePassword },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Clear any cookies/tokens
        await axios.post("API_BASE_URL/auth/logout", {}, 
          { withCredentials: true }
        );
        
        toast.success("Account deleted successfully");
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      if (error.response?.status === 401) {
        setDeleteError("Incorrect password");
      } else {
        setDeleteError(
          error.response?.data?.message || "Failed to delete account. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <form onSubmit={updateProfile} className="settings-form">
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  placeholder="Your full name"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">@</span>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder="Your email address"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={profile.phoneNumber}
                  onChange={handleProfileChange}
                  placeholder="Phone number (optional)"
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <select
                  name="country"
                  value={profile.country}
                  onChange={handleProfileChange}
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? <FaSpinner className="spinner" /> : <FaSave />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );
      
      case "password":
        return (
          <form onSubmit={changePassword} className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-input-container">
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                  />
                </div>
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <div className="error-message">{passwordErrors.currentPassword}</div>
              )}
            </div>
            
            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-container">
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              {passwordErrors.newPassword && (
                <div className="error-message">{passwordErrors.newPassword}</div>
              )}
            </div>
            
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-input-container">
                <div className="input-with-icon">
                  <FaLock className="input-icon" />
                  <input
                    type={passwordVisible ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              {passwordErrors.confirmPassword && (
                <div className="error-message">{passwordErrors.confirmPassword}</div>
              )}
            </div>
            
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordData.newPassword.length >= 8 ? "met" : ""}>
                  <FaCheck /> Minimum 8 characters
                </li>
                <li className={/[A-Z]/.test(passwordData.newPassword) ? "met" : ""}>
                  <FaCheck /> At least one uppercase letter
                </li>
                <li className={/[0-9]/.test(passwordData.newPassword) ? "met" : ""}>
                  <FaCheck /> At least one number
                </li>
                <li className={/[!@#$%^&*]/.test(passwordData.newPassword) ? "met" : ""}>
                  <FaCheck /> At least one special character (!@#$%^&*)
                </li>
              </ul>
            </div>
            
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? <FaSpinner className="spinner" /> : <FaLock />}
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        );
      
      case "notifications":
        return (
          <form onSubmit={(e) => { e.preventDefault(); saveNotificationSettings(); }} className="settings-form">
            <div className="notification-options">
              <div className="notification-option">
                <div>
                  <h4>Email Notifications</h4>
                  <p>Receive email notifications about account activity</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={notifications.emailNotifications}
                    onChange={handleNotificationChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="notification-option">
                <div>
                  <h4>Application Updates</h4>
                  <p>Get notified when candidates apply to your jobs</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="applicationUpdates"
                    checked={notifications.applicationUpdates}
                    onChange={handleNotificationChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="notification-option">
                <div>
                  <h4>Marketing Emails</h4>
                  <p>Receive newsletters and promotional content</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="marketingEmails"
                    checked={notifications.marketingEmails}
                    onChange={handleNotificationChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="notification-option">
                <div>
                  <h4>System Announcements</h4>
                  <p>Important updates about the platform</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    name="systemAnnouncements"
                    checked={notifications.systemAnnouncements}
                    onChange={handleNotificationChange}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? <FaSpinner className="spinner" /> : <FaBell />}
              {saving ? "Saving..." : "Save Preferences"}
            </button>
          </form>
        );
      
      case "privacy":
        return (
          <form onSubmit={(e) => { e.preventDefault(); savePrivacySettings(); }} className="settings-form">
            <div className="privacy-section">
              <div className="form-group">
                <label>Profile Visibility</label>
                <div className="radio-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="public"
                      checked={privacySettings.profileVisibility === "public"}
                      onChange={handlePrivacyChange}
                    />
                    <div className="radio-content">
                      <h4>Public</h4>
                      <p>Everyone can see your profile</p>
                    </div>
                  </label>
                  
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="limited"
                      checked={privacySettings.profileVisibility === "limited"}
                      onChange={handlePrivacyChange}
                    />
                    <div className="radio-content">
                      <h4>Limited</h4>
                      <p>Only registered users can see your profile</p>
                    </div>
                  </label>
                  
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="profileVisibility"
                      value="private"
                      checked={privacySettings.profileVisibility === "private"}
                      onChange={handlePrivacyChange}
                    />
                    <div className="radio-content">
                      <h4>Private</h4>
                      <p>Only users you've matched with can see your profile</p>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Contact Information</label>
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="showContactInfo"
                    checked={privacySettings.showContactInfo}
                    onChange={handlePrivacyChange}
                  />
                  <span className="checkmark"></span>
                  <span>Show my contact information to applicants who I've accepted</span>
                </label>
              </div>
            </div>
            
            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-action">
                <div>
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all data. This action cannot be undone.</p>
                </div>
                <button 
                  type="button" 
                  className="danger-button"
                  onClick={handleDeleteAccount}
                >
                  <FaExclamationTriangle /> Delete Account
                </button>
              </div>
            </div>
            
            <button type="submit" className="save-button" disabled={saving}>
              {saving ? <FaSpinner className="spinner" /> : <FaShieldAlt />}
              {saving ? "Saving..." : "Save Privacy Settings"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <FaSpinner className="spinner" />
        <p>Loading your settings...</p>
      </div>
    );
  }

  return (
    <div className="employer-settings-component">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your account settings and preferences</p>
        </div>
        
        <div className="settings-content">
          <div className="settings-tabs">
            <button
              className={activeTab === "account" ? "active" : ""}
              onClick={() => setActiveTab("account")}
            >
              <FaUser />
              <span>Account</span>
            </button>
            <button
              className={activeTab === "password" ? "active" : ""}
              onClick={() => setActiveTab("password")}
            >
              <FaLock />
              <span>Password</span>
            </button>
            <button
              className={activeTab === "notifications" ? "active" : ""}
              onClick={() => setActiveTab("notifications")}
            >
              <FaBell />
              <span>Notifications</span>
            </button>
            <button
              className={activeTab === "privacy" ? "active" : ""}
              onClick={() => setActiveTab("privacy")}
            >
              <FaShieldAlt />
              <span>Privacy & Security</span>
            </button>
          </div>
          
          <div className="settings-tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <h3>Delete Account Confirmation</h3>
            <p>This action cannot be undone. All your data including job postings and applications will be permanently deleted.</p>
            
            <div className="delete-password-form">
              <label>Please enter your password to confirm:</label>
              <input 
                type="password" 
                value={deletePassword} 
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your current password"
              />
              {deleteError && <div className="error-message">{deleteError}</div>}
            </div>
            
            <div className="delete-confirmation-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-delete-button"
                disabled={!deletePassword || saving}
                onClick={handleConfirmDelete}
              >
                {saving ? <FaSpinner className="spinner" /> : <FaExclamationTriangle />}
                {saving ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerSettings;
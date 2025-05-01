import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendar, 
  FaLinkedin, 
  FaInfoCircle, 
  FaEdit, 
  FaSave,
  FaCamera,
  FaChevronLeft,
  FaExclamationCircle
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        profilePicture: "",
        dateOfBirth: "",
        linkedInId: "",
        otherInfo: "",
    });
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get("http://localhost:4000/api/auth/me", { 
                    withCredentials: true 
                });
                if (response.data.success) {
                    setProfile({
                        name: response.data.user.name || "",
                        email: response.data.user.email || "",
                        profilePicture: response.data.user.profilePicture || "",
                        dateOfBirth: response.data.user.dateOfBirth || "",
                        linkedInId: response.data.user.linkedInId || "",
                        otherInfo: response.data.user.otherInfo || "",
                    });
                }
                setError(null);
            } catch (error) {
                console.error("Error fetching user profile:", error);
                setError("Failed to load profile. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    useEffect(() => {
        // Calculate profile completeness
        const requiredFields = ['name', 'email', 'profilePicture', 'dateOfBirth', 'linkedInId', 'otherInfo'];
        const filledFields = requiredFields.filter(field => profile[field] && profile[field].trim() !== '').length;
        setProgress((filledFields / requiredFields.length) * 100);
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            
            // Create a preview of the selected image
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            let profilePictureUrl = profile.profilePicture;
            
            if (profilePictureFile) {
                const formData = new FormData();
                formData.append("file", profilePictureFile);

                const uploadResponse = await axios.post(
                    "http://localhost:4000/api/auth/upload-profile-picture",
                    formData,
                    { withCredentials: true }
                );

                if (uploadResponse.data.success) {
                    profilePictureUrl = uploadResponse.data.url;
                }
            }

            const updatedProfile = { 
                ...profile, 
                profilePicture: profilePictureUrl 
            };
            
            const response = await axios.put(
                "http://localhost:4000/api/auth/profile",
                updatedProfile,
                { withCredentials: true }
            );

            if (response.data.success) {
                setProfile(response.data.user);
                setIsEditing(false);
                setPreviewImage(null);
                setError(null);
                
                // Show success message
                const successMessage = document.createElement('div');
                successMessage.className = 'success-toast';
                successMessage.textContent = 'Profile updated successfully!';
                document.body.appendChild(successMessage);
                
                setTimeout(() => {
                    document.body.removeChild(successMessage);
                }, 3000);
            }
        } catch (error) {
            console.error("Error saving profile:", error.response?.data || error.message);
            setError("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getProgressColor = () => {
        if (progress < 30) return '#e74c3c';
        if (progress < 70) return '#f39c12';
        return '#27ae60';
    };

    if (loading && !profile.name) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-component-root">
            <div className="profile-container">
                {error && (
                    <div className="error-banner">
                        <FaExclamationCircle /> {error}
                        <button onClick={() => setError(null)} className="close-error">×</button>
                    </div>
                )}

                <div className="profile-header">
                    <h1><FaUser className="header-icon" /> My Profile</h1>
                    <div className="progress-container">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ 
                                    width: `${progress}%`,
                                    backgroundColor: getProgressColor()
                                }}
                            ></div>
                        </div>
                        <span className="progress-text">{Math.round(progress)}% Profile Complete</span>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="profile-view">
                        <div className="profile-card">
                        {/* In the profile-card-header div */}
                            <div className="profile-card-header">
                                <h2>Personal Information</h2>
                                <button 
                                    className="edit-btn" 
                                    onClick={() => setIsEditing(true)}
                                    aria-label="Edit profile"
                                >
                                    <FaEdit /> <span className="btn-text">Edit Profile</span>
                                </button>

                            </div>

                            <div className="profile-content">
                                <div className="avatar-section">
                                    <div className="avatar-container">
                                        <img 
                                            src={profile.profilePicture || "https://via.placeholder.com/160x160?text=User"} 
                                            alt={profile.name || "Profile"} 
                                            className="profile-avatar"
                                            onError={(e) => {
                                                console.log("Image failed to load:", e.target.src);
                                                e.target.src = "https://via.placeholder.com/160x160?text=User";
                                                e.target.onerror = null; // Prevent infinite loop if placeholder fails
                                            }}
                                        />
                                    </div>
                                    <h3 className="profile-name">{profile.name}</h3>
                                    <button 
                                        className="edit-profile-btn" 
                                        onClick={() => setIsEditing(true)}
                                        aria-label="Edit profile"
            >
                                        <FaEdit /> <span className="btn-text">Edit Profile</span>
                                    </button>
                                </div>
                            
                                <div className="profile-info">
                                    <div className="info-item">
                                        <FaEnvelope className="info-icon" />
                                        <div className="info-content">
                                            <span className="info-label">Email</span>
                                            <span className="info-value">{profile.email}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <FaCalendar className="info-icon" />
                                        <div className="info-content">
                                            <span className="info-label">Date of Birth</span>
                                            <span className="info-value">
                                                {profile.dateOfBirth || "Not specified"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <FaLinkedin className="info-icon" />
                                        <div className="info-content">
                                            <span className="info-label">LinkedIn</span>
                                            <span className="info-value">
                                                {profile.linkedInId ? (
                                                    <a href={profile.linkedInId.startsWith('http') ? profile.linkedInId : `https://${profile.linkedInId}`} 
                                                       target="_blank" 
                                                       rel="noopener noreferrer"
                                                       className="linkedin-link">
                                                        View Profile
                                                    </a>
                                                ) : (
                                                    "Not linked"
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item bio-item">
                                        <FaInfoCircle className="info-icon" />
                                        <div className="info-content">
                                            <span className="info-label">About Me</span>
                                            <p className="info-bio">
                                                {profile.otherInfo || "No bio added yet. Tell us about yourself!"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="profile-edit">
                        <form className="edit-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-header">
                                <button 
                                    type="button" 
                                    className="back-btn" 
                                    onClick={() => setIsEditing(false)}
                                    aria-label="Cancel editing"
                                >
                                    <FaChevronLeft /> <span>Back</span>
                                </button>
                                <h2>Edit Profile</h2>
                            </div>

                            <div className="avatar-edit-section">
                                <div className="avatar-upload">
                                    <img 
                                        src={previewImage || profile.profilePicture || "https://via.placeholder.com/140x140?text=User"} 
                                        alt="Profile Preview" 
                                        className="avatar-preview"
                                        onError={(e) => {
                                            console.log("Preview image failed to load:", e.target.src);
                                            e.target.src = "https://via.placeholder.com/140x140?text=User";
                                            e.target.onerror = null;
                                        }}
                                    />
                                    <label htmlFor="profile-pic" className="avatar-edit-btn">
                                        <FaCamera /> <span className="sr-only">Change Photo</span>
                                    </label>
                                    <input 
                                        type="file" 
                                        id="profile-pic" 
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        className="avatar-input"
                                    />
                                </div>
                                <p className="avatar-hint">Click on the camera icon to change your profile picture</p>
                            </div>

                            <div className="form-section">
                                <h3><FaUser className="section-icon" /> Basic Information</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="name"><FaUser /> Full Name</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email"><FaEnvelope /> Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={profile.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="dateOfBirth"><FaCalendar /> Date of Birth</label>
                                        <input
                                            type="date"
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            value={profile.dateOfBirth}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><FaLinkedin className="section-icon" /> Social Links</h3>
                                <div className="form-group">
                                    <label htmlFor="linkedInId"><FaLinkedin /> LinkedIn Profile</label>
                                    <input
                                        type="text"
                                        id="linkedInId"
                                        name="linkedInId"
                                        value={profile.linkedInId}
                                        onChange={handleInputChange}
                                        placeholder="https://linkedin.com/in/username"
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <h3><FaInfoCircle className="section-icon" /> About You</h3>
                                <div className="form-group">
                                    <label htmlFor="otherInfo"><FaInfoCircle /> Bio</label>
                                    <textarea
                                        id="otherInfo"
                                        name="otherInfo"
                                        value={profile.otherInfo}
                                        onChange={handleInputChange}
                                        placeholder="Tell us about yourself..."
                                        rows="4"
                                    ></textarea>
                                    <small className="text-helper">Share your skills, experience, or interests. This helps others get to know you better.</small>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button 
                                    type="button" 
                                    className="save-btn" 
                                    onClick={handleSaveProfile}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="button-spinner"></div>
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaSave /> <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setPreviewImage(null);
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
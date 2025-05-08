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
  FaExclamationCircle,
  FaShieldAlt,
  FaCheck,
  FaHourglassHalf
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
    const [verificationStatus, setVerificationStatus] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                const [profileResponse, verificationResponse] = await Promise.all([
                    axios.get("http://localhost:4000/api/auth/me", { withCredentials: true }),
                    axios.get("http://localhost:4000/api/auth/verification-status", { withCredentials: true })
                ]);
                
                if (profileResponse.data.success) {
                    setProfile({
                        name: profileResponse.data.user.name || "",
                        email: profileResponse.data.user.email || "",
                        profilePicture: profileResponse.data.user.profilePicture || "",
                        dateOfBirth: profileResponse.data.user.dateOfBirth || "",
                        linkedInId: profileResponse.data.user.linkedInId || "",
                        otherInfo: profileResponse.data.user.otherInfo || "",
                    });
                }
                
                if (verificationResponse.data.success) {
                    setVerificationStatus(verificationResponse.data.verification?.status || null);
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
                setProfilePictureFile(null);
                setError(null);
                
                // Create success toast
                const successToast = document.createElement('div');
                successToast.className = 'success-toast';
                const checkIcon = document.createElement('span');
                checkIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
                const message = document.createTextNode('Profile updated successfully!');
                successToast.appendChild(checkIcon);
                successToast.appendChild(message);
                document.body.appendChild(successToast);
                
                setTimeout(() => {
                    if (document.body.contains(successToast)) {
                        document.body.removeChild(successToast);
                    }
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
        if (progress < 70) return '#f59e0b';
        return '#10b981';
    };

    const handleNavigateToVerification = () => {
        navigate('/employer-verification');
    };
    
    const formatDate = (dateString) => {
        if (!dateString) return "Not specified";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (error) {
            return dateString;
        }
    };

    if (loading && !profile.name) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-component-root">
            <div className="profile-container">
                {error && (
                    <div className="error-banner">
                        <FaExclamationCircle /> {error}
                        <button onClick={() => setError(null)} className="close-error" aria-label="Close error message">×</button>
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
                                role="progressbar"
                                aria-valuenow={Math.round(progress)}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            ></div>
                        </div>
                        <span className="progress-text">{Math.round(progress)}% Profile Complete</span>
                    </div>
                </div>

                {!isEditing ? (
                    <div className="profile-view">
                        <div className="profile-card">
                            <div className="profile-card-header">
                                <h2>Personal Information</h2>
                            </div>

                            <div className="profile-content">
                                <div className="avatar-section">
                                    <div className="avatar-container">
                                        <img 
                                            src={profile.profilePicture || "https://via.placeholder.com/160x160?text=User"} 
                                            alt={profile.name || "Profile"} 
                                            className="profile-avatar"
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/160x160?text=User";
                                                e.target.onerror = null;
                                            }}
                                        />
                                    </div>
                                    <h3 className="profile-name">{profile.name || "Your Name"}</h3>
                                    
                                    {verificationStatus === 'verified' ? (
                                        <div className="verification-badge verified">
                                            <FaCheck /> Verified Account
                                        </div>
                                    ) : verificationStatus === 'pending' ? (
                                        <div className="verification-badge pending">
                                            <FaHourglassHalf /> Verification Pending
                                        </div>
                                    ) : (
                                        <button 
                                            className="verify-account-btn" 
                                            onClick={handleNavigateToVerification}
                                        >
                                            <FaShieldAlt /> Verify Your Account
                                        </button>
                                    )}
                                    
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
                                            <span className="info-label">Email Address</span>
                                            <span className="info-value">{profile.email || "Not specified"}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <FaCalendar className="info-icon" />
                                        <div className="info-content">
                                            <span className="info-label">Date of Birth</span>
                                            <span className="info-value">{formatDate(profile.dateOfBirth)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="info-item">
                                        <FaLinkedin className="info-icon" />
                                        <div className="info-content">
                                            <span className="info-label">LinkedIn Profile</span>
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
                                            <span className="info-label">About</span>
                                            <p className="info-bio">
                                                {profile.otherInfo || "No information added yet. Tell potential candidates about yourself or your company!"}
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
                                    onClick={() => {
                                        setIsEditing(false);
                                        setPreviewImage(null);
                                        setProfilePictureFile(null);
                                    }}
                                    aria-label="Cancel editing"
                                >
                                    <FaChevronLeft /> <span>Back</span>
                                </button>
                                <h2>Edit Your Profile</h2>
                            </div>

                            <div className="avatar-edit-section">
                                <div className="avatar-upload">
                                    <img 
                                        src={previewImage || profile.profilePicture || "https://via.placeholder.com/140x140?text=User"} 
                                        alt="Profile Preview" 
                                        className="avatar-preview"
                                        onError={(e) => {
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
                                <p className="avatar-hint">Click the camera icon to upload a new profile picture</p>
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
                                <h3><FaLinkedin className="section-icon" /> Professional Presence</h3>
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
                                    <small className="text-helper">Adding your LinkedIn profile helps build trust with candidates</small>
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
                                        placeholder="Share information about yourself or your company..."
                                        rows="4"
                                    ></textarea>
                                    <small className="text-helper">Tell candidates about your company culture, values, and what makes you unique</small>
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
                                        setProfilePictureFile(null);
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
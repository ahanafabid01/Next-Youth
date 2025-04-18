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
  FaArrowLeft
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

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/auth/me", { 
                    withCredentials: true 
                });
                if (response.data.success) {
                    setProfile({
                        name: response.data.user.name,
                        email: response.data.user.email,
                        profilePicture: response.data.user.profilePicture || "",
                        dateOfBirth: response.data.user.dateOfBirth || "",
                        linkedInId: response.data.user.linkedInId || "",
                        otherInfo: response.data.user.otherInfo || "",
                    });
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };

        fetchUserProfile();
    }, []);

    useEffect(() => {
        const totalFields = Object.keys(profile).length;
        const filledFields = Object.values(profile).filter(field => field).length;
        setProgress((filledFields / totalFields) * 100);
    }, [profile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile({ ...profile, [name]: value });
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        setProfilePictureFile(file);
    };

    const handleSaveProfile = async () => {
        try {
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
                alert("Profile updated successfully!");
                setProfile(response.data.user);
                setIsEditing(false);
            }
        } catch (error) {
            console.error("Error saving profile:", error.response?.data || error.message);
            alert("Failed to update profile. Please try again.");
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                
                <h1><FaUser className="header-icon" /> My Profile</h1>
                <div className="progress-container">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-text">{Math.round(progress)}% Profile Complete</span>
                </div>
            </div>

            {!isEditing ? (
                <div className="profile-view">
                    <div className="profile-card">
                        <div className="avatar-container">
                            <img 
                                src={profile.profilePicture || "/default-avatar.png"} 
                                alt="Profile" 
                                className="profile-avatar"
                            />
                            <div className="avatar-overlay">
                                <FaEdit className="edit-icon" />
                            </div>
                        </div>
                        
                        <div className="profile-info">
                            <div className="info-item">
                                <FaUser className="info-icon" />
                                <span className="info-label">Name:</span>
                                <span className="info-value">{profile.name}</span>
                            </div>
                            <div className="info-item">
                                <FaEnvelope className="info-icon" />
                                <span className="info-label">Email:</span>
                                <span className="info-value">{profile.email}</span>
                            </div>
                            <div className="info-item">
                                <FaCalendar className="info-icon" />
                                <span className="info-label">Date of Birth:</span>
                                <span className="info-value">
                                    {profile.dateOfBirth || "Not specified"}
                                </span>
                            </div>
                            <div className="info-item">
                                <FaLinkedin className="info-icon" />
                                <span className="info-label">LinkedIn:</span>
                                <span className="info-value">
                                    {profile.linkedInId || "Not linked"}
                                </span>
                            </div>
                            <div className="info-item">
                                <FaInfoCircle className="info-icon" />
                                <span className="info-label">Bio:</span>
                                <p className="info-bio">
                                    {profile.otherInfo || "No bio added"}
                                </p>
                            </div>
                        </div>
                        
                        <button 
                            className="edit-btn" 
                            onClick={() => setIsEditing(true)}
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    </div>
                </div>
            ) : (
                <div className="profile-edit">
                    <form className="edit-form">
                        <div className="form-section">
                            <h2><FaUser /> Basic Information</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label><FaUser /> Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleInputChange}
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="form-group">
                                    <label><FaEnvelope /> Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleInputChange}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label><FaCalendar /> Date of Birth</label>
                                    <input
                                        type="date"
                                        name="dateOfBirth"
                                        value={profile.dateOfBirth}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-section">
                            <h2><FaLinkedin /> Social Links</h2>
                            <div className="form-group">
                                <label><FaLinkedin /> LinkedIn Profile</label>
                                <input
                                    type="text"
                                    name="linkedInId"
                                    value={profile.linkedInId}
                                    onChange={handleInputChange}
                                    placeholder="https://linkedin.com/in/username"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h2><FaInfoCircle /> About You</h2>
                            <div className="form-group">
                                <label><FaInfoCircle /> Profile Picture</label>
                                <div className="file-upload">
                                    <input 
                                        type="file" 
                                        onChange={handleProfilePictureChange} 
                                        id="profile-pic"
                                    />
                                    <label htmlFor="profile-pic" className="upload-btn">
                                        Choose File
                                    </label>
                                    {profile.profilePicture && (
                                        <span className="file-name">
                                            {profilePictureFile?.name || "Current: " + profile.profilePicture}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label><FaInfoCircle /> Bio</label>
                                <textarea
                                    name="otherInfo"
                                    value={profile.otherInfo}
                                    onChange={handleInputChange}
                                    placeholder="Tell us about yourself..."
                                    rows="4"
                                ></textarea>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button 
                                type="button" 
                                className="save-btn" 
                                onClick={handleSaveProfile}
                            >
                                <FaSave /> Save Changes
                            </button>
                            <button 
                                type="button" 
                                className="cancel-btn" 
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Profile;
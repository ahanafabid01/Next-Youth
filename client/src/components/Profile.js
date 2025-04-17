import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
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
        // Fetch user profile from the backend
        const fetchUserProfile = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/auth/me", { withCredentials: true });
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
        // Calculate profile completion progress
        const totalFields = Object.keys(profile).length;
        const filledFields = Object.values(profile).filter((field) => field).length;
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

            const updatedProfile = { ...profile, profilePicture: profilePictureUrl };
            const response = await axios.put("http://localhost:4000/api/auth/profile", updatedProfile, {
                withCredentials: true,
            });

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
            <h1>My Profile</h1>
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                <span>{Math.round(progress)}% Complete</span>
            </div>
            {!isEditing ? (
                <div className="profile-view">
                    <div className="profile-picture">
                        <img src={profile.profilePicture || "/default-avatar.png"} alt="Profile" />
                    </div>
                    <p><strong>Name:</strong> {profile.name}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Date of Birth:</strong> {profile.dateOfBirth}</p>
                    <p><strong>LinkedIn ID:</strong> {profile.linkedInId}</p>
                    <p><strong>Other Information:</strong> {profile.otherInfo}</p>
                    <button className="btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                </div>
            ) : (
                <form className="profile-form">
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            name="name"
                            value={profile.name}
                            onChange={handleInputChange}
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={profile.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="form-group">
                        <label>Profile Picture</label>
                        <input type="file" onChange={handleProfilePictureChange} />
                        {profile.profilePicture && (
                            <div className="profile-picture-preview">
                                <img src={profile.profilePicture} alt="Profile" />
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                            type="date"
                            name="dateOfBirth"
                            value={profile.dateOfBirth}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>LinkedIn ID</label>
                        <input
                            type="text"
                            name="linkedInId"
                            value={profile.linkedInId}
                            onChange={handleInputChange}
                            placeholder="Enter LinkedIn ID"
                        />
                    </div>
                    <div className="form-group">
                        <label>Other Information</label>
                        <textarea
                            name="otherInfo"
                            value={profile.otherInfo}
                            onChange={handleInputChange}
                            placeholder="Add any additional information"
                        ></textarea>
                    </div>
                    <button type="button" className="btn" onClick={handleSaveProfile}>
                        Save Profile
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                        Cancel
                    </button>
                </form>
            )}
        </div>
    );
};

export default Profile;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaGraduationCap, FaCode, FaLanguage, 
  FaMapMarkerAlt, FaBullseye, FaFileAlt, FaLinkedin, 
  FaGlobe, FaUserCircle, FaCheckCircle
} from 'react-icons/fa';
import './ViewProfile.css'; // Import specific styles for ViewProfile
import API_BASE_URL from '../../config';

const ViewProfile = () => {
  const [profileData, setProfileData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/auth/profile/${userId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setProfileData(response.data.profile);
        } else {
          setError("Failed to load profile data");
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError("An error occurred while loading the profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, API_BASE_URL]);

  // Helper function to render education items
  const renderEducation = (level, item) => {
    if (!item || (!item.name && !item.enteringYear && !item.passingYear)) return null;
    
    return (
      <div className="profile-education-item">
        <h3>{level}</h3>
        <p className="education-name">{item.name || 'Not specified'}</p>
        {(item.enteringYear || item.passingYear) && (
          <p className="education-years">
            {item.enteringYear || '?'} - {item.passingYear || 'Present'}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="employee-dashboard">
      <main className="dashboard-container">
        <div className="dashboard-content">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back to Applications
          </button>

          {isLoading ? (
            <div className="loading-spinner">Loading profile...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="profile-view-container">
              {/* Profile Header */}
              <div className="profile-header">
                <div className="profile-header-content">
                  <div className="profile-picture-container">
                    {profileData.profilePicture ? (
                      <img 
                        src={profileData.profilePicture} 
                        alt={`${profileData.name}'s profile`} 
                        className="profile-picture"
                      />
                    ) : (
                      <div className="profile-picture-placeholder">
                        <FaUserCircle />
                      </div>
                    )}
                    {profileData.idVerification && profileData.idVerification.status === 'verified' && (
                      <div className="verification-badge verified">
                        <FaCheckCircle /> Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="profile-header-info">
                    <h1 className="profile-name">{profileData.name || 'User'}</h1>
                    <p className="profile-bio">{profileData.bio || 'No bio provided'}</p>
                    
                    <div className="profile-location">
                      {profileData.country && (
                        <span className="profile-country">
                          <FaMapMarkerAlt /> {profileData.country}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="profile-content">
                {/* Education Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaGraduationCap /> Education
                  </h2>
                  <div className="profile-section-content">
                    {renderEducation('School', profileData.education?.school)}
                    {renderEducation('College', profileData.education?.college)}
                    {renderEducation('University', profileData.education?.university)}
                    
                    {!profileData.education?.school?.name && 
                     !profileData.education?.college?.name && 
                     !profileData.education?.university?.name && (
                      <p className="no-data-message">No education information provided</p>
                    )}
                  </div>
                </div>
                
                {/* Skills Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaCode /> Skills
                  </h2>
                  <div className="profile-section-content">
                    {profileData.skills && profileData.skills.length > 0 ? (
                      <div className="profile-skills">
                        {profileData.skills.map((skill) => (
                          <span key={skill} className="skill-badge">{skill}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-message">No skills added</p>
                    )}
                  </div>
                </div>
                
                {/* Languages Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaLanguage /> Languages
                  </h2>
                  <div className="profile-section-content">
                    {profileData.languageSkills && profileData.languageSkills.length > 0 ? (
                      <div className="profile-languages">
                        {profileData.languageSkills.map((lang) => (
                          <div key={lang.language} className="language-item">
                            <span className="language-name">{lang.language}</span>
                            <span className="language-proficiency">{lang.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-data-message">No languages added</p>
                    )}
                  </div>
                </div>
                
                {/* Goals Section */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaBullseye /> Career Goals
                  </h2>
                  <div className="profile-section-content">
                    {profileData.goals ? (
                      <div className="profile-goals">
                        <p>{profileData.goals}</p>
                      </div>
                    ) : (
                      <p className="no-data-message">No career goals specified</p>
                    )}
                  </div>
                </div>
                
                {/* Professional Links */}
                <div className="profile-section">
                  <h2 className="profile-section-title">
                    <FaGlobe /> Professional Links
                  </h2>
                  <div className="profile-section-content">
                    <div className="contact-info">
                      {profileData.linkedInProfile && (
                        <div className="contact-item">
                          <FaLinkedin className="contact-icon" />
                          <a href={profileData.linkedInProfile} target="_blank" rel="noopener noreferrer">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      
                      {profileData.socialMediaLink && (
                        <div className="contact-item">
                          <FaGlobe className="contact-icon" />
                          <a href={profileData.socialMediaLink} target="_blank" rel="noopener noreferrer">
                            Social Media
                          </a>
                        </div>
                      )}
                      
                      {!profileData.linkedInProfile && !profileData.socialMediaLink && (
                        <p className="no-data-message">No professional links provided</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Resume Section */}
                {profileData.resume && (
                  <div className="profile-section">
                    <h2 className="profile-section-title">
                      <FaFileAlt /> Resume
                    </h2>
                    <div className="profile-section-content">
                      <div className="resume-container">
                        <a href={profileData.resume} download className="resume-download-button">
                          Download Resume
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewProfile;
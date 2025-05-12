import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaGraduationCap, FaCode, FaLanguage, 
  FaMapMarkerAlt, FaBullseye, FaFileAlt, FaLinkedin, 
  FaGlobe, FaUserCircle, FaCheckCircle, FaStar, FaRegStar,
  FaBriefcase, FaClock
} from 'react-icons/fa';
import './ViewProfile.css';

const ViewProfile = () => {
  const [profileData, setProfileData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { userId } = useParams();
  const navigate = useNavigate();
  const API_BASE_URL = 'API_BASE_URL';

  // Check for theme immediately on component mount
  useEffect(() => {
    // Check if dashboard has dark theme applied
    const dashboardEl = document.querySelector('.dashboard-wrapper');
    if (dashboardEl && dashboardEl.classList.contains('dark-theme')) {
      setDarkMode(true);
    } else {
      // Fallback to localStorage if not in dashboard context
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        setDarkMode(true);
      }
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Fetch the user profile
        const response = await axios.get(`${API_BASE_URL}/auth/profile/${userId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          const profile = response.data.profile;
          setProfileData(profile);
          
          // Check if we have ratings in the profile data
          if (profile.ratings && Array.isArray(profile.ratings) && profile.ratings.length > 0) {
            console.log("Found ratings in profile:", profile.ratings);
            setRatings(profile.ratings);
          } else {
            console.log("No ratings found in profile data");
          }
        } else {
          setError("Failed to load profile data");
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError("An error occurred while loading the profile");
      } finally {
        setIsLoading(false);
        setRatingsLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, API_BASE_URL]);

  // Listen for theme changes in the parent application
  useEffect(() => {
    const handleThemeChange = () => {
      const dashboardEl = document.querySelector('.dashboard-wrapper');
      if (dashboardEl) {
        setDarkMode(dashboardEl.classList.contains('dark-theme'));
      }
    };

    // Create a MutationObserver to watch for class changes on the dashboard wrapper
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });

    // Start observing the dashboard wrapper for class changes
    const dashboardEl = document.querySelector('.dashboard-wrapper');
    if (dashboardEl) {
      observer.observe(dashboardEl, { attributes: true });
    }

    // Cleanup observer on component unmount
    return () => {
      observer.disconnect();
    };
  }, []);

  // Helper function to render education items
  const renderEducation = (level, item) => {
    if (!item || (!item.name && !item.enteringYear && !item.passingYear)) return null;
    
    return (
      <div className="employer-employee-view-profile-education-item">
        <h3>{level}</h3>
        <p className="employer-employee-view-profile-education-name">{item.name || 'Not specified'}</p>
        {(item.enteringYear || item.passingYear) && (
          <p className="employer-employee-view-profile-education-years">
            {item.enteringYear || '?'} - {item.passingYear || 'Present'}
          </p>
        )}
      </div>
    );
  };

  // Helper function to render star ratings
  const renderStars = (rating) => {
    return (
      <div className="employer-employee-view-profile-star-rating">
        {[...Array(5)].map((_, i) => (
          <span key={i}>
            {i < Math.floor(rating) ? 
              <FaStar className="employer-employee-view-profile-star-filled" /> : 
              <FaRegStar className="employer-employee-view-profile-star-empty" />
            }
          </span>
        ))}
        <span className="employer-employee-view-profile-rating-number">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Calculate average rating
  const calculateAverageRating = () => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((total, rating) => total + (parseFloat(rating.rating) || 0), 0);
    return sum / ratings.length;
  };

  // Function to safely display rating data
  const getRatingJobTitle = (rating) => {
    if (typeof rating.job === 'object' && rating.job) {
      return rating.job.title || 'Not specified';
    } else if (typeof rating.job === 'string') {
      return 'Job #' + rating.job.substring(0, 6);
    }
    return 'Not specified';
  };

  const getEmployerName = (rating) => {
    if (typeof rating.employer === 'object' && rating.employer) {
      return rating.employer.name || 'Anonymous';
    } else if (typeof rating.employer === 'string') {
      return 'Employer';
    }
    return 'Anonymous';
  };

  return (
    <div className={`employer-employee-view-profile-overlay ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="employer-employee-view-profile-modal">
        <div className="employer-employee-view-profile-modal-header">
          <button 
            className="employer-employee-view-profile-back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft /> Back
          </button>
          <h2 className="employer-employee-view-profile-modal-title">Talent Profile</h2>
        </div>

        {isLoading ? (
          <div className="employer-employee-view-profile-loading-container">
            <div className="employer-employee-view-profile-loading-spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="employer-employee-view-profile-error-message">{error}</div>
        ) : (
          <div className="employer-employee-view-profile-modal-content">
            {/* Profile Header with enhanced styling */}
            <div className="employer-employee-view-profile-header">
              <div className="employer-employee-view-profile-picture-container">
                {profileData.profilePicture ? (
                  <img 
                    src={profileData.profilePicture} 
                    alt={`${profileData.name}'s profile`} 
                    className="employer-employee-view-profile-picture"
                  />
                ) : (
                  <div className="employer-employee-view-profile-picture-placeholder">
                    <FaUserCircle />
                  </div>
                )}
                {profileData.idVerification && profileData.idVerification.status === 'verified' && (
                  <div className="employer-employee-view-profile-verification-badge">
                    <FaCheckCircle /> Verified
                  </div>
                )}
              </div>
              
              <div className="employer-employee-view-profile-header-info">
                <div className="employer-employee-view-profile-name-container">
                  <h1 className="employer-employee-view-profile-name">{profileData.name || 'User'}</h1>
                  {ratings && ratings.length > 0 && (
                    <div className="employer-employee-view-profile-rating-summary">
                      {renderStars(calculateAverageRating())}
                      <span className="employer-employee-view-profile-rating-count">
                        ({ratings.length} review{ratings.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="employer-employee-view-profile-bio">{profileData.bio || 'No bio provided'}</p>
                
                <div className="employer-employee-view-profile-meta">
                  {profileData.country && (
                    <span className="employer-employee-view-profile-country">
                      <FaMapMarkerAlt /> {profileData.country}
                    </span>
                  )}
                  
                  {profileData.hourlyRate && (
                    <span className="employer-employee-view-profile-rate">
                      <strong>${profileData.hourlyRate}</strong>/hour
                    </span>
                  )}
                  
                  {profileData.weeklyAvailability && (
                    <span className="employer-employee-view-profile-availability">
                      <FaClock /> {profileData.weeklyAvailability} hrs/week
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="employer-employee-view-profile-content">
              {/* Skills Section - Enhanced card styling */}
              <div className="employer-employee-view-profile-section employer-employee-view-profile-card">
                <h2 className="employer-employee-view-profile-section-title">
                  <FaCode /> Skills
                </h2>
                <div className="employer-employee-view-profile-section-content">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    <div className="employer-employee-view-profile-skills">
                      {profileData.skills.map((skill) => (
                        <span key={skill} className="employer-employee-view-profile-skill-badge">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="employer-employee-view-profile-no-data-message">No skills added</p>
                  )}
                </div>
              </div>

              {/* Two-column layout for Education and Languages */}
              <div className="employer-employee-view-profile-two-columns">
                {/* Education Section */}
                <div className="employer-employee-view-profile-section employer-employee-view-profile-card">
                  <h2 className="employer-employee-view-profile-section-title">
                    <FaGraduationCap /> Education
                  </h2>
                  <div className="employer-employee-view-profile-section-content">
                    {renderEducation('University', profileData.education?.university)}
                    {renderEducation('College', profileData.education?.college)}
                    {renderEducation('School', profileData.education?.school)}
                    
                    {!profileData.education?.school?.name && 
                    !profileData.education?.college?.name && 
                    !profileData.education?.university?.name && (
                      <p className="employer-employee-view-profile-no-data-message">No education information provided</p>
                    )}
                  </div>
                </div>
                
                {/* Languages Section */}
                <div className="employer-employee-view-profile-section employer-employee-view-profile-card">
                  <h2 className="employer-employee-view-profile-section-title">
                    <FaLanguage /> Languages
                  </h2>
                  <div className="employer-employee-view-profile-section-content">
                    {profileData.languageSkills && profileData.languageSkills.length > 0 ? (
                      <div className="employer-employee-view-profile-languages">
                        {profileData.languageSkills.map((lang, index) => (
                          <div key={index} className="employer-employee-view-profile-language-item">
                            <span className="employer-employee-view-profile-language-name">{lang.language}</span>
                            <span className="employer-employee-view-profile-language-proficiency">{lang.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="employer-employee-view-profile-no-data-message">No languages added</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Goals Section - Enhanced card styling */}
              <div className="employer-employee-view-profile-section employer-employee-view-profile-card">
                <h2 className="employer-employee-view-profile-section-title">
                  <FaBullseye /> Career Goals
                </h2>
                <div className="employer-employee-view-profile-section-content">
                  {profileData.goals ? (
                    <div className="employer-employee-view-profile-goals">
                      <p>{profileData.goals}</p>
                    </div>
                  ) : (
                    <p className="employer-employee-view-profile-no-data-message">No career goals specified</p>
                  )}
                </div>
              </div>
              
              {/* Ratings & Reviews Section - Enhanced styling */}
              <div className="employer-employee-view-profile-section employer-employee-view-profile-card employer-employee-view-profile-ratings-section">
                <h2 className="employer-employee-view-profile-section-title">
                  <FaStar /> Ratings & Reviews
                </h2>
                <div className="employer-employee-view-profile-section-content">
                  {ratingsLoading ? (
                    <div className="employer-employee-view-profile-loading-inline">Loading ratings...</div>
                  ) : ratings && ratings.length > 0 ? (
                    <div className="employer-employee-view-profile-ratings-container">
                      {ratings.map((rating, index) => (
                        <div key={index} className="employer-employee-view-profile-rating-card">
                          <div className="employer-employee-view-profile-rating-header">
                            <div className="employer-employee-view-profile-rating-stars">
                              {renderStars(rating.rating)}
                            </div>
                            <div className="employer-employee-view-profile-rating-date">
                              {new Date(rating.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="employer-employee-view-profile-rating-job">
                            <FaBriefcase /> {getRatingJobTitle(rating)}
                          </div>
                          <p className="employer-employee-view-profile-rating-review">"{rating.review}"</p>
                          <div className="employer-employee-view-profile-rating-employer">
                            <strong>From:</strong> {getEmployerName(rating)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="employer-employee-view-profile-no-data-message">No reviews yet</p>
                  )}
                </div>
              </div>
              
              {/* Two-column layout for Links and Resume */}
              <div className="employer-employee-view-profile-two-columns">
                {/* Professional Links */}
                <div className="employer-employee-view-profile-section employer-employee-view-profile-card">
                  <h2 className="employer-employee-view-profile-section-title">
                    <FaGlobe /> Professional Links
                  </h2>
                  <div className="employer-employee-view-profile-section-content">
                    <div className="employer-employee-view-profile-contact-info">
                      {profileData.linkedInProfile && (
                        <div className="employer-employee-view-profile-contact-item">
                          <FaLinkedin className="employer-employee-view-profile-contact-icon" />
                          <a href={profileData.linkedInProfile} target="_blank" rel="noopener noreferrer">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                      
                      {profileData.socialMediaLink && (
                        <div className="employer-employee-view-profile-contact-item">
                          <FaGlobe className="employer-employee-view-profile-contact-icon" />
                          <a href={profileData.socialMediaLink} target="_blank" rel="noopener noreferrer">
                            Social Media
                          </a>
                        </div>
                      )}
                      
                      {!profileData.linkedInProfile && !profileData.socialMediaLink && (
                        <p className="employer-employee-view-profile-no-data-message">No professional links provided</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Resume Section */}
                {profileData.resume && (
                  <div className="employer-employee-view-profile-section employer-employee-view-profile-card">
                    <h2 className="employer-employee-view-profile-section-title">
                      <FaFileAlt /> Resume
                    </h2>
                    <div className="employer-employee-view-profile-section-content">
                      <div className="employer-employee-view-profile-resume-container">
                        <a href={profileData.resume} download className="employer-employee-view-profile-resume-download-button">
                          Download Resume
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewProfile;
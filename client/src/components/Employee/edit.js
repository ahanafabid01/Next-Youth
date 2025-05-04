import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../../config';  // Add this import
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaSun, 
  FaMoon, 
  FaUserCircle, 
  FaBell, 
  FaChevronDown,
  FaCheck,
  FaClock,
  FaGraduationCap,
  FaLanguage,
  FaCode,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaBullseye,
  FaFileAlt,
  FaLinkedinIn,
  FaGlobe,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaHome,
  FaQuestionCircle,
  FaBriefcase,
  FaBookmark,
  FaRegFileAlt,
  FaCheckCircle,
  FaDollarSign,
  FaCommentDots,
  FaTimes,
  FaInfoCircle,
  FaArrowLeft
} from 'react-icons/fa';
import './EmployeeProfile.css';
import './EmployeeDashboard.css';

const skillsList = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'HTML', 'CSS',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'UI/UX Design', 'Marketing',
  'SEO', 'Data Analysis', 'Machine Learning', 'Cybersecurity', 'Other'
];

const languagesList = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Arabic',
  'Portuguese', 'Russian', 'Japanese', 'Korean', 'Other'
];

const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Fluent'];

const EmployeeProfile = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    bio: '',
    education: {
      school: { name: '', enteringYear: '', passingYear: '' },
      college: { name: '', enteringYear: '', passingYear: '' },
      university: { name: '', enteringYear: '', passingYear: '' },
    },
    skills: [],
    languageSkills: [],
    profilePic: null,
    profilePicPreview: null,
    profilePicture: '',
    address: '',
    country: '',
    phoneNumber: '',
    name: '',
    email: '',
    goals: '',
    questions: [],
    resume: null,
    linkedInProfile: '',
    socialMediaLink: '',
    idVerification: null,
    isVerified: false,
    resumeUrl: '',
    freelanceExperience: '',
    paymentType: '',
    fixedRate: '',
    hourlyRate: '',
    weeklyAvailability: '',
    openToContractToHire: false
  });

  const [originalUserData, setOriginalUserData] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("dashboard-theme") === "dark";
  });
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const fetchUserData = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const [employeeResponse, verificationResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/employee-profile`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/auth/verification-status`, { withCredentials: true })
      ]);
      
      if (employeeResponse.data.success) {
        const userData = employeeResponse.data.profile;
        
        let verificationData = null;
        let verificationStatus = null;
        
        if (verificationResponse.data.success && verificationResponse.data.verification) {
          verificationData = verificationResponse.data.verification;
          verificationStatus = verificationData.status;
        }
        
        setOriginalUserData(userData);
        
        // Create a new formData object with explicit mapping of all fields
        setFormData({
          bio: userData.bio || '',
          education: {
            school: {
              name: userData.education?.school?.name || '',
              enteringYear: userData.education?.school?.enteringYear || '',
              passingYear: userData.education?.school?.passingYear || ''
            },
            college: {
              name: userData.education?.college?.name || '',
              enteringYear: userData.education?.college?.enteringYear || '',
              passingYear: userData.education?.college?.passingYear || ''
            },
            university: {
              name: userData.education?.university?.name || '',
              enteringYear: userData.education?.university?.enteringYear || '',
              passingYear: userData.education?.university?.passingYear || ''
            }
          },
          skills: userData.skills || [],
          languageSkills: userData.languageSkills || [],
          profilePic: null,
          profilePicPreview: null,
          profilePicture: userData.profilePicture || '',
          address: userData.address || '',
          country: userData.country || '',
          phoneNumber: userData.phoneNumber || '',
          name: userData.name || '',
          email: userData.email || '',
          goals: userData.goals || '',
          questions: userData.questions || [],
          resume: null,
          linkedInProfile: userData.linkedInProfile || '',
          socialMediaLink: userData.socialMediaLink || '',
          idVerification: verificationData,
          isVerified: verificationStatus === 'verified',
          resumeUrl: userData.resume || '',
          freelanceExperience: userData.freelanceExperience || '',
          paymentType: userData.paymentType || '',
          fixedRate: userData.fixedRate || '',
          hourlyRate: userData.hourlyRate || '',
          weeklyAvailability: userData.weeklyAvailability || '',
          openToContractToHire: userData.openToContractToHire || false
        });
      }
    } catch (error) {
      console.error('Error fetching employee profile data:', error);
      toast.error('Failed to load your profile data');
      if (error.response?.status === 401) navigate('/login');
    } finally {
      setIsInitialLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  const handleOutsideClick = useCallback((event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
    }
  }, []);

  const toggleMobileNav = useCallback((e) => {
    e.stopPropagation();
    setShowMobileNav(prev => !prev);
  }, []);

  const toggleProfileDropdown = useCallback((e) => {
    e.stopPropagation();
    setShowProfileDropdown(prev => !prev);
  }, []);

  const toggleNotifications = useCallback((e) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleNavigateToProfile = useCallback(() => {
    navigate('/my-profile');
  }, [navigate]);

  const handleVerifyAccount = useCallback(() => {
    navigate('/verify-account');
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      if (response.data.success) navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [navigate, API_BASE_URL]);

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  useEffect(() => {
    // Keep this for global dark mode
    document.body.classList.toggle('dark-mode', isDarkMode);
    // The class on the container will now be handled in the JSX
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEducationChange = (e, level, field) => {
    setFormData({
      ...formData,
      education: {
        ...formData.education,
        [level]: { ...formData.education[level], [field]: e.target.value },
      },
    });
  };

  const handleAddSkill = () => {
    if (selectedSkill && !formData.skills.includes(selectedSkill)) {
      setFormData({ ...formData, skills: [...formData.skills, selectedSkill] });
      setSelectedSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const handleAddLanguage = () => {
    if (selectedLanguage && selectedProficiency) {
      setFormData({
        ...formData,
        languageSkills: [
          ...formData.languageSkills,
          { language: selectedLanguage, proficiency: selectedProficiency },
        ],
      });
      setSelectedLanguage('');
      setSelectedProficiency('');
    }
  };

  const handleRemoveLanguage = (language) => {
    setFormData({
      ...formData,
      languageSkills: formData.languageSkills.filter(
        (lang) => lang.language !== language
      ),
    });
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (field === 'profilePic') {
      setFormData({
        ...formData,
        profilePicPreview: URL.createObjectURL(file),
        profilePic: file
      });
      
      try {
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        
        const response = await axios.post(
          `${API_BASE_URL}/auth/upload-profile-picture`,
          formDataObj,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setFormData(prev => ({
            ...prev,
            profilePicture: response.data.url
          }));
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        toast.error('Failed to upload profile picture');
      }
    } else {
      setFormData({ ...formData, [field]: file });
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    const allowedExtensions = ['jpg', 'png', 'pdf'];

    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Invalid file type. Please upload a .jpg, .png, or .pdf file.');
        return;
      }
      setFormData({ ...formData, resume: file });
    }
  };

  const handleNext = () => setStep(step + 1);
  const handlePrevious = () => setStep(step - 1);
  const handleCancel = () => navigate('/employee-dashboard');

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, '']
    });
  };

  const handleQuestionChange = (index, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = value;
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleRemoveQuestion = (index) => {
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      // Handle resume upload if present
      let resumeUrl = null;
      if (formData.resume) {
        const resumeFormData = new FormData();
        resumeFormData.append('file', formData.resume);
        
        try {
          const resumeResponse = await axios.post(
            `${API_BASE_URL}/auth/upload-file`,
            resumeFormData,
            { withCredentials: true }
          );
          
          if (resumeResponse.data.success) {
            resumeUrl = resumeResponse.data.url;
          }
        } catch (error) {
          console.error('Error uploading resume:', error);
          toast.error('Failed to upload resume, but continuing with other profile updates');
        }
      }
      
      // Create payload with only changed fields
      const payload = {};
      
      // Helper function to check if a value should be included in the payload
      const shouldIncludeField = (newValue, origValue) => {
        // Don't include empty strings or null values that would override existing data
        if (newValue === '' || newValue === null || newValue === undefined) return false;
        // Include the field if it's different from the original value
        return newValue !== origValue;
      };
      
      // Compare form data with original data and only include changed fields with non-empty values
      if (shouldIncludeField(formData.name, originalUserData?.name)) payload.name = formData.name;
      if (shouldIncludeField(formData.bio, originalUserData?.bio)) payload.bio = formData.bio;
      if (shouldIncludeField(formData.profilePicture, originalUserData?.profilePicture)) 
        payload.profilePicture = formData.profilePicture;
      
      // Handle education fields - only include if something changed and fields are not empty
      const origEducation = originalUserData?.education || {};
      const hasEducationChanges = 
        (formData.education.school.name && formData.education.school.name !== origEducation.school?.name) ||
        (formData.education.school.enteringYear && formData.education.school.enteringYear !== origEducation.school?.enteringYear) ||
        (formData.education.school.passingYear && formData.education.school.passingYear !== origEducation.school?.passingYear) ||
        (formData.education.college.name && formData.education.college.name !== origEducation.college?.name) ||
        (formData.education.college.enteringYear && formData.education.college.enteringYear !== origEducation.college?.enteringYear) ||
        (formData.education.college.passingYear && formData.education.college.passingYear !== origEducation.college?.passingYear) ||
        (formData.education.university.name && formData.education.university.name !== origEducation.university?.name) ||
        (formData.education.university.enteringYear && formData.education.university.enteringYear !== origEducation.university?.enteringYear) ||
        (formData.education.university.passingYear && formData.education.university.passingYear !== origEducation.university?.passingYear);
        
      if (hasEducationChanges) {
        // Merge with original education to prevent empty fields from overriding existing data
        payload.education = {
          school: {
            name: formData.education.school.name || origEducation.school?.name || '',
            enteringYear: formData.education.school.enteringYear || origEducation.school?.enteringYear || '',
            passingYear: formData.education.school.passingYear || origEducation.school?.passingYear || '',
          },
          college: {
            name: formData.education.college.name || origEducation.college?.name || '',
            enteringYear: formData.education.college.enteringYear || origEducation.college?.enteringYear || '',
            passingYear: formData.education.college.passingYear || origEducation.college?.passingYear || '',
          },
          university: {
            name: formData.education.university.name || origEducation.university?.name || '',
            enteringYear: formData.education.university.enteringYear || origEducation.university?.enteringYear || '',
            passingYear: formData.education.university.passingYear || origEducation.university?.passingYear || '',
          },
        };
      }
      
      // Handle skills array - only include if it has items and is different from original
      if (formData.skills.length > 0 && JSON.stringify(formData.skills) !== JSON.stringify(originalUserData?.skills || [])) {
        payload.skills = formData.skills;
      }
      
      // Handle languageSkills array - only include if it has items and is different from original
      if (formData.languageSkills.length > 0 && 
          JSON.stringify(formData.languageSkills) !== JSON.stringify(originalUserData?.languageSkills || [])) {
        payload.languageSkills = formData.languageSkills;
      }
      
      // Handle other simple fields - only include if they have values and are different from original
      if (shouldIncludeField(formData.address, originalUserData?.address)) payload.address = formData.address;
      if (shouldIncludeField(formData.country, originalUserData?.country)) payload.country = formData.country;
      if (shouldIncludeField(formData.phoneNumber, originalUserData?.phoneNumber)) payload.phoneNumber = formData.phoneNumber;
      if (shouldIncludeField(formData.email, originalUserData?.email)) payload.email = formData.email;
      if (shouldIncludeField(formData.linkedInProfile, originalUserData?.linkedInProfile)) 
        payload.linkedInProfile = formData.linkedInProfile;
      if (shouldIncludeField(formData.socialMediaLink, originalUserData?.socialMediaLink)) 
        payload.socialMediaLink = formData.socialMediaLink;
      if (shouldIncludeField(formData.goals, originalUserData?.goals)) payload.goals = formData.goals;
      
      // Handle questions array - only include if it has items and is different from original
      if (formData.questions.length > 0 && 
          JSON.stringify(formData.questions) !== JSON.stringify(originalUserData?.questions || [])) {
        // Filter out empty questions
        const filteredQuestions = formData.questions.filter(q => q.trim() !== '');
        if (filteredQuestions.length > 0) {
          payload.questions = filteredQuestions;
        }
      }
      
      // Add resume URL if it was newly uploaded or changed and not empty
      if (resumeUrl) {
        payload.resumeUrl = resumeUrl;
      } else if (formData.resumeUrl && formData.resumeUrl !== originalUserData?.resume) {
        payload.resumeUrl = formData.resumeUrl;
      }

      // Add this to the payload construction section in handleSubmit
      if (shouldIncludeField(formData.freelanceExperience, originalUserData?.freelanceExperience)) 
        payload.freelanceExperience = formData.freelanceExperience;

      // Also add the other payment/rate fields
      if (shouldIncludeField(formData.paymentType, originalUserData?.paymentType)) 
        payload.paymentType = formData.paymentType;
      if (shouldIncludeField(formData.fixedRate, originalUserData?.fixedRate)) 
        payload.fixedRate = formData.fixedRate;
      if (shouldIncludeField(formData.hourlyRate, originalUserData?.hourlyRate)) 
        payload.hourlyRate = formData.hourlyRate;
      if (shouldIncludeField(formData.weeklyAvailability, originalUserData?.weeklyAvailability))
        payload.weeklyAvailability = formData.weeklyAvailability;
      if (formData.openToContractToHire !== originalUserData?.openToContractToHire)
        payload.openToContractToHire = formData.openToContractToHire;
      
      // Only make the API call if there are changes to send
      if (Object.keys(payload).length > 0) {
        const response = await axios.put(
          `${API_BASE_URL}/auth/update-employee-profile`,
          payload,
          { withCredentials: true }
        );

        if (response.data.success) {
          // Update the original data with the new data
          setOriginalUserData(prev => ({...prev, ...response.data.user}));
          toast.success('Profile updated successfully!');
          navigate('/employee-dashboard');
        } else {
          toast.error('Failed to update profile: ' + response.data.message);
        }
      } else {
        toast.info('No changes detected.');
        navigate('/employee-dashboard');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className={`employee-dashboard ${isDarkMode ? 'dark-mode' : ''}`}>
      <ToastContainer position="top-right" autoClose={5000} theme={isDarkMode ? 'dark' : 'light'} />
      
      {/* Header with Navigation */}
      <header className="dashboard-header">
        <div className="dashboard-header-container">
          <div className="dashboard-header-left">
            <button 
              className="dashboard-nav-toggle"
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <Link to="/" className="dashboard-logo">Next Youth</Link>
            
            <nav className={`dashboard-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="nav-link">Find Work</Link>
              <Link to="/find-jobs/saved" className="nav-link">Saved Jobs</Link>
              <Link to="/find-jobs/proposals" className="nav-link">Proposals</Link>
              <Link to="/help" className="nav-link">Help</Link>
            </nav>
          </div>
          
          <div className="dashboard-header-right">
            <div className="notification-container" ref={notificationsRef}>
              <button 
                className="notification-button"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FaBell />
                <span className="notification-badge">2</span>
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button className="mark-all-read">Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notification-icon">
                        <FaCheckCircle />
                      </div>
                      <div className="notification-content">
                        <p>Your profile has been verified!</p>
                        <span className="notification-time">2 hours ago</span>
                      </div>
                    </div>
                    <div className="notification-item unread">
                      <div className="notification-icon">
                        <FaRegFileAlt />
                      </div>
                      <div className="notification-content">
                        <p>New job matching your skills is available</p>
                        <span className="notification-time">1 day ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="notification-footer">
                    <Link to="/notifications">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="theme-toggle-button"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>

            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button 
                className="profile-button" 
                onClick={toggleProfileDropdown}
                aria-label="User profile"
              >
                {formData.profilePicture ? (
                  <img 
                    src={formData.profilePicture}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <FaUserCircle className="profile-avatar-icon" />
                )}
                <FaChevronDown className={`dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {formData.profilePicture ? (
                        <img 
                          src={formData.profilePicture}
                          alt={`${formData.name}'s profile`}
                        />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4>{formData.name || 'User'}</h4>
                      <span className="profile-status">
                        {!formData.idVerification ? (
                          'Not Verified'
                        ) : formData.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="verified-icon" /> Verified</>
                        ) : formData.idVerification.status === 'pending' && formData.idVerification.frontImage && formData.idVerification.backImage ? (
                          <><FaClock className="pending-icon" /> Verification Pending</>
                        ) : formData.idVerification.status === 'rejected' ? (
                          <>Verification Rejected</>
                        ) : (
                          'Not Verified'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="profile-dropdown-links">
                    <button 
                      className="profile-dropdown-link"
                      onClick={handleNavigateToProfile}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {/* Show verify account option when appropriate */}
                    {(!formData.idVerification || 
                      !formData.idVerification.frontImage || 
                      !formData.idVerification.backImage || 
                      formData.idVerification.status === 'rejected') && (
                      <button 
                        className="profile-dropdown-link"
                        onClick={handleVerifyAccount}
                      >
                        Verify Account
                      </button>
                    )}
                    
                    <button 
                      className="profile-dropdown-link"
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </button>
                    <button 
                      className="profile-dropdown-link"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="profile-dashboard-container">
        <div className="employee-profile">
          <div className="profile-edit-container">
            <h1 className="profile-edit-title">Edit Your Profile</h1>
            <div className="profile-form-steps">
              <div className={`step-indicator ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
                1. Basic Info
              </div>
              <div className={`step-indicator ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                2. Education
              </div>
              <div className={`step-indicator ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
                3. Skills
              </div>
              <div className={`step-indicator ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}>
                4. Contact
              </div>
              <div className={`step-indicator ${step === 5 ? 'active' : step > 5 ? 'completed' : ''}`}>
                5. Goals
              </div>
              <div className={`step-indicator ${step === 6 ? 'active' : ''}`}>
                6. Price Preference
              </div>
            </div>
            
            {step === 1 && (
              <div className="profile-form-section">
                <h2 className="section-title"><FaUserCircle /> Basic Information</h2>
                
                <div className="form-group">
                  <label>Profile Picture</label>
                  <div className="profile-upload-container">
                    {formData.profilePicture || formData.profilePicPreview ? (
                      <img
                        src={formData.profilePicture || formData.profilePicPreview}
                        alt="Profile"
                        className="profile-pic-preview"
                      />
                    ) : (
                      <div className="profile-pic-placeholder">
                        <FaUserCircle />
                      </div>
                    )}
                    <label className="file-upload-button">
                      {formData.profilePicture || formData.profilePicPreview ? 'Change Photo' : 'Upload Photo'}
                      <input
                        type="file"
                        onChange={(e) => handleFileChange(e, 'profilePic')}
                        accept="image/*"
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Write a short bio about yourself"
                    rows="4"
                    className="form-textarea"
                  />
                </div>
                
                <div className="profile-form-actions">
                  <button className="secondary-button" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className="action-button" onClick={handleNext}>
                    Next: Education
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Education */}
            {step === 2 && (
              <div className="profile-form-section">
                <h2 className="section-title"><FaGraduationCap /> Education</h2>
                
                <div className="education-form-group">
                  <h3>School</h3>
                  <div className="form-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      value={formData.education.school.name}
                      onChange={(e) => handleEducationChange(e, 'school', 'name')}
                      placeholder="Enter school name"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="year-inputs-container">
                    <div className="form-group year-input">
                      <label>Entering Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={currentYear}
                        value={formData.education.school.enteringYear}
                        onChange={(e) => handleEducationChange(e, 'school', 'enteringYear')}
                        placeholder="Year"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group year-input">
                      <label>Passing Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={currentYear + 10}
                        value={formData.education.school.passingYear}
                        onChange={(e) => handleEducationChange(e, 'school', 'passingYear')}
                        placeholder="Year"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="education-form-group">
                  <h3>College</h3>
                  <div className="form-group">
                    <label>College Name</label>
                    <input
                      type="text"
                      value={formData.education.college.name}
                      onChange={(e) => handleEducationChange(e, 'college', 'name')}
                      placeholder="Enter college name"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="year-inputs-container">
                    <div className="form-group year-input">
                      <label>Entering Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={currentYear}
                        value={formData.education.college.enteringYear}
                        onChange={(e) => handleEducationChange(e, 'college', 'enteringYear')}
                        placeholder="Year"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group year-input">
                      <label>Passing Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={currentYear + 10}
                        value={formData.education.college.passingYear}
                        onChange={(e) => handleEducationChange(e, 'college', 'passingYear')}
                        placeholder="Year"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="education-form-group">
                  <h3>University</h3>
                  <div className="form-group">
                    <label>University Name</label>
                    <input
                      type="text"
                      value={formData.education.university.name}
                      onChange={(e) => handleEducationChange(e, 'university', 'name')}
                      placeholder="Enter university name"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="year-inputs-container">
                    <div className="form-group year-input">
                      <label>Entering Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={currentYear}
                        value={formData.education.university.enteringYear}
                        onChange={(e) => handleEducationChange(e, 'university', 'enteringYear')}
                        placeholder="Year"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group year-input">
                      <label>Passing Year</label>
                      <input
                        type="number"
                        min="1900"
                        max={currentYear + 10}
                        value={formData.education.university.passingYear}
                        onChange={(e) => handleEducationChange(e, 'university', 'passingYear')}
                        placeholder="Year"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="profile-form-actions">
                  <button className="secondary-button" onClick={handlePrevious}>
                    Back: Basic Info
                  </button>
                  <button className="action-button" onClick={handleNext}>
                    Next: Skills
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Skills */}
            {step === 3 && (
              <div className="profile-form-section">
                <h2 className="section-title"><FaCode /> Skills & Languages</h2>
                
                {/* Skills */}
                <div className="form-group">
                  <label>Add Skills</label>
                  <div className="skill-selection-container">
                    <select 
                      value={selectedSkill}
                      onChange={(e) => setSelectedSkill(e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select a skill</option>
                      {skillsList.map((skill) => (
                        <option key={skill} value={skill}>{skill}</option>
                      ))}
                    </select>
                    <button type="button" className="add-button" onClick={handleAddSkill}>
                      Add
                    </button>
                  </div>
                  
                  <div className="skills-list">
                    {formData.skills.map((skill) => (
                      <div key={skill} className="skill-badge">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Other Skills */}
                <div className="form-group">
                  <label>Other Skills</label>
                  <div className="skill-selection-container">
                    <input 
                      type="text" 
                      id="otherSkill"
                      name="otherSkill"
                      className="form-select"
                      placeholder="Enter a custom skill"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const customSkill = e.target.value.trim();
                          if (customSkill && !formData.skills.includes(customSkill)) {
                            setFormData({ 
                              ...formData, 
                              skills: [...formData.skills, customSkill] 
                            });
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="add-button" 
                      onClick={(e) => {
                        const input = document.getElementById('otherSkill');
                        const customSkill = input.value.trim();
                        if (customSkill && !formData.skills.includes(customSkill)) {
                          setFormData({ 
                            ...formData, 
                            skills: [...formData.skills, customSkill] 
                          });
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <p className="form-hint">Type a skill and press Enter or click Add</p>
                </div>
                
                {/* Languages */}
                <div className="form-group">
                  <label>Add Languages</label>
                  <div className="skill-selection-container">
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="form-select"
                      style={{flex: 2}}
                    >
                      <option value="">Select a language</option>
                      {languagesList.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedProficiency}
                      onChange={(e) => setSelectedProficiency(e.target.value)}
                      className="form-select"
                      style={{flex: 1}}
                    >
                      <option value="">Proficiency</option>
                      {proficiencyLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                    <button type="button" className="add-button" onClick={handleAddLanguage}>
                      Add
                    </button>
                  </div>
                  
                  <div className="skills-list">
                    {formData.languageSkills.map((lang) => (
                      <div key={lang.language} className="skill-badge">
                        {lang.language} - {lang.proficiency}
                        <button onClick={() => handleRemoveLanguage(lang.language)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="profile-form-actions">
                  <button className="secondary-button" onClick={handlePrevious}>
                    Back: Education
                  </button>
                  <button className="action-button" onClick={handleNext}>
                    Next: Contact
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Contact Info */}
            {step === 4 && (
              <div className="profile-form-section">
                <h2 className="section-title"><FaMapMarkerAlt /> Contact Information</h2>
                
                <div className="contact-form-grid">
                  <div className="form-group">
                    <label htmlFor="phoneNumber"><FaPhoneAlt /> Phone Number</label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email"><FaEnvelope /> Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="address"><FaMapMarkerAlt /> Address</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Enter your address"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Enter your country"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="linkedInProfile"><FaLinkedinIn /> LinkedIn Profile</label>
                    <input
                      type="url"
                      id="linkedInProfile"
                      name="linkedInProfile"
                      value={formData.linkedInProfile}
                      onChange={handleInputChange}
                      placeholder="Enter your LinkedIn profile URL"
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="socialMediaLink"><FaGlobe /> Other Social Media</label>
                    <input
                      type="url"
                      id="socialMediaLink"
                      name="socialMediaLink"
                      value={formData.socialMediaLink}
                      onChange={handleInputChange}
                      placeholder="Enter any other social media URL"
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="profile-form-actions">
                  <button className="secondary-button" onClick={handlePrevious}>
                    Back: Skills
                  </button>
                  <button className="action-button" onClick={handleNext}>
                    Next: Goals
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Goals */}
            {step === 5 && (
              <div className="profile-form-section">
                <h2 className="section-title"><FaBullseye /> Career Goals & Questions</h2>
                
                <div className="form-group">
                  <label>Have you freelanced before?</label>
                  <div className="freelance-experience-options">
                    <label className="option-card">
                      <input
                        type="radio"
                        name="freelanceExperience"
                        value="Yes, I have some experiences"
                        checked={formData.freelanceExperience === "Yes, I have some experiences"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaBriefcase /></div>
                        <span className="option-title">Yes, I have some experiences</span>
                        <span className="option-description">I've completed a few freelance projects before</span>
                      </div>
                    </label>
                    
                    <label className="option-card">
                      <input
                        type="radio"
                        name="freelanceExperience"
                        value="No, I have never"
                        checked={formData.freelanceExperience === "No, I have never"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaRegFileAlt /></div>
                        <span className="option-title">No, I have never</span>
                        <span className="option-description">This will be my first time freelancing</span>
                      </div>
                    </label>
                    
                    <label className="option-card">
                      <input
                        type="radio"
                        name="freelanceExperience"
                        value="I'm an expert"
                        checked={formData.freelanceExperience === "I'm an expert"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaCheckCircle /></div>
                        <span className="option-title">I'm an expert</span>
                        <span className="option-description">I have extensive freelancing experience</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="goals">Your Career Goals</label>
                  <textarea
                    id="goals"
                    name="goals"
                    value={formData.goals}
                    onChange={handleInputChange}
                    placeholder="Describe your career goals and aspirations"
                    rows="4"
                    className="form-textarea"
                  />
                </div>
                
                <div className="form-group">
                  <label>Questions for Employers</label>
                  <p className="form-hint">Add questions you'd like employers to answer before you apply to their jobs</p>
                  
                  <div className="questions-container">
                    {formData.questions.map((question, index) => (
                      <div key={index} className="question-item">
                        <input
                          type="text"
                          value={question}
                          onChange={(e) => handleQuestionChange(index, e.target.value)}
                          placeholder="Enter your question"
                          className="form-input question-input"
                        />
                        <button 
                          type="button" 
                          onClick={() => handleRemoveQuestion(index)}
                          className="remove-button"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={handleAddQuestion}
                    className="add-button"
                    style={{marginTop: '1rem'}}
                  >
                    Add Question
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Resume Upload (Optional)</label>
                  <label className="file-upload-button">
                    {formData.resume ? formData.resume.name : 'Upload Resume'}
                    <input
                      type="file"
                      onChange={handleResumeUpload}
                      accept=".pdf,.jpg,.png"
                      style={{display: 'none'}}
                    />
                  </label>
                  <p className="form-hint">Accepted file types: PDF, JPG, PNG</p>
                </div>
                
                <div className="profile-form-actions">
                  <button className="secondary-button" onClick={handlePrevious}>
                    Back: Contact
                  </button>
                  <button className="action-button" onClick={handleNext}>
                    Next: Price Preference
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Price Preference */}
            {step === 6 && (
              <div className="profile-form-section">
                <h2 className="section-title"><FaDollarSign /> Price Preference</h2>
                
                <div className="pricing-intro">
                  <div className="pricing-icon">
                    <FaDollarSign />
                  </div>
                  <p className="pricing-description">
                    Set your rates and availability to help clients find you for projects that match your expectations.
                  </p>
                </div>
                
                <div className="form-group pricing-options">
                  <label>How would you like to be paid?</label>
                  <div className="payment-type-cards">
                    <label className={`payment-type-card ${formData.paymentType === "fixed" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="paymentType"
                        value="fixed"
                        checked={formData.paymentType === "fixed"}
                        onChange={handleInputChange}
                      />
                      <div className="payment-card-content">
                        <div className="payment-card-icon"><FaRegFileAlt /></div>
                        <div className="payment-card-info">
                          <h4>Fixed Rate</h4>
                          <p>Get paid a set price for the entire project</p>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`payment-type-card ${formData.paymentType === "hourly" ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="paymentType"
                        value="hourly"
                        checked={formData.paymentType === "hourly"}
                        onChange={handleInputChange}
                      />
                      <div className="payment-card-content">
                        <div className="payment-card-icon"><FaClock /></div>
                        <div className="payment-card-info">
                          <h4>Hourly Rate</h4>
                          <p>Get paid for the time you put into the project</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {formData.paymentType === "fixed" && (
                  <div className="form-group rate-setting">
                    <label htmlFor="fixedRate">Your Fixed Rate (USD)</label>
                    <div className="rate-input-container">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        id="fixedRate"
                        name="fixedRate"
                        value={formData.fixedRate}
                        onChange={handleInputChange}
                        className="form-input rate-input"
                        min="0"
                        step="1"
                        placeholder="Enter your fixed rate"
                      />
                      <div className="increment-buttons">
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, fixedRate: (parseInt(formData.fixedRate) || 0) + 1})}
                          className="increment-button"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, fixedRate: Math.max((parseInt(formData.fixedRate) || 0) - 1, 0)})}
                          className="increment-button"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <p className="rate-hint">Set your average price for a typical project</p>
                  </div>
                )}
                
                {formData.paymentType === "hourly" && (
                  <div className="form-group rate-setting">
                    <label htmlFor="hourlyRate">Your Hourly Rate (USD)</label>
                    <div className="rate-input-container">
                      <span className="currency-symbol">$</span>
                      <input
                        type="number"
                        id="hourlyRate"
                        name="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleInputChange}
                        className="form-input rate-input"
                        min="0"
                        step="0.5"
                        placeholder="Enter your hourly rate"
                      />
                      <div className="increment-buttons">
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, hourlyRate: ((parseFloat(formData.hourlyRate) || 0) + 0.5).toFixed(1)})}
                          className="increment-button"
                        >
                          ▲
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, hourlyRate: Math.max((parseFloat(formData.hourlyRate) || 0) - 0.5, 0).toFixed(1)})}
                          className="increment-button"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <p className="rate-hint">Clients will see this rate on your profile</p>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="availability-label">How many hours will you be available per week?</label>
                  <div className="availability-options">
                    <label className="option-card">
                      <input
                        type="radio"
                        name="weeklyAvailability"
                        value="more than 30 hours/week"
                        checked={formData.weeklyAvailability === "more than 30 hours/week"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaClock /></div>
                        <span className="option-title">More than 30 hours/week</span>
                        <span className="option-description">I can work full-time hours</span>
                      </div>
                    </label>
                    
                    <label className="option-card">
                      <input
                        type="radio"
                        name="weeklyAvailability"
                        value="less than 30 hours/week"
                        checked={formData.weeklyAvailability === "less than 30 hours/week"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaClock /></div>
                        <span className="option-title">Less than 30 hours/week</span>
                        <span className="option-description">I can work part-time hours</span>
                      </div>
                    </label>
                    
                    <label className="option-card">
                      <input
                        type="radio"
                        name="weeklyAvailability"
                        value="I'm open to offers"
                        checked={formData.weeklyAvailability === "I'm open to offers"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaCommentDots /></div>
                        <span className="option-title">I'm open to offers</span>
                        <span className="option-description">Let's discuss what works for both of us</span>
                      </div>
                    </label>
                    
                    <label className="option-card">
                      <input
                        type="radio"
                        name="weeklyAvailability"
                        value="none"
                        checked={formData.weeklyAvailability === "none"}
                        onChange={handleInputChange}
                      />
                      <div className="option-content">
                        <div className="option-icon"><FaTimes /></div>
                        <span className="option-title">None</span>
                        <span className="option-description">I'm not currently available</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="form-group contract-hire-section">
                  <div className="contract-hire-header">
                    <label>Contract-to-hire Opportunities</label>
                    <FaInfoCircle className="info-icon" title="Contract-to-hire means you'll start with a contract and may later explore a full-time option" />
                  </div>
                  <div className="contract-to-hire-option">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        name="openToContractToHire"
                        checked={formData.openToContractToHire}
                        onChange={(e) => setFormData({...formData, openToContractToHire: e.target.checked})}
                        className="checkbox-input"
                      />
                      <div className="checkbox-content">
                        <span className="checkbox-label">
                          I'm open to contract-to-hire opportunities
                        </span>
                        <p className="option-description">
                          This means you'll start with a contract and may later explore a full-time option.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div className="profile-form-actions">
                  <button className="secondary-button" onClick={handlePrevious}>
                    <FaArrowLeft className="button-icon" /> Back: Goals
                  </button>
                  <button className="action-button" onClick={handleSubmit}>
                    <FaCheck className="button-icon" /> Complete Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer Section */}
      <footer className="dashboard-footer">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>For Freelancers</h3>
            <ul>
              <li><Link to="/find-jobs">Find Work</Link></li>
              <li><Link to="/resources">Resources</Link></li>
              <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
              <li><Link to="/freelancer-forum">Community Forum</Link></li>
              <li><Link to="/freelancer-stories">Success Stories</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/help-center">Help Center</Link></li>
              <li><Link to="/webinars">Webinars</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/api-docs">Developer API</Link></li>
              <li><Link to="/partner-program">Partner Program</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/leadership">Leadership</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-container">
            <div className="footer-logo">
              <Link to="/">Next Youth</Link>
            </div>
            
            <div className="footer-legal-links">
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/accessibility">Accessibility</Link>
              <Link to="/sitemap">Site Map</Link>
            </div>
            
            <div className="footer-social">
              <a href="https://facebook.com" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
              <a href="https://instagram.com" aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </div>
          
          <div className="footer-copyright">
            <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Display loading overlay when isLoading is true */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
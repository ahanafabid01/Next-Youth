import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
  FaArrowLeft,
  FaStar,
  FaAngleRight,
  
  FaTools,
  FaClipboardCheck,
  FaShieldAlt
} from 'react-icons/fa';
import './EmployeeProfile.css';
import './EmployeeDashboard.css';
import RatingModal from '../Connections/RatingModal';
import logoLight from '../../assets/images/logo-light.png'; 
import logoDark from '../../assets/images/logo-dark.png';

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
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(() => {
    return parseInt(localStorage.getItem("unread-notifications") || "2");
  });
  const [highestStepReached, setHighestStepReached] = useState(1);
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

  const handleMarkAllAsRead = useCallback((e) => {
    e.stopPropagation();
    setUnreadNotifications(0);
    localStorage.setItem("unread-notifications", "0");
  }, []);

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
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    localStorage.setItem("unread-notifications", unreadNotifications.toString());
  }, [unreadNotifications]);

  useEffect(() => {
    // Update highest step reached if current step is higher
    if (step > highestStepReached) {
      setHighestStepReached(step);
    }
  }, [step, highestStepReached]);

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
      // Set preview immediately for better UX
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
          console.log('Profile picture uploaded successfully:', response.data.url);
          
          // Update both profilePicture and profilePic in formData with the URL
          setFormData(prev => ({
            ...prev,
            profilePicture: response.data.url,
            profilePic: response.data.url // Add this line to ensure both fields are updated
          }));
          
          // Update state to force re-render (show the new image)
          toast.success('Profile picture updated!');
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
      
      // IMPORTANT: Fix for profile picture update - add to both fields to ensure compatibility
      if (shouldIncludeField(formData.profilePicture, originalUserData?.profilePicture)) {
        payload.profilePicture = formData.profilePicture;
        // Also include as profilePic for backward compatibility
        payload.profilePic = formData.profilePicture;
      }
      
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

  // Add this new function to handle saving individual sections
  const handleSaveSection = async () => {
    try {
      setIsLoading(true);
      let payload = {};
      const shouldIncludeField = (newValue, origValue) => {
        if (newValue === '' || newValue === null || newValue === undefined) return false;
        return newValue !== origValue;
      };

      // Determine which fields to include based on current step
      switch(step) {
        case 1: // Basic Info
          if (shouldIncludeField(formData.name, originalUserData?.name)) payload.name = formData.name;
          if (shouldIncludeField(formData.bio, originalUserData?.bio)) payload.bio = formData.bio;
          if (shouldIncludeField(formData.profilePicture, originalUserData?.profilePicture)) {
            payload.profilePicture = formData.profilePicture;
            payload.profilePic = formData.profilePicture;
          }
          break;
          
        case 2: // Education
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
          break;
          
        case 3: // Skills & Languages
          if (formData.skills.length > 0 && JSON.stringify(formData.skills) !== JSON.stringify(originalUserData?.skills || [])) {
            payload.skills = formData.skills;
          }
          
          if (formData.languageSkills.length > 0 && 
              JSON.stringify(formData.languageSkills) !== JSON.stringify(originalUserData?.languageSkills || [])) {
            payload.languageSkills = formData.languageSkills;
          }
          break;
          
        case 4: // Contact Info
          if (shouldIncludeField(formData.address, originalUserData?.address)) payload.address = formData.address;
          if (shouldIncludeField(formData.country, originalUserData?.country)) payload.country = formData.country;
          if (shouldIncludeField(formData.phoneNumber, originalUserData?.phoneNumber)) payload.phoneNumber = formData.phoneNumber;
          if (shouldIncludeField(formData.email, originalUserData?.email)) payload.email = formData.email;
          if (shouldIncludeField(formData.linkedInProfile, originalUserData?.linkedInProfile)) 
            payload.linkedInProfile = formData.linkedInProfile;
          if (shouldIncludeField(formData.socialMediaLink, originalUserData?.socialMediaLink)) 
            payload.socialMediaLink = formData.socialMediaLink;
          break;
          
        case 5: // Goals & Questions
          if (shouldIncludeField(formData.goals, originalUserData?.goals)) payload.goals = formData.goals;
          if (shouldIncludeField(formData.freelanceExperience, originalUserData?.freelanceExperience)) 
            payload.freelanceExperience = formData.freelanceExperience;
            
          // Handle resume upload if present
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
                payload.resumeUrl = resumeResponse.data.url;
              }
            } catch (error) {
              console.error('Error uploading resume:', error);
              toast.error('Failed to upload resume');
              setIsLoading(false);
              return;
            }
          }
          
          // Handle questions array
          if (formData.questions.length > 0 && 
              JSON.stringify(formData.questions) !== JSON.stringify(originalUserData?.questions || [])) {
            const filteredQuestions = formData.questions.filter(q => q.trim() !== '');
            if (filteredQuestions.length > 0) {
              payload.questions = filteredQuestions;
            }
          }
          break;
          
        case 6: // Price Preference
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
          break;
          
        default:
          break;
      }
      
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
          toast.success('Section updated successfully!');
        } else {
          toast.error('Failed to update: ' + response.data.message);
        }
      } else {
        toast.info('No changes detected in this section.');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('An error occurred while updating this section');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`employee-edit-profile ${isDarkMode ? 'dark-theme' : 'light-theme'}`}>
      <ToastContainer position="top-right" autoClose={5000} theme={isDarkMode ? 'dark' : 'light'} />
      
      {/* Header with Navigation */}
      <header className="employee-edit-profile-header">
        <div className="employee-edit-profile-header-container">
          <div className="employee-edit-profile-header-left">
            <button 
              className="employee-edit-profile-nav-toggle"
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
            >
              <span className="employee-edit-profile-hamburger-icon"></span>
            </button>
            <Link to="/employee-dashboard" className="employee-edit-profile-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-edit-profile-logo-image" 
              />
            </Link>
            
            <nav className={`employee-edit-profile-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="employee-edit-profile-nav-link" style={{"--item-index": 0}}>Find Work</Link>
              <Link to="/find-jobs/saved" className="employee-edit-profile-nav-link" style={{"--item-index": 1}}>Saved Jobs</Link>
              <Link to="/find-jobs/proposals" className="employee-edit-profile-nav-link" style={{"--item-index": 2}}>Proposals</Link>
              <Link to="/help" className="employee-edit-profile-nav-link" style={{"--item-index": 3}}>Help</Link>
            </nav>
          </div>
          
          <div className="employee-edit-profile-header-right">
            <div className="employee-edit-profile-notification-container" ref={notificationsRef}>
              <button 
                className="employee-edit-profile-notification-button"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="employee-edit-profile-notification-badge">{unreadNotifications}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="employee-edit-profile-notifications-dropdown">
                  <div className="employee-edit-profile-notification-header">
                    <h3>Notifications</h3>
                    <button className="employee-edit-profile-mark-all-read" onClick={handleMarkAllAsRead}>
                      Mark all as read
                    </button>
                  </div>
                  <div className="employee-edit-profile-notification-list">
                    <div className="employee-edit-profile-notification-item employee-edit-profile-unread">
                      <div className="employee-edit-profile-notification-icon">
                        {(!formData.idVerification || 
                          !formData.idVerification.frontImage || 
                          !formData.idVerification.backImage || 
                          formData.idVerification.status === 'rejected') ? (
                          <FaRegFileAlt />
                        ) : formData.idVerification.status === 'verified' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaClock />
                        )}
                      </div>
                      <div className="employee-edit-profile-notification-content">
                        <p>
                          {(!formData.idVerification || 
                            !formData.idVerification.frontImage || 
                            !formData.idVerification.backImage || 
                            formData.idVerification.status === 'rejected') ? (
                            "Please verify your account"
                          ) : formData.idVerification.status === 'verified' ? (
                            "Your profile has been verified!"
                          ) : (
                            "Your verification is pending approval"
                          )}
                        </p>
                        <span className="employee-edit-profile-notification-time">2 hours ago</span>
                      </div>
                    </div>
                    <div className="employee-edit-profile-notification-item employee-edit-profile-unread">
                      <div className="employee-edit-profile-notification-icon">
                        <FaRegFileAlt />
                      </div>
                      <div className="employee-edit-profile-notification-content">
                        <p>New job matching your skills is available</p>
                        <span className="employee-edit-profile-notification-time">1 day ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="employee-edit-profile-notification-footer">
                    <Link to="/notifications">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="employee-edit-profile-theme-toggle"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>

            <div className="employee-edit-profile-profile-dropdown" ref={profileDropdownRef}>
              <button 
                className="employee-edit-profile-profile-button" 
                onClick={toggleProfileDropdown}
                aria-label="User profile"
              >
                {formData.profilePicture ? (
                  <img 
                    src={formData.profilePicture}
                    alt="Profile"
                    className="employee-edit-profile-profile-avatar"
                  />
                ) : (
                  <FaUserCircle className="employee-edit-profile-profile-avatar-icon" />
                )}
                <FaChevronDown className={`employee-edit-profile-dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="employee-edit-profile-profile-menu">
                  <div className="employee-edit-profile-profile-menu-header">
                    <div className="employee-edit-profile-profile-menu-avatar">
                      {formData.profilePicture ? (
                        <img 
                          src={formData.profilePicture}
                          alt={`${formData.name}'s profile`}
                        />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="employee-edit-profile-profile-menu-info">
                      <h4>{formData.name || 'User'}</h4>
                      <span className="employee-edit-profile-profile-status">
                        {!formData.idVerification ? (
                          'Not Verified'
                        ) : formData.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="employee-edit-profile-verified-icon" /> Verified</>
                        ) : formData.idVerification.status === 'pending' && formData.idVerification.frontImage && formData.idVerification.backImage ? (
                          <><FaClock className="employee-edit-profile-pending-icon" /> Verification Pending</>
                        ) : formData.idVerification.status === 'rejected' ? (
                          <>Verification Rejected</>
                        ) : (
                          'Not Verified'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="employee-edit-profile-profile-menu-links">
                    <button 
                      className="employee-edit-profile-profile-link"
                      onClick={handleNavigateToProfile}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {(!formData.idVerification || 
                      !formData.idVerification.frontImage || 
                      !formData.idVerification.backImage || 
                      formData.idVerification.status === 'rejected') && (
                      <button 
                        className="employee-edit-profile-profile-link"
                        onClick={handleVerifyAccount}
                      >
                        <FaShieldAlt /> Verify Account
                      </button>
                    )}
                    
                    <button 
                      className="employee-edit-profile-profile-link"
                      onClick={() => {
                        setShowRatingModal(true);
                        setShowProfileDropdown(false);
                      }}
                    >
                      <FaStar /> My Ratings & Reviews
                    </button>
                    
                    <button 
                      className="employee-edit-profile-profile-link"
                      onClick={() => navigate('/settings')}
                    >
                      <FaTools /> Settings
                    </button>
                    <button 
                      className="employee-edit-profile-profile-link"
                      onClick={handleLogout}
                    >
                      <FaArrowLeft /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main className="employee-edit-profile-main">
        <div className="employee-edit-profile-container">
          <div className="employee-edit-profile-sidebar">
            <h2 className="employee-edit-profile-sidebar-title">Profile Completion</h2>
            
            <div className="employee-edit-profile-completion">
              <div className="employee-edit-profile-completion-bar">
                <div 
                  className="employee-edit-profile-completion-progress" 
                  style={{ width: `${Math.min(highestStepReached / 6 * 100, 100)}%` }}
                ></div>
              </div>
              <p className="employee-edit-profile-completion-text">
                Step {step} of 6 • {Math.round(highestStepReached / 6 * 100)}% Complete
              </p>
            </div>
            
            <nav className="employee-edit-profile-steps-nav">
              <button 
                className={`employee-edit-profile-step-link ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}
                onClick={() => setStep(1)}
              >
                <span className="employee-edit-profile-step-number">1</span>
                <span className="employee-edit-profile-step-text">Basic Info</span>
                {step > 1 && <FaCheck className="employee-edit-profile-step-check" />}
              </button>
              
              <button 
                className={`employee-edit-profile-step-link ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}
                onClick={() => setStep(2)}
              >
                <span className="employee-edit-profile-step-number">2</span>
                <span className="employee-edit-profile-step-text">Education</span>
                {step > 2 && <FaCheck className="employee-edit-profile-step-check" />}
              </button>
              
              <button 
                className={`employee-edit-profile-step-link ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}
                onClick={() => setStep(3)}
              >
                <span className="employee-edit-profile-step-number">3</span>
                <span className="employee-edit-profile-step-text">Skills</span>
                {step > 3 && <FaCheck className="employee-edit-profile-step-check" />}
              </button>
              
              <button 
                className={`employee-edit-profile-step-link ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}
                onClick={() => setStep(4)}
              >
                <span className="employee-edit-profile-step-number">4</span>
                <span className="employee-edit-profile-step-text">Contact</span>
                {step > 4 && <FaCheck className="employee-edit-profile-step-check" />}
              </button>
              
              <button 
                className={`employee-edit-profile-step-link ${step === 5 ? 'active' : step > 5 ? 'completed' : ''}`}
                onClick={() => setStep(5)}
              >
                <span className="employee-edit-profile-step-number">5</span>
                <span className="employee-edit-profile-step-text">Goals</span>
                {step > 5 && <FaCheck className="employee-edit-profile-step-check" />}
              </button>
              
              <button 
                className={`employee-edit-profile-step-link ${step === 6 ? 'active' : ''}`}
                onClick={() => setStep(6)}
              >
                <span className="employee-edit-profile-step-number">6</span>
                <span className="employee-edit-profile-step-text">Price</span>
                {step > 6 && <FaCheck className="employee-edit-profile-step-check" />}
              </button>
            </nav>
            
            <div className="employee-edit-profile-tips">
              <h3 className="employee-edit-profile-tips-title">Profile Tips</h3>
              <ul className="employee-edit-profile-tips-list">
                <li>
                  <FaClipboardCheck /> A complete profile increases your chances of getting hired
                </li>
                <li>
                  <FaStar /> Include relevant skills to match with the right jobs
                </li>
                <li>
                  <FaFileAlt /> Upload a professional profile photo to build trust
                </li>
                <li>
                  <FaBriefcase /> Share your experience and expertise clearly
                </li>
              </ul>
            </div>
          </div>
          
          <div className="employee-edit-profile-content">
            <h1 className="employee-edit-profile-title">
              Complete Your Professional Profile
            </h1>

            <div className="employee-edit-profile-form-container">
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="employee-edit-profile-form-section">
                  <div className="employee-edit-profile-section-header">
                    <FaUserCircle className="employee-edit-profile-section-icon" />
                    <div className="employee-edit-profile-section-title-container">
                      <h2 className="employee-edit-profile-section-title">Basic Information</h2>
                      <p className="employee-edit-profile-section-subtitle">
                        Let potential clients know who you are
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-grid">
                    <div className="employee-edit-profile-form-group photo-upload">
                      <label>Profile Picture</label>
                      <div className="employee-edit-profile-photo-upload">
                        <div className="employee-edit-profile-photo-container">
                          {formData.profilePicture || formData.profilePicPreview ? (
                            <img
                              src={formData.profilePicture || formData.profilePicPreview}
                              alt="Profile"
                              className="employee-edit-profile-photo-preview"
                            />
                          ) : (
                            <div className="employee-edit-profile-photo-placeholder">
                              <FaUserCircle />
                            </div>
                          )}
                        </div>
                        <div className="employee-edit-profile-photo-actions">
                          <label className="employee-edit-profile-upload-button">
                            <span className="button-text">{formData.profilePicture ? 'Change Photo' : 'Upload Photo'}</span>
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(e, 'profilePic')}
                              accept="image/*"
                            />
                          </label>
                          <p className="employee-edit-profile-photo-tip">
                            Professional photo recommended. Max size: 5MB.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="name">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group full-width">
                      <label htmlFor="bio">Professional Bio</label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Write a short introduction about yourself, your expertise, and what you can offer clients"
                        rows="4"
                        className="employee-edit-profile-textarea"
                      />
                      <p className="employee-edit-profile-form-hint">
                        A compelling bio helps you stand out to potential clients.
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-actions">
                    <button 
                      type="button" 
                      className="employee-edit-profile-button secondary" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                    <div className="employee-edit-profile-button-group">
                      <button 
                        type="button" 
                        className="employee-edit-profile-button save" 
                        onClick={handleSaveSection}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="employee-edit-profile-button primary" 
                        onClick={handleNext}
                      >
                        Next: Education <FaAngleRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: Education */}
              {step === 2 && (
                <div className="employee-edit-profile-form-section">
                  <div className="employee-edit-profile-section-header">
                    <FaGraduationCap className="employee-edit-profile-section-icon" />
                    <div className="employee-edit-profile-section-title-container">
                      <h2 className="employee-edit-profile-section-title">Education Background</h2>
                      <p className="employee-edit-profile-section-subtitle">
                        Share your educational history and credentials
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-education-container">
                    <div className="employee-edit-profile-education-card">
                      <h3 className="employee-edit-profile-education-level">School</h3>
                      <div className="employee-edit-profile-education-form">
                        <div className="employee-edit-profile-form-group">
                          <label>School Name</label>
                          <input
                            type="text"
                            value={formData.education.school.name}
                            onChange={(e) => handleEducationChange(e, 'school', 'name')}
                            placeholder="Enter school name"
                            className="employee-edit-profile-input"
                          />
                        </div>
                        
                        <div className="employee-edit-profile-year-group">
                          <div className="employee-edit-profile-form-group">
                            <label>Start Year</label>
                            <input
                              type="number"
                              min="1900"
                              max={currentYear}
                              value={formData.education.school.enteringYear}
                              onChange={(e) => handleEducationChange(e, 'school', 'enteringYear')}
                              placeholder="Year"
                              className="employee-edit-profile-input"
                            />
                          </div>
                          
                          <div className="employee-edit-profile-form-group">
                            <label>End Year</label>
                            <input
                              type="number"
                              min="1900"
                              max={currentYear + 10}
                              value={formData.education.school.passingYear}
                              onChange={(e) => handleEducationChange(e, 'school', 'passingYear')}
                              placeholder="Year"
                              className="employee-edit-profile-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="employee-edit-profile-education-card">
                      <h3 className="employee-edit-profile-education-level">College</h3>
                      <div className="employee-edit-profile-education-form">
                        <div className="employee-edit-profile-form-group">
                          <label>College Name</label>
                          <input
                            type="text"
                            value={formData.education.college.name}
                            onChange={(e) => handleEducationChange(e, 'college', 'name')}
                            placeholder="Enter college name"
                            className="employee-edit-profile-input"
                          />
                        </div>
                        
                        <div className="employee-edit-profile-year-group">
                          <div className="employee-edit-profile-form-group">
                            <label>Start Year</label>
                            <input
                              type="number"
                              min="1900"
                              max={currentYear}
                              value={formData.education.college.enteringYear}
                              onChange={(e) => handleEducationChange(e, 'college', 'enteringYear')}
                              placeholder="Year"
                              className="employee-edit-profile-input"
                            />
                          </div>
                          
                          <div className="employee-edit-profile-form-group">
                            <label>End Year</label>
                            <input
                              type="number"
                              min="1900"
                              max={currentYear + 10}
                              value={formData.education.college.passingYear}
                              onChange={(e) => handleEducationChange(e, 'college', 'passingYear')}
                              placeholder="Year"
                              className="employee-edit-profile-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="employee-edit-profile-education-card">
                      <h3 className="employee-edit-profile-education-level">University</h3>
                      <div className="employee-edit-profile-education-form">
                        <div className="employee-edit-profile-form-group">
                          <label>University Name</label>
                          <input
                            type="text"
                            value={formData.education.university.name}
                            onChange={(e) => handleEducationChange(e, 'university', 'name')}
                            placeholder="Enter university name"
                            className="employee-edit-profile-input"
                          />
                        </div>
                        
                        <div className="employee-edit-profile-year-group">
                          <div className="employee-edit-profile-form-group">
                            <label>Start Year</label>
                            <input
                              type="number"
                              min="1900"
                              max={currentYear}
                              value={formData.education.university.enteringYear}
                              onChange={(e) => handleEducationChange(e, 'university', 'enteringYear')}
                              placeholder="Year"
                              className="employee-edit-profile-input"
                            />
                          </div>
                          
                          <div className="employee-edit-profile-form-group">
                            <label>End Year</label>
                            <input
                              type="number"
                              min="1900"
                              max={currentYear + 10}
                              value={formData.education.university.passingYear}
                              onChange={(e) => handleEducationChange(e, 'university', 'passingYear')}
                              placeholder="Year"
                              className="employee-edit-profile-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-actions">
                    <button 
                      type="button" 
                      className="employee-edit-profile-button secondary" 
                      onClick={handlePrevious}
                    >
                      <FaArrowLeft /> Back: Basic Info
                    </button>
                    <div className="employee-edit-profile-button-group">
                      <button 
                        type="button" 
                        className="employee-edit-profile-button save" 
                        onClick={handleSaveSection}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="employee-edit-profile-button primary" 
                        onClick={handleNext}
                      >
                        Next: Skills <FaAngleRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Skills and Languages */}
              {step === 3 && (
                <div className="employee-edit-profile-form-section">
                  <div className="employee-edit-profile-section-header">
                    <FaCode className="employee-edit-profile-section-icon" />
                    <div className="employee-edit-profile-section-title-container">
                      <h2 className="employee-edit-profile-section-title">Skills & Languages</h2>
                      <p className="employee-edit-profile-section-subtitle">
                        Add your professional skills and language proficiencies
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-skills-container">
                    <div className="employee-edit-profile-card">
                      <h3 className="employee-edit-profile-card-title">Professional Skills</h3>
                      
                      <div className="employee-edit-profile-skill-input-group">
                        <select 
                          value={selectedSkill}
                          onChange={(e) => setSelectedSkill(e.target.value)}
                          className="employee-edit-profile-select"
                        >
                          <option value="">Select a skill</option>
                          {skillsList.map((skill) => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                        <button 
                          type="button" 
                          className="employee-edit-profile-add-button"
                          onClick={handleAddSkill}
                          disabled={!selectedSkill}
                        >
                          Add Skill
                        </button>
                      </div>
                      
                      {formData.skills.length > 0 ? (
                        <div className="employee-edit-profile-skills-list">
                          {formData.skills.map((skill) => (
                            <div key={skill} className="employee-edit-profile-skill-tag">
                              {skill}
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSkill(skill)}
                                className="employee-edit-profile-remove-tag"
                                aria-label={`Remove ${skill}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="employee-edit-profile-empty-state">
                          No skills added yet. Add skills to help clients find you.
                        </p>
                      )}
                      
                      <div className="employee-edit-profile-custom-skill">
                        <h4>Add Custom Skill</h4>
                        <div className="employee-edit-profile-skill-input-group">
                          <input 
                            type="text" 
                            id="otherSkill"
                            placeholder="Enter a custom skill"
                            className="employee-edit-profile-input"
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
                            className="employee-edit-profile-add-button" 
                            onClick={() => {
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
                      </div>
                    </div>
                    
                    <div className="employee-edit-profile-card">
                      <h3 className="employee-edit-profile-card-title">Language Proficiencies</h3>
                      
                      <div className="employee-edit-profile-language-input-group">
                        <select 
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="employee-edit-profile-select"
                        >
                          <option value="">Select language</option>
                          {languagesList.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                        
                        <select 
                          value={selectedProficiency}
                          onChange={(e) => setSelectedProficiency(e.target.value)}
                          className="employee-edit-profile-select"
                        >
                          <option value="">Select proficiency</option>
                          {proficiencyLevels.map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </select>
                        
                        <button 
                          type="button" 
                          className="employee-edit-profile-add-button"
                          onClick={handleAddLanguage}
                          disabled={!selectedLanguage || !selectedProficiency}
                        >
                          Add
                        </button>
                      </div>
                      
                      {formData.languageSkills.length > 0 ? (
                        <div className="employee-edit-profile-languages-list">
                          {formData.languageSkills.map((lang) => (
                            <div key={lang.language} className="employee-edit-profile-language-tag">
                              <span className="language-name">{lang.language}</span>
                              <span className="language-level">{lang.proficiency}</span>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveLanguage(lang.language)}
                                className="employee-edit-profile-remove-tag"
                                aria-label={`Remove ${lang.language}`}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="employee-edit-profile-empty-state">
                          No languages added yet. Add languages to show your communication abilities.
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-actions">
                    <button 
                      type="button" 
                      className="employee-edit-profile-button secondary" 
                      onClick={handlePrevious}
                    >
                      <FaArrowLeft /> Back: Education
                    </button>
                    <div className="employee-edit-profile-button-group">
                      <button 
                        type="button" 
                        className="employee-edit-profile-button save" 
                        onClick={handleSaveSection}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="employee-edit-profile-button primary" 
                        onClick={handleNext}
                      >
                        Next: Contact <FaAngleRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Contact Info */}
              {step === 4 && (
                <div className="employee-edit-profile-form-section">
                  <div className="employee-edit-profile-section-header">
                    <FaMapMarkerAlt className="employee-edit-profile-section-icon" />
                    <div className="employee-edit-profile-section-title-container">
                      <h2 className="employee-edit-profile-section-title">Contact Information</h2>
                      <p className="employee-edit-profile-section-subtitle">
                        How clients can reach you and connect with your professional networks
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-contact-grid">
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="email">
                        <FaEnvelope className="employee-edit-profile-field-icon" /> Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Your email address"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="phoneNumber">
                        <FaPhoneAlt className="employee-edit-profile-field-icon" /> Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        placeholder="Your phone number"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="address">
                        <FaMapMarkerAlt className="employee-edit-profile-field-icon" /> Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Your address"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="country">Country</label>
                      <input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="Your country"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="linkedInProfile">
                        <FaLinkedinIn className="employee-edit-profile-field-icon" /> LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        id="linkedInProfile"
                        name="linkedInProfile"
                        value={formData.linkedInProfile}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/in/your-profile"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="socialMediaLink">
                        <FaGlobe className="employee-edit-profile-field-icon" /> Other Social Media
                      </label>
                      <input
                        type="url"
                        id="socialMediaLink"
                        name="socialMediaLink"
                        value={formData.socialMediaLink}
                        onChange={handleInputChange}
                        placeholder="https://yourportfolio.com"
                        className="employee-edit-profile-input"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-contact-note">
                      <FaInfoCircle />
                      <p>
                        Your contact information is only shared with clients you're actively working with.
                        We prioritize your privacy and security.
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-actions">
                    <button 
                      type="button" 
                      className="employee-edit-profile-button secondary" 
                      onClick={handlePrevious}
                    >
                      <FaArrowLeft /> Back: Skills
                    </button>
                    <div className="employee-edit-profile-button-group">
                      <button 
                        type="button" 
                        className="employee-edit-profile-button save" 
                        onClick={handleSaveSection}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="employee-edit-profile-button primary" 
                        onClick={handleNext}
                      >
                        Next: Goals <FaAngleRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 5: Goals */}
              {step === 5 && (
                <div className="employee-edit-profile-form-section">
                  <div className="employee-edit-profile-section-header">
                    <FaBullseye className="employee-edit-profile-section-icon" />
                    <div className="employee-edit-profile-section-title-container">
                      <h2 className="employee-edit-profile-section-title">Career Goals & Experience</h2>
                      <p className="employee-edit-profile-section-subtitle">
                        Share your career aspirations and relevant experience
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-goals-container">
                    <div className="employee-edit-profile-experience-section">
                      <h3 className="employee-edit-profile-subsection-title">Freelance Experience</h3>
                      <div className="employee-edit-profile-experience-options">
                        <label className={`employee-edit-profile-experience-option ${formData.freelanceExperience === "Yes, I have some experiences" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="freelanceExperience"
                            value="Yes, I have some experiences"
                            checked={formData.freelanceExperience === "Yes, I have some experiences"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-experience-content">
                            <FaBriefcase className="employee-edit-profile-experience-icon" />
                            <div className="employee-edit-profile-experience-text">
                              <h4>Yes, I have some experiences</h4>
                              <p>I've completed a few freelance projects before</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`employee-edit-profile-experience-option ${formData.freelanceExperience === "No, I have never" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="freelanceExperience"
                            value="No, I have never"
                            checked={formData.freelanceExperience === "No, I have never"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-experience-content">
                            <FaRegFileAlt className="employee-edit-profile-experience-icon" />
                            <div className="employee-edit-profile-experience-text">
                              <h4>No, I have never</h4>
                              <p>This will be my first time freelancing</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`employee-edit-profile-experience-option ${formData.freelanceExperience === "I'm an expert" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="freelanceExperience"
                            value="I'm an expert"
                            checked={formData.freelanceExperience === "I'm an expert"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-experience-content">
                            <FaCheckCircle className="employee-edit-profile-experience-icon" />
                            <div className="employee-edit-profile-experience-text">
                              <h4>I'm an expert</h4>
                              <p>I have extensive freelancing experience</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label htmlFor="goals">Your Career Goals</label>
                      <textarea
                        id="goals"
                        name="goals"
                        value={formData.goals}
                        onChange={handleInputChange}
                        placeholder="Describe your career goals and aspirations"
                        rows="4"
                        className="employee-edit-profile-textarea"
                      />
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label>Questions for Employers</label>
                      <p className="employee-edit-profile-form-hint">
                        Add questions you'd like employers to answer before you apply to their jobs
                      </p>
                      
                      <div className="employee-edit-profile-questions-container">
                        {formData.questions.map((question, index) => (
                          <div key={index} className="employee-edit-profile-question-item">
                            <input
                              type="text"
                              value={question}
                              onChange={(e) => handleQuestionChange(index, e.target.value)}
                              placeholder="Enter your question"
                              className="employee-edit-profile-input employee-edit-profile-question-input"
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveQuestion(index)}
                              className="employee-edit-profile-remove-button"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={handleAddQuestion}
                        className="employee-edit-profile-add-button"
                        style={{marginTop: '1rem'}}
                      >
                        Add Question
                      </button>
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label>Resume Upload (Optional)</label>
                      <label className="employee-edit-profile-upload-button">
                        {formData.resume ? formData.resume.name : 'Upload Resume'}
                        <input
                          type="file"
                          onChange={handleResumeUpload}
                          accept=".pdf,.jpg,.png"
                          style={{display: 'none'}}
                        />
                      </label>
                      <p className="employee-edit-profile-form-hint">Accepted file types: PDF, JPG, PNG</p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-actions">
                    <button 
                      type="button" 
                      className="employee-edit-profile-button secondary" 
                      onClick={handlePrevious}
                    >
                      <FaArrowLeft /> Back: Contact
                    </button>
                    <div className="employee-edit-profile-button-group">
                      <button 
                        type="button" 
                        className="employee-edit-profile-button save" 
                        onClick={handleSaveSection}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        className="employee-edit-profile-button primary" 
                        onClick={handleNext}
                      >
                        Next: Price <FaAngleRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 6: Price Preference */}
              {step === 6 && (
                <div className="employee-edit-profile-form-section">
                  <div className="employee-edit-profile-section-header">
                    <FaDollarSign className="employee-edit-profile-section-icon" />
                    <div className="employee-edit-profile-section-title-container">
                      <h2 className="employee-edit-profile-section-title">Price Preference</h2>
                      <p className="employee-edit-profile-section-subtitle">
                        Set your rates and availability to help clients find you for projects that match your expectations
                      </p>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-pricing-container">
                    <div className="employee-edit-profile-form-group">
                      <label>How would you like to be paid?</label>
                      <div className="employee-edit-profile-payment-options">
                        <label className={`employee-edit-profile-payment-option ${formData.paymentType === "fixed" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="paymentType"
                            value="fixed"
                            checked={formData.paymentType === "fixed"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-payment-content">
                            <FaRegFileAlt className="employee-edit-profile-payment-icon" />
                            <div className="employee-edit-profile-payment-text">
                              <h4>Fixed Rate</h4>
                              <p>Get paid a set price for the entire project</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`employee-edit-profile-payment-option ${formData.paymentType === "hourly" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="paymentType"
                            value="hourly"
                            checked={formData.paymentType === "hourly"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-payment-content">
                            <FaClock className="employee-edit-profile-payment-icon" />
                            <div className="employee-edit-profile-payment-text">
                              <h4>Hourly Rate</h4>
                              <p>Get paid for the time you put into the project</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    {formData.paymentType === "fixed" && (
                      <div className="employee-edit-profile-form-group">
                        <label htmlFor="fixedRate">Your Fixed Rate (USD)</label>
                        <div className="employee-edit-profile-rate-input-group">
                          <span className="employee-edit-profile-currency-symbol">$</span>
                          <input
                            type="number"
                            id="fixedRate"
                            name="fixedRate"
                            value={formData.fixedRate}
                            onChange={handleInputChange}
                            className="employee-edit-profile-input employee-edit-profile-rate-input"
                            min="0"
                            step="1"
                            placeholder="Enter your fixed rate"
                          />
                          <div className="employee-edit-profile-increment-buttons">
                            <button 
                              type="button" 
                              onClick={() => setFormData({...formData, fixedRate: (parseInt(formData.fixedRate) || 0) + 1})}
                              className="employee-edit-profile-increment-button"
                            >
                              ▲
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setFormData({...formData, fixedRate: Math.max((parseInt(formData.fixedRate) || 0) - 1, 0)})}
                              className="employee-edit-profile-increment-button"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                        <p className="employee-edit-profile-rate-hint">Set your average price for a typical project</p>
                      </div>
                    )}
                    
                    {formData.paymentType === "hourly" && (
                      <div className="employee-edit-profile-form-group">
                        <label htmlFor="hourlyRate">Your Hourly Rate (USD)</label>
                        <div className="employee-edit-profile-rate-input-group">
                          <span className="employee-edit-profile-currency-symbol">$</span>
                          <input
                            type="number"
                            id="hourlyRate"
                            name="hourlyRate"
                            value={formData.hourlyRate}
                            onChange={handleInputChange}
                            className="employee-edit-profile-input employee-edit-profile-rate-input"
                            min="0"
                            step="0.5"
                            placeholder="Enter your hourly rate"
                          />
                          <div className="employee-edit-profile-increment-buttons">
                            <button 
                              type="button" 
                              onClick={() => setFormData({...formData, hourlyRate: ((parseFloat(formData.hourlyRate) || 0) + 0.5).toFixed(1)})}
                              className="employee-edit-profile-increment-button"
                            >
                              ▲
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setFormData({...formData, hourlyRate: Math.max((parseFloat(formData.hourlyRate) || 0) - 0.5, 0).toFixed(1)})}
                              className="employee-edit-profile-increment-button"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                        <p className="employee-edit-profile-rate-hint">Clients will see this rate on your profile</p>
                      </div>
                    )}
                    
                    <div className="employee-edit-profile-form-group">
                      <label>Weekly Availability</label>
                      <div className="employee-edit-profile-availability-options">
                        <label className={`employee-edit-profile-availability-option ${formData.weeklyAvailability === "more than 30 hours/week" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="weeklyAvailability"
                            value="more than 30 hours/week"
                            checked={formData.weeklyAvailability === "more than 30 hours/week"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-availability-content">
                            <FaClock className="employee-edit-profile-availability-icon" />
                            <div className="employee-edit-profile-availability-text">
                              <h4>More than 30 hours/week</h4>
                              <p>I can work full-time hours</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`employee-edit-profile-availability-option ${formData.weeklyAvailability === "less than 30 hours/week" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="weeklyAvailability"
                            value="less than 30 hours/week"
                            checked={formData.weeklyAvailability === "less than 30 hours/week"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-availability-content">
                            <FaClock className="employee-edit-profile-availability-icon" />
                            <div className="employee-edit-profile-availability-text">
                              <h4>Less than 30 hours/week</h4>
                              <p>I can work part-time hours</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`employee-edit-profile-availability-option ${formData.weeklyAvailability === "I'm open to offers" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="weeklyAvailability"
                            value="I'm open to offers"
                            checked={formData.weeklyAvailability === "I'm open to offers"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-availability-content">
                            <FaCommentDots className="employee-edit-profile-availability-icon" />
                            <div className="employee-edit-profile-availability-text">
                              <h4>I'm open to offers</h4>
                              <p>Let's discuss what works for both of us</p>
                            </div>
                          </div>
                        </label>
                        
                        <label className={`employee-edit-profile-availability-option ${formData.weeklyAvailability === "none" ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="weeklyAvailability"
                            value="none"
                            checked={formData.weeklyAvailability === "none"}
                            onChange={handleInputChange}
                          />
                          <div className="employee-edit-profile-availability-content">
                            <FaTimes className="employee-edit-profile-availability-icon" />
                            <div className="employee-edit-profile-availability-text">
                              <h4>None</h4>
                              <p>I'm not currently available</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="employee-edit-profile-form-group">
                      <label>Contract-to-hire Opportunities</label>
                      <div className="employee-edit-profile-contract-to-hire">
                        <label className={`employee-edit-profile-contract-option ${formData.openToContractToHire ? 'selected' : ''}`}>
                          <input
                            type="checkbox"
                            name="openToContractToHire"
                            checked={formData.openToContractToHire}
                            onChange={(e) => setFormData({...formData, openToContractToHire: e.target.checked})}
                          />
                          <div className="employee-edit-profile-contract-content">
                            <FaInfoCircle className="employee-edit-profile-contract-icon" />
                            <div className="employee-edit-profile-contract-text">
                              <h4>I'm open to contract-to-hire opportunities</h4>
                              <p>This means you'll start with a contract and may later explore a full-time option</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="employee-edit-profile-form-actions">
                    <button 
                      type="button" 
                      className="employee-edit-profile-button secondary" 
                      onClick={handlePrevious}
                    >
                      <FaArrowLeft /> Back: Goals
                    </button>
                    <button 
                      type="button" 
                      className="employee-edit-profile-button primary" 
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : <><FaCheck /> Complete Profile</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {isLoading && (
        <div className="employee-edit-profile-loading-overlay">
          <div className="employee-edit-profile-spinner"></div>
        </div>
      )}
      
      {showRatingModal && (
        <RatingModal
          isOpen={true}
          onClose={() => setShowRatingModal(false)}
          viewOnly={true}
        />
      )}
      
      {/* Add professional footer */}
      <footer className="employee-edit-profile-footer">
        <div className="employee-edit-profile-footer-container">
          <div className="employee-edit-profile-footer-grid">
            <div className="employee-edit-profile-footer-column">
              <h3>For Freelancers</h3>
              <ul>
                <li><Link to="/find-jobs">Find Work</Link></li>
                <li><Link to="/resources">Resources</Link></li>
                <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
                <li><Link to="/freelancer-forum">Community Forum</Link></li>
              </ul>
            </div>
            
            <div className="employee-edit-profile-footer-column">
              <h3>Resources</h3>
              <ul>
                <li><Link to="/help-center">Help Center</Link></li>
                <li><Link to="/webinars">Webinars</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/api-docs">Developer API</Link></li>
              </ul>
            </div>
            
            <div className="employee-edit-profile-footer-column">
              <h3>Company</h3>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/press">Press</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="employee-edit-profile-footer-bottom">
            <div className="employee-edit-profile-footer-logo">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="employee-edit-profile-footer-logo-image" 
              />
            </div>
            
            <div className="employee-edit-profile-footer-links">
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/accessibility">Accessibility</Link>
            </div>
            
            <div className="employee-edit-profile-footer-social">
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
          
          <div className="employee-edit-profile-footer-copyright">
            <p>&copy; {new Date().getFullYear()} Next Youth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployeeProfile;
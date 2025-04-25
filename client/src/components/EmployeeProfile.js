import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls
// import './EmployeeProfile.css';

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
  const [step, setStep] = useState(0); // Start with the Profile Completion page
  const [formData, setFormData] = useState({
    bio: '',
    education: {
      school: { name: '', enteringYear: '', passingYear: '' },
      college: { name: '', enteringYear: '', passingYear: '' },
      university: { name: '', enteringYear: '', passingYear: '' },
    },
    skills: [],
    languageSkills: [],
    profilePic: null,          // The file object for upload
    profilePicPreview: null,   // Local preview URL
    profilePicture: '',        // The URL from server
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
  });

  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/auth/me', { withCredentials: true });
        if (response.data.success) {
          setFormData({
            ...formData,
            ...response.data.user,
            education: response.data.user.education || formData.education, // Ensure education is initialized
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

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

  const handleAddSkill = (skill) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
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

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    const allowedExtensions = ['jpg', 'png', 'pdf'];

    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        alert('Invalid file type. Please upload a .jpg, .png, or .pdf file.');
        return;
      }
      setFormData({ ...formData, resume: file });
      alert(`Resume uploaded successfully: ${file.name}`);
    }
  };

  const validateLinkedInLink = (url) => {
    const linkedInRegex = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/.+$/i;
    return linkedInRegex.test(url);
  };

  const validateSocialMediaLink = (url) => {
    const socialMediaRegex = /^(https?:\/\/)?(www\.)?(facebook|twitter|instagram|linkedin|tiktok|youtube)\.com\/.+$/i;
    return socialMediaRegex.test(url);
  };

  const handleNext = () => {
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      // Send the updated profile data to the backend
      const response = await axios.put(
        'http://localhost:4000/api/auth/update-profile',
        {
          userId: formData._id,
          profileData: {
            bio: formData.bio,
            education: formData.education,
            skills: formData.skills,
            languageSkills: formData.languageSkills,
            profilePicture: formData.profilePicture, // Use the URL from server, not the file object
            address: formData.address,
            country: formData.country,
            phoneNumber: formData.phoneNumber,
            name: formData.name,
            email: formData.email,
            goals: formData.goals,
            questions: formData.questions,
            linkedInProfile: formData.linkedInProfile,
            socialMediaLink: formData.socialMediaLink,
          },
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Profile updated successfully!');
        navigate('/employee-dashboard');
      } else {
        alert('Failed to update profile: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('An error occurred while updating your profile. Please try again.');
    }
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (field === 'profilePic') {
      // Create a preview URL for the UI
      setFormData({
        ...formData,
        profilePicPreview: URL.createObjectURL(file),
        profilePic: file  // Store the file object temporarily
      });
      
      try {
        // Upload the file to the server
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        
        const response = await axios.post(
          'http://localhost:4000/api/auth/upload-profile-picture',
          formDataObj,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          // Store the returned URL from server
          setFormData(prev => ({
            ...prev,
            profilePicture: response.data.url  // This matches the field name in userModel
          }));
          console.log('Profile picture uploaded successfully:', response.data.url);
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        alert('Failed to upload profile picture. Please try again.');
      }
    } else {
      // For other file uploads like resume
      setFormData({ ...formData, [field]: file });
    }
  };

  const calculateProfileCompletion = () => {
    let completedFields = 0;
    const totalFields = 10;

    if (formData.bio) completedFields++;
    if (formData.education?.school?.name) completedFields++;
    if (formData.education?.college?.name) completedFields++;
    if (formData.education?.university?.name) completedFields++;
    if (formData.skills.length > 0) completedFields++;
    if (formData.languageSkills.length > 0) completedFields++;
    if (formData.profilePicture || formData.profilePic) completedFields++; // Check both
    if (formData.address) completedFields++;
    if (formData.country) completedFields++;
    if (formData.phoneNumber) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  return (
    <div className="dashboard-container">
      {step === 0 && (
        <div className="profile-container">
          <h1>Profile Completion</h1>
          <div className="profile-info">
            {formData.profilePicPreview ? (
              <img
                src={formData.profilePicPreview}
                alt="Profile"
                className="profile-pic"
              />
            ) : formData.profilePicture ? (
              <img
                src={formData.profilePicture}
                alt="Profile"
                className="profile-pic"
              />
            ) : (
              <div className="profile-pic-placeholder">No Picture</div>
            )}
            <p><strong>Name:</strong> {formData.name}</p>
            <p><strong>Email:</strong> {formData.email}</p>
          </div>
          <p>Your profile is {calculateProfileCompletion()}% complete.</p>
          <div className="button-container">
            <button
              className="action-button"
              onClick={() => setStep(1)} // Redirect to Basic Information page
            >
              Edit My Profile
            </button>
            <button
              className="action-button go-back-button"
              onClick={() => navigate(-1)} // Go back to the previous page
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h1>Step 1: Basic Information</h1>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Write a short bio about yourself"
            rows="4"
            className="textarea-field"
          />
          <h2>Education</h2>
          {['school', 'college', 'university'].map((level) => (
            <div key={level} className="education-section">
              <h3>{level.charAt(0).toUpperCase() + level.slice(1)}</h3>
              <input
                type="text"
                placeholder={`${level.charAt(0).toUpperCase() + level.slice(1)} Name`}
                value={formData.education[level].name}
                onChange={(e) => handleEducationChange(e, level, 'name')}
                className="input-field"
              />
              <label>Entering Year</label>
              <input
                type="date"
                value={formData.education[level].enteringYear}
                onChange={(e) => handleEducationChange(e, level, 'enteringYear')}
                className="input-field"
              />
              <label>Passing Year</label>
              <input
                type="date"
                value={formData.education[level].passingYear}
                onChange={(e) => handleEducationChange(e, level, 'passingYear')}
                className="input-field"
              />
            </div>
          ))}
          <button className="action-button" onClick={handlePrevious}>
            Previous
          </button>
          <button className="action-button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h1>Step 2: Skills</h1>
          <select onChange={(e) => handleAddSkill(e.target.value)} className="select-field">
            <option value="">Select a skill</option>
            {skillsList.map((skill, index) => (
              <option key={index} value={skill}>{skill}</option>
            ))}
          </select>
          <div className="skills-container">
            {formData.skills.map((skill, index) => (
              <div key={index} className="skill-item">
                {skill}
                <button className="remove-button" onClick={() => handleRemoveSkill(skill)}>✕</button>
              </div>
            ))}
          </div>
          <h2>Add Language Skills</h2>
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="select-field">
            <option value="">Select a language</option>
            {languagesList.map((lang, index) => (
              <option key={index} value={lang}>{lang}</option>
            ))}
          </select>
          <select value={selectedProficiency} onChange={(e) => setSelectedProficiency(e.target.value)} className="select-field">
            <option value="">Select proficiency</option>
            {proficiencyLevels.map((level, index) => (
              <option key={index} value={level}>{level}</option>
            ))}
          </select>
          <button className="action-button" onClick={handleAddLanguage}>Add Language</button>
          <div className="languages-container">
            {formData.languageSkills.map((lang, index) => (
              <div key={index} className="language-item">
                {lang.language} ({lang.proficiency})
                <button className="remove-button" onClick={() => handleRemoveLanguage(lang.language)}>✕</button>
              </div>
            ))}
          </div>
          <button className="action-button" onClick={handlePrevious}>Previous</button>
          <button className="action-button" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h1>Step 3: Social Links</h1>
          <input
            type="text"
            name="linkedInProfile"
            value={formData.linkedInProfile}
            onChange={handleInputChange}
            placeholder="LinkedIn profile link"
            className="input-field"
          />
          <input
            type="text"
            name="socialMediaLink"
            value={formData.socialMediaLink}
            onChange={handleInputChange}
            placeholder="Social media link"
            className="input-field"
          />
          <button className="action-button" onClick={handlePrevious}>Previous</button>
          <button className="action-button" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h1>Step 4: Upload Resume</h1>
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 'resume')}
            className="file-input"
            accept=".jpg,.png,.pdf"
          />
          <button className="action-button" onClick={handlePrevious}>Previous</button>
          <button className="action-button" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 4.6 && (
        <div>
          <h1>Step 4.6: Profile Picture & Personal Info</h1>
          <h2>Profile Picture</h2>
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 'profilePic')}
            className="file-input"
            accept=".jpg,.png"
          />
          <h2>Full Name</h2>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="input-field"
          />
          <h2>Address</h2>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows="3"
            placeholder="Your address"
            className="textarea-field"
          />
          <h2>Country</h2>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="select-field"
          >
            <option value="">Select your country</option>
            {['United States', 'Canada', 'United Kingdom', 'India', 'Australia', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'South Africa', 'Other'].map((country, index) => (
              <option key={index} value={country}>{country}</option>
            ))}
          </select>
          <h2>Phone Number</h2>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Your phone number"
            className="input-field"
          />
          <button className="action-button" onClick={handlePrevious}>Previous</button>
          <button className="action-button" onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 5 && (
        <div>
          <h1>Step 5: Goals and Questions</h1>
          <textarea
            name="goals"
            value={formData.goals}
            onChange={handleInputChange}
            placeholder="What are your career goals?"
            rows="4"
            className="textarea-field"
          />
          <h2>Answer the following questions:</h2>
          <div className="question-section">
            <p>1. What motivates you to work in this field?</p>
            <textarea
              name="questions[0]"
              value={formData.questions[0] || ''}
              onChange={(e) => {
                const updatedQuestions = [...formData.questions];
                updatedQuestions[0] = e.target.value;
                setFormData({ ...formData, questions: updatedQuestions });
              }}
              rows="3"
              className="textarea-field"
            />
            <p>2. What are your strengths?</p>
            <textarea
              name="questions[1]"
              value={formData.questions[1] || ''}
              onChange={(e) => {
                const updatedQuestions = [...formData.questions];
                updatedQuestions[1] = e.target.value;
                setFormData({ ...formData, questions: updatedQuestions });
              }}
              rows="3"
              className="textarea-field"
            />
          </div>
          <button className="action-button" onClick={handlePrevious}>
            Previous
          </button>
          <button className="action-button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 6 && (
        <div>
          <h1>Step 6: Profile Picture & Personal Info</h1>
          <h2>Profile Picture</h2>
          {(formData.profilePicPreview || formData.profilePicture) && (
            <div className="current-profile-pic">
              <img 
                src={formData.profilePicPreview || formData.profilePicture} 
                alt="Current profile" 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '50%' }}
              />
              <p>Current profile picture</p>
            </div>
          )}
          <input
            type="file"
            onChange={(e) => handleFileChange(e, 'profilePic')}
            className="file-input"
            accept="image/jpeg,image/png"
          />
          <h2>Full Name</h2>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your full name"
            className="input-field"
          />
          <h2>Address</h2>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows="3"
            placeholder="Your address"
            className="textarea-field"
          />
          <h2>Country</h2>
          <select
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="select-field"
          >
            <option value="">Select your country</option>
            {['United States', 'Canada', 'United Kingdom', 'India', 'Australia', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'South Africa', 'Other'].map((country, index) => (
              <option key={index} value={country}>{country}</option>
            ))}
          </select>
          <h2>Phone Number</h2>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            placeholder="Your phone number"
            className="input-field"
          />
          <button className="action-button" onClick={handlePrevious}>
            Previous
          </button>
          <button className="action-button" onClick={handleNext}>
            Next
          </button>
        </div>
      )}

      {step === 7 && (
        <div>
          <h1>Step 7: Preview and Submit</h1>
          <p><strong>Name:</strong> {formData.name}</p>
          <p><strong>Bio:</strong> {formData.bio}</p>
          <p><strong>Goals:</strong> {formData.goals}</p>
          <p><strong>Address:</strong> {formData.address}</p>
          <p><strong>Country:</strong> {formData.country}</p>
          <p><strong>Phone Number:</strong> {formData.phoneNumber}</p>
          <button className="action-button" onClick={handlePrevious}>
            Previous
          </button>
          <button className="action-button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;

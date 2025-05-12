import API_BASE_URL from '../../utils/apiConfig';
import { useState, useEffect } from 'react';
import { FaTimes, FaCloudUploadAlt, FaEdit, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaArrowRight, FaArrowLeft, FaRegLightbulb } from 'react-icons/fa';
import axios from "axios";
import './PostJob.css';

const PostJob = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [darkTheme, setDarkTheme] = useState(() => document.body.classList.contains('dark-mode'));
  const [formData, setFormData] = useState({
    title: '',
    skills: [],
    scope: '',
    budgetType: 'hourly',
    hourlyFrom: '',
    hourlyTo: '',
    fixedAmount: '',
    description: '',
    files: []
  });

  const totalSteps = 6;
  
  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      setDarkTheme(document.body.classList.contains('dark-mode'));
    };
    
    // Initial check
    handleThemeChange();
    
    // Create a MutationObserver to watch for class changes on the body element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          handleThemeChange();
        }
      });
    });
    
    // Start observing the body element for class changes
    observer.observe(document.body, { attributes: true });
    
    // Clean up the observer on component unmount
    return () => observer.disconnect();
  }, []);

  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = "Job title is required";
        break;
      case 2:
        if (formData.skills.length === 0) newErrors.skills = "Please add at least one skill";
        break;
      case 3:
        if (!formData.scope) newErrors.scope = "Please select a project scope";
        break;
      case 4:
        if (formData.budgetType === 'hourly') {
          if (!formData.hourlyFrom) newErrors.hourlyFrom = "Please specify minimum rate";
          if (!formData.hourlyTo) newErrors.hourlyTo = "Please specify maximum rate";
          if (Number(formData.hourlyFrom) > Number(formData.hourlyTo)) 
            newErrors.hourlyRange = "Minimum rate should be less than maximum rate";
        } else if (formData.budgetType === 'fixed' && !formData.fixedAmount) {
          newErrors.fixedAmount = "Please specify the fixed budget amount";
        }
        break;
      case 5:
        if (!formData.description.trim()) newErrors.description = "Job description is required";
        if (formData.description.trim().length < 50) newErrors.description = "Description should be at least 50 characters";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const skill = e.target.value.trim();
      if (!formData.skills.includes(skill)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        e.target.value = '';
        
        // Clear skills error if it exists
        if (errors.skills) {
          setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.skills;
            return newErrors;
          });
        }
      }
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, files: [...prev.files, ...uploadedFiles] }));
  };

  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove)
    }));
  };

  const nextStep = () => {
    const isValid = validateStep(currentStep);
    
    if (!isValid) return;

    if (currentStep === totalSteps) {
      handleSubmit();
      return;
    }
    
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const editStep = (step) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === "files") {
          formData.files.forEach(file => formDataToSend.append("files", file));
        } else if (key === "skills") {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const response = await axios.post(
        "API_BASE_URL/jobs",
        formDataToSend,
        { 
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      if (response.data.success) {
        setSuccessMessage("Job posted successfully!");
        setTimeout(() => {
          setCurrentStep(1);
          setFormData({
            title: '',
            skills: [],
            scope: '',
            budgetType: 'hourly',
            hourlyFrom: '',
            hourlyTo: '',
            fixedAmount: '',
            description: '',
            files: []
          });
          setSuccessMessage('');
        }, 3000);
      } else {
        setErrors({ submit: "Failed to post job. Please try again." });
      }
    } catch (error) {
      console.error("Error posting job:", error.response?.data || error.message);
      setErrors({ submit: error.response?.data?.message || "Failed to post job. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tips for each step
  const stepTips = {
    1: "Clear job titles attract 30% more qualified candidates. Be specific about the role.",
    2: "Including 3-5 key skills helps candidates determine if they're a good fit for your job.",
    3: "Setting the right project scope sets expectations and helps find candidates with matching availability.",
    4: "Transparent budget information increases application rates by up to 40%.",
    5: "Detailed descriptions (150+ words) typically receive twice as many qualified applications."
  };

  return (
    <div className={`post-job-container ${darkTheme ? 'dark-theme' : ''}`}>
      <h1 className="post-job-title">Create a Job Posting</h1>
      <p className="post-job-subtitle">Define your project needs to attract the right talent</p>
      
      {successMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}
      
      {errors.submit && (
        <div className="error-message">
          <FaExclamationTriangle /> {errors.submit}
        </div>
      )}
      
      <div className="progress-bar-container">
        {[...Array(totalSteps)].map((_, index) => (
          <div 
            key={index}
            className={`progress-step ${index + 1 <= currentStep ? 'active' : ''} ${index + 1 < currentStep ? 'completed' : ''}`}
            onClick={() => index + 1 < currentStep && editStep(index + 1)}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-label">
              {index === 0 ? "Title" : 
               index === 1 ? "Skills" : 
               index === 2 ? "Scope" : 
               index === 3 ? "Budget" : 
               index === 4 ? "Description" : "Review"}
            </div>
          </div>
        ))}
      </div>

      <div className="form-steps-container">
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Create an Engaging Job Title</h2>
            <p>A specific, descriptive title will attract qualified candidates who match your needs.</p>
            
            <div className="form-group">
              <label htmlFor="jobTitle">Job Title</label>
              <input
                id="jobTitle"
                type="text"
                className={`input-field ${errors.title ? 'input-error' : ''}`}
                placeholder="E.g. React Developer for E-commerce Dashboard"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
              {errors.title && <div className="error-text">{errors.title}</div>}
              
              {stepTips[1] && (
                <div className="tip-box">
                  <FaRegLightbulb className="tip-icon" /> {stepTips[1]}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-content">
            <h2>Specify Required Skills</h2>
            <p>List the technical skills and competencies needed for this job.</p>
            
            <div className="form-group">
              <label htmlFor="skillInput">Skills (press Enter to add)</label>
              <input
                id="skillInput"
                type="text"
                className={`input-field ${errors.skills ? 'input-error' : ''}`}
                placeholder="E.g. React, Node.js, AWS"
                onKeyPress={handleSkillKeyPress}
              />
              {errors.skills && <div className="error-text">{errors.skills}</div>}
              
              <div className="skills-container">
                {formData.skills.map(skill => (
                  <div key={skill} className="skill-pill">
                    <span>{skill}</span>
                    <button 
                      type="button"
                      className="remove-skill-btn"
                      onClick={() => removeSkill(skill)}
                      aria-label={`Remove ${skill}`}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
              
              {stepTips[2] && (
                <div className="tip-box">
                  <FaRegLightbulb className="tip-icon" /> {stepTips[2]}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-content">
            <h2>Define Project Scope</h2>
            <p>Select the estimated duration that best fits your project needs.</p>
            
            <div className="form-group">
              <div className="scope-options">
                {['large', 'medium', 'small'].map((scope) => (
                  <div 
                    key={scope} 
                    className={`scope-card ${formData.scope === scope ? 'selected' : ''} ${errors.scope ? 'input-error' : ''}`}
                    onClick={() => {
                      setFormData(prev => ({ ...prev, scope }));
                      if (errors.scope) {
                        setErrors(prev => {
                          const newErrors = {...prev};
                          delete newErrors.scope;
                          return newErrors;
                        });
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value={scope}
                      checked={formData.scope === scope}
                      onChange={handleInputChange}
                    />
                    <div className="scope-info">
                      <h3>{scope === 'large' ? 'Large Project' : scope === 'medium' ? 'Medium Project' : 'Small Project'}</h3>
                      <p>
                        {scope === 'large' ? '6+ months, complex work' : 
                         scope === 'medium' ? '3-6 months, moderate complexity' : 
                         '1-3 months, well-defined tasks'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.scope && <div className="error-text">{errors.scope}</div>}
              
              {stepTips[3] && (
                <div className="tip-box">
                  <FaRegLightbulb className="tip-icon" /> {stepTips[3]}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="step-content">
            <h2>Set Your Budget</h2>
            <p>Define a reasonable budget that reflects the project scope and required expertise.</p>
            
            <div className="form-group">
              <div className="budget-options">
                <div 
                  className={`budget-card ${formData.budgetType === 'hourly' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, budgetType: 'hourly' }))}
                >
                  <input
                    type="radio"
                    name="budgetType"
                    id="hourly"
                    checked={formData.budgetType === 'hourly'}
                    onChange={() => setFormData(prev => ({ ...prev, budgetType: 'hourly' }))}
                  />
                  <div className="budget-info">
                    <h3>Hourly Rate</h3>
                    <p>Pay by the hour, ideal for ongoing work</p>
                  </div>
                </div>
                
                <div 
                  className={`budget-card ${formData.budgetType === 'fixed' ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, budgetType: 'fixed' }))}
                >
                  <input
                    type="radio"
                    name="budgetType"
                    id="fixed"
                    checked={formData.budgetType === 'fixed'}
                    onChange={() => setFormData(prev => ({ ...prev, budgetType: 'fixed' }))}
                  />
                  <div className="budget-info">
                    <h3>Fixed Price</h3>
                    <p>Pay a set amount for the entire project</p>
                  </div>
                </div>
              </div>
              
              {formData.budgetType === 'hourly' && (
                <div className="hourly-rate-inputs">
                  <div className="rate-field">
                    <label htmlFor="hourlyFrom">From ($)</label>
                    <input
                      id="hourlyFrom"
                      type="number"
                      name="hourlyFrom"
                      className={`input-field ${errors.hourlyFrom ? 'input-error' : ''}`}
                      value={formData.hourlyFrom}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="15"
                    />
                    {errors.hourlyFrom && <div className="error-text">{errors.hourlyFrom}</div>}
                  </div>
                  <div className="rate-field">
                    <label htmlFor="hourlyTo">To ($)</label>
                    <input
                      id="hourlyTo"
                      type="number"
                      name="hourlyTo"
                      className={`input-field ${errors.hourlyTo ? 'input-error' : ''}`}
                      value={formData.hourlyTo}
                      onChange={handleInputChange}
                      min={formData.hourlyFrom || 1}
                      placeholder="50"
                    />
                    {errors.hourlyTo && <div className="error-text">{errors.hourlyTo}</div>}
                  </div>
                </div>
              )}
              
              {errors.hourlyRange && <div className="error-text">{errors.hourlyRange}</div>}
              
              {formData.budgetType === 'fixed' && (
                <div className="fixed-rate-input">
                  <label htmlFor="fixedAmount">Budget Amount ($)</label>
                  <input
                    id="fixedAmount"
                    type="number"
                    name="fixedAmount"
                    className={`input-field ${errors.fixedAmount ? 'input-error' : ''}`}
                    value={formData.fixedAmount}
                    onChange={handleInputChange}
                    min="1"
                    placeholder="1000"
                  />
                  {errors.fixedAmount && <div className="error-text">{errors.fixedAmount}</div>}
                </div>
              )}
              
              {stepTips[4] && (
                <div className="tip-box">
                  <FaRegLightbulb className="tip-icon" /> {stepTips[4]}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="step-content">
            <h2>Craft a Detailed Description</h2>
            <p>Provide specific information about the project, deliverables, and expectations.</p>
            
            <div className="form-group">
              <label htmlFor="description">Job Description</label>
              <textarea
                id="description"
                className={`input-field description-area ${errors.description ? 'input-error' : ''}`}
                placeholder="Describe your project in detail. Include background information, goals, specific requirements, timeline expectations, and any other details that will help candidates understand the job."
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
              {errors.description && <div className="error-text">{errors.description}</div>}
              
              {formData.description && (
                <div className="character-count">
                  {formData.description.length} characters
                  {formData.description.length < 150 && " (we recommend at least 150 for best results)"}
                </div>
              )}
              
              <div className="file-upload-section">
                <label className="file-upload-label">
                  <input 
                    type="file" 
                    id="fileUpload" 
                    multiple 
                    onChange={handleFileUpload}
                    className="file-input"
                  />
                  <div className="upload-card">
                    <FaCloudUploadAlt className="upload-icon" />
                    <p>Add Supporting Documents</p>
                    <span>PDFs, DOCs, Images (Max 5MB each)</span>
                  </div>
                </label>
                
                {formData.files.length > 0 && (
                  <div className="file-list">
                    <h4>Attached Files ({formData.files.length})</h4>
                    <ul>
                      {formData.files.map((file, index) => (
                        <li key={index} className="file-item">
                          <span className="file-name">{file.name}</span>
                          <button 
                            type="button" 
                            className="remove-file-btn"
                            onClick={() => removeFile(index)}
                            aria-label={`Remove ${file.name}`}
                          >
                            <FaTimes />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {stepTips[5] && (
                <div className="tip-box">
                  <FaRegLightbulb className="tip-icon" /> {stepTips[5]}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="step-content">
            <h2>Review Your Job Posting</h2>
            <p>Please verify all information before publishing your job.</p>
            
            <div className="review-section">
              <div className="review-card">
                <div className="review-item">
                  <div className="review-label">Job Title</div>
                  <div className="review-value">{formData.title}</div>
                  <button type="button" className="edit-btn" onClick={() => editStep(1)}>
                    <FaEdit /> Edit
                  </button>
                </div>
                
                <div className="review-item">
                  <div className="review-label">Skills</div>
                  <div className="review-value skills-preview">
                    {formData.skills.map(skill => (
                      <span key={skill} className="skill-preview">{skill}</span>
                    ))}
                  </div>
                  <button type="button" className="edit-btn" onClick={() => editStep(2)}>
                    <FaEdit /> Edit
                  </button>
                </div>
                
                <div className="review-item">
                  <div className="review-label">Project Scope</div>
                  <div className="review-value">
                    {formData.scope ? 
                      `${formData.scope.charAt(0).toUpperCase() + formData.scope.slice(1)} Project` : 
                      'Not specified'}
                  </div>
                  <button type="button" className="edit-btn" onClick={() => editStep(3)}>
                    <FaEdit /> Edit
                  </button>
                </div>
                
                <div className="review-item">
                  <div className="review-label">Budget</div>
                  <div className="review-value">
                    {formData.budgetType === 'hourly' 
                      ? `$${formData.hourlyFrom} - $${formData.hourlyTo} per hour`
                      : `Fixed Price: $${formData.fixedAmount}`}
                  </div>
                  <button type="button" className="edit-btn" onClick={() => editStep(4)}>
                    <FaEdit /> Edit
                  </button>
                </div>
                
                <div className="review-item description-review">
                  <div className="review-label">Description</div>
                  <div className="review-value description-preview">
                    {formData.description}
                  </div>
                  <button type="button" className="edit-btn" onClick={() => editStep(5)}>
                    <FaEdit /> Edit
                  </button>
                </div>
                
                {formData.files.length > 0 && (
                  <div className="review-item">
                    <div className="review-label">Attached Files</div>
                    <div className="review-value">
                      {formData.files.length} file(s) attached
                    </div>
                    <button type="button" className="edit-btn" onClick={() => editStep(5)}>
                      <FaEdit /> Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="navigation-buttons">
        {currentStep > 1 && (
          <button 
            type="button"
            className="btn-secondary" 
            onClick={previousStep}
          >
            <FaArrowLeft /> Back
          </button>
        )}
        <button 
          type="button"
          className="btn-primary" 
          onClick={nextStep}
          disabled={isSubmitting}
        >
          {currentStep === totalSteps 
            ? isSubmitting 
              ? <>
                  <FaSpinner className="spinner-icon" /> Publishing...
                </> 
              : 'Publish Job' 
            : <>Continue <FaArrowRight /></>}
        </button>
      </div>
    </div>
  );
};

export default PostJob;
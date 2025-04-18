import { useState, useEffect } from 'react';
import './PostJob.css';
import axios from "axios";

const PostJob = () => {
  const [currentStep, setCurrentStep] = useState(1);
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

  const ProgressBar = ({ currentStep }) => {
    return (
      <div className="progress-bar">
        {[...Array(5)].map((_, index) => (
          <div 
            key={index}
            className={`progress-step ${index < currentStep ? 'active' : ''}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const skill = e.target.value.trim();
      if (!formData.skills.includes(skill)) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
        e.target.value = '';
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
    setFormData(prev => ({ ...prev, files: uploadedFiles }));
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.title.trim()) {
        alert("Job title is required.");
        return;
    }
    if (currentStep === 2 && formData.skills.length === 0) {
        alert("Please add at least one skill.");
        return;
    }
    if (currentStep === 3 && !formData.scope) {
        alert("Please select a project scope.");
        return;
    }
    if (currentStep === 4) {
        if (formData.budgetType === 'hourly' && (!formData.hourlyFrom || !formData.hourlyTo)) {
            alert("Please specify the hourly rate range.");
            return;
        }
        if (formData.budgetType === 'fixed' && !formData.fixedAmount) {
            alert("Please specify the fixed budget amount.");
            return;
        }
    }
    if (currentStep === 5 && !formData.description.trim()) {
        alert("Job description is required.");
        return;
    }

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
            "http://localhost:4000/api/jobs",
            formDataToSend,
            { 
                withCredentials: true,
                headers: { "Content-Type": "multipart/form-data" }
            }
        );

        if (response.data.success) {
            alert("Job posted successfully!");
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
        } else {
            alert("Failed to post job. Please try again.");
        }
    } catch (error) {
        console.error("Error posting job:", error.response?.data || error.message);
        alert("Failed to post job. Please try again.");
    }
  };

  return (
    <div className="container">
      <ProgressBar currentStep={currentStep} />

      {currentStep === 1 && (
        <div className="step active">
          <h2>Write a title for your job post</h2>
          <div className="form-group">
            <input
              type="text"
              className="input-card"
              placeholder="Developer needed to update Android app UI..."
              name="title"
              value={formData.title}
              onChange={handleInputChange}
            />
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="step active">
          <h2>Required Skills</h2>
          <div className="form-group">
            <div className="input-card">
              <input
                type="text"
                placeholder="Search skills..."
                onKeyPress={handleSkillKeyPress}
              />
              <div className="skillsContainer" style={{ marginTop: '1rem' }}>
                {formData.skills.map(skill => (
                  <div key={skill} className="skill-pill">
                    {skill}
                    <i 
                      className="fas fa-times" 
                      onClick={() => removeSkill(skill)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="step active">
          <h2>Project Scope</h2>
          <div className="form-group">
            {['large', 'medium', 'small'].map((scope) => (
              <div 
                key={scope} 
                className={`input-card scope-option ${
                  formData.scope === scope ? 'selected' : ''
                }`}
              >
                <label className="budget-option">
                  <input
                    type="radio"
                    name="scope"
                    value={scope}
                    checked={formData.scope === scope}
                    onChange={handleInputChange}
                  />
                  {scope.charAt(0).toUpperCase() + scope.slice(1)} Project (
                  {scope === 'large' ? '6+ months' :
                   scope === 'medium' ? '3-6 months' : '1-3 months'})
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="step active">
          <h2>Budget & Pricing</h2>
          <div className="form-group">
            <div className="input-card">
              <div className="budget-option">
                <input
                  type="radio"
                  name="budgetType"
                  id="hourly"
                  checked={formData.budgetType === 'hourly'}
                  onChange={() => setFormData(prev => ({ ...prev, budgetType: 'hourly' }))}
                />
                <label htmlFor="hourly">Hourly Rate</label>
                <div style={{ display: formData.budgetType === 'hourly' ? 'block' : 'none', marginLeft: 'auto' }}>
                  $<input
                    type="number"
                    name="hourlyFrom"
                    value={formData.hourlyFrom}
                    onChange={handleInputChange}
                    style={{ width: '80px' }}
                  /> - 
                  $<input
                    type="number"
                    name="hourlyTo"
                    value={formData.hourlyTo}
                    onChange={handleInputChange}
                    style={{ width: '80px' }}
                  /> /hr
                </div>
              </div>
              <div className="budget-option">
                <input
                  type="radio"
                  name="budgetType"
                  id="fixed"
                  checked={formData.budgetType === 'fixed'}
                  onChange={() => setFormData(prev => ({ ...prev, budgetType: 'fixed' }))}
                />
                <label htmlFor="fixed">Fixed Price</label>
                <div style={{ display: formData.budgetType === 'fixed' ? 'block' : 'none', marginLeft: 'auto' }}>
                  $<input
                    type="number"
                    name="fixedAmount"
                    value={formData.fixedAmount}
                    onChange={handleInputChange}
                    style={{ width: '120px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 5 && (
        <div className="step active">
          <h2>Job Description</h2>
          <div className="form-group">
            <textarea
              className="input-card"
              placeholder="Describe your job requirements..."
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              style={{ width: '100%', height: '200px' }}
            />
            <div className="file-upload">
              <input 
                type="file" 
                id="fileUpload" 
                multiple 
                onChange={handleFileUpload}
              />
              <label className="file-upload-label">
                <i className="fas fa-cloud-upload-alt"></i><br />
                Upload supporting documents (PDF, DOC, PNG)
              </label>
            </div>
          </div>
        </div>
      )}

      {currentStep === 6 && (
        <div className="step active">
          <h2>Review Job Post</h2>
          <div className="review-section">
            <div className="review-item">
              <span>Job Title:</span>
              <span>{formData.title}</span>
              <span className="edit-btn" onClick={() => editStep(1)}>Edit</span>
            </div>
            <div className="review-item">
              <span>Skills:</span>
              <span>{formData.skills.join(', ')}</span>
              <span className="edit-btn" onClick={() => editStep(2)}>Edit</span>
            </div>
            <div className="review-item">
              <span>Scope:</span>
              <span>{formData.scope}</span>
              <span className="edit-btn" onClick={() => editStep(3)}>Edit</span>
            </div>
            <div className="review-item">
              <span>Budget:</span>
              <span>
                {formData.budgetType === 'hourly' 
                  ? `$${formData.hourlyFrom} - $${formData.hourlyTo}/hour`
                  : `Fixed: $${formData.fixedAmount}`}
              </span>
              <span className="edit-btn" onClick={() => editStep(4)}>Edit</span>
            </div>
          </div>
        </div>
      )}

      <div className="navigation-buttons">
        <button 
          className="btn-secondary" 
          onClick={previousStep}
          disabled={currentStep === 1}
        >
          Back
        </button>
        <button 
          className="btn-primary" 
          onClick={nextStep}
        >
          {currentStep === totalSteps ? 'Post Job' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default PostJob;
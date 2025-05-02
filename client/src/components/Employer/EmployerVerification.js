import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config';
import { 
  FaIdCard, 
  FaCloudUploadAlt, 
  FaCheckCircle, 
  FaTimesCircle,
  FaArrowRight
} from 'react-icons/fa';

const EmployerVerification = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // State for verification documents
  const [frontId, setFrontId] = useState(null);
  const [backId, setBackId] = useState(null);
  const [frontIdPreview, setFrontIdPreview] = useState(null);
  const [backIdPreview, setBackIdPreview] = useState(null);

  const handleFrontIdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFrontId(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFrontIdPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackIdChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBackId(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackIdPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate inputs
    if (!frontId || !backId) {
      setError('Please upload both front and back sides of your ID');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      // Using the correct field names expected by the backend
      formData.append('frontImage', frontId);
      formData.append('backImage', backId);

      // Use the correct API endpoint
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify-identity`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onComplete && typeof onComplete === 'function') {
            onComplete();
          }
        }, 2000);
      } else {
        setError(response.data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadSection = (side, preview, handleChange) => {
    const isFront = side === 'Front';
    return (
      <div className="upload-section">
        <p className="upload-title">{side} of ID</p>
        <div className="upload-area" style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '10px', position: 'relative' }}>
          {preview ? (
            <div className="preview-container" style={{ position: 'relative' }}>
              <img 
                src={preview} 
                alt={`${side} ID Preview`} 
                style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '4px' }}
              />
              <button 
                type="button"
                onClick={() => {
                  if (isFront) {
                    setFrontId(null);
                    setFrontIdPreview(null);
                  } else {
                    setBackId(null);
                    setBackIdPreview(null);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FaTimesCircle color="#e74c3c" />
              </button>
            </div>
          ) : (
            <label 
              className="upload-label" 
              htmlFor={`${side.toLowerCase()}-id-upload`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: '40px 20px',
                textAlign: 'center'
              }}
            >
              <FaCloudUploadAlt size={40} color="#3498db" />
              <p style={{ marginTop: '10px', fontSize: '14px' }}>
                Click to upload {side.toLowerCase()} of your ID
              </p>
            </label>
          )}
          <input
            type="file"
            id={`${side.toLowerCase()}-id-upload`}
            accept="image/*"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    );
  };

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <FaCheckCircle size={60} color="#27ae60" />
        <h2 style={{ margin: '20px 0' }}>Verification Submitted!</h2>
        <p>Your verification documents have been submitted successfully. Our team will review them shortly.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaIdCard size={24} color="#3498db" style={{ marginRight: '10px' }} />
          <h2 style={{ margin: 0 }}>Employer Verification</h2>
        </div>

        <div className="info-box" style={{ 
          backgroundColor: 'rgba(52, 152, 219, 0.1)', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px'
        }}>
          <p>Please upload clear photos of your government-issued ID (front and back) to verify your account.</p>
          <p>Acceptable IDs include driver's license, passport, or national ID card with photo and identification details.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {renderUploadSection('Front', frontIdPreview, handleFrontIdChange)}
            {renderUploadSection('Back', backIdPreview, handleBackIdChange)}
          </div>

          <div className="note-box" style={{ 
            backgroundColor: 'rgba(246, 246, 246, 0.7)', 
            padding: '15px', 
            borderRadius: '8px', 
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: 0, fontWeight: '500' }}>Note:</p> 
            <p style={{ margin: '5px 0 0 0' }}>Your ID will be securely stored and only used for verification purposes. Once verified, you'll have full access to all platform features including posting jobs and contacting candidates.</p>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: 'rgba(231, 76, 60, 0.1)', 
              color: '#e74c3c', 
              padding: '12px', 
              borderRadius: '4px', 
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#3498db', 
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: loading || !frontId || !backId ? 0.7 : 1
            }}
            disabled={loading || !frontId || !backId}
          >
            {loading ? 'Processing...' : 'Submit for Verification'}
            {!loading && <FaArrowRight style={{ marginLeft: '8px' }} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployerVerification;
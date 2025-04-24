import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaUpload, FaIdCard, FaCheck } from 'react-icons/fa';
import './VerifyAccount.css';

const VerifyAccount = () => {
    const navigate = useNavigate();
    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Handle file selection for front of ID
    const handleFrontImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFrontImage(file);
            setFrontPreview(URL.createObjectURL(file));
        }
    };

    // Handle file selection for back of ID
    const handleBackImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackImage(file);
            setBackPreview(URL.createObjectURL(file));
        }
    };

    // Submit verification data
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!frontImage || !backImage) {
            setError('Please upload both front and back images of your student ID');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('frontImage', frontImage);
            formData.append('backImage', backImage);
            
            const response = await axios.post(
                'http://localhost:4000/api/auth/verify-identity',
                formData,
                { 
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            if (response.data.success) {
                setSuccess(true);
                // Wait 3 seconds before redirecting
                setTimeout(() => {
                    navigate('/employee-dashboard');
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred while submitting verification documents');
            console.error('Verification error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verify-container">
            <div className="verify-header">
                <button 
                    className="back-button" 
                    onClick={() => navigate('/employee-dashboard')}
                >
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <h1>Verify Your Account</h1>
            </div>

            {success ? (
                <div className="success-message">
                    <FaCheck className="success-icon" />
                    <h2>Verification Submitted!</h2>
                    <p>Your student ID has been submitted for verification. Our team will review it shortly.</p>
                    <p>You will be redirected to your dashboard in a few seconds...</p>
                </div>
            ) : (
                <>
                    <div className="verify-instructions">
                        <FaIdCard className="id-icon" />
                        <p>Please upload clear images of the front and back of your student ID card.</p>
                        <p>Your ID must be valid and clearly show your name, photo, and student ID number.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <form onSubmit={handleSubmit} className="verify-form">
                        <div className="upload-container">
                            <div className="upload-section">
                                <h2>Front of ID</h2>
                                <div className={`upload-area ${frontPreview ? 'has-preview' : ''}`}>
                                    {frontPreview ? (
                                        <img src={frontPreview} alt="Front of ID preview" className="id-preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <FaUpload />
                                            <p>Click to browse or drag image here</p>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleFrontImageChange}
                                        className="file-input"
                                    />
                                </div>
                                {frontPreview && (
                                    <button 
                                        type="button" 
                                        className="change-image"
                                        onClick={() => {
                                            setFrontImage(null);
                                            setFrontPreview(null);
                                        }}
                                    >
                                        Change image
                                    </button>
                                )}
                            </div>

                            <div className="upload-section">
                                <h2>Back of ID</h2>
                                <div className={`upload-area ${backPreview ? 'has-preview' : ''}`}>
                                    {backPreview ? (
                                        <img src={backPreview} alt="Back of ID preview" className="id-preview" />
                                    ) : (
                                        <div className="upload-placeholder">
                                            <FaUpload />
                                            <p>Click to browse or drag image here</p>
                                        </div>
                                    )}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handleBackImageChange}
                                        className="file-input"
                                    />
                                </div>
                                {backPreview && (
                                    <button 
                                        type="button" 
                                        className="change-image"
                                        onClick={() => {
                                            setBackImage(null);
                                            setBackPreview(null);
                                        }}
                                    >
                                        Change image
                                    </button>
                                )}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="submit-button"
                            disabled={loading || !frontImage || !backImage}
                        >
                            {loading ? 'Submitting...' : 'Submit for Verification'}
                        </button>
                    </form>
                </>
            )}
        </div>
    );
};

export default VerifyAccount;
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaComment, FaSpinner } from 'react-icons/fa';
import './StartConversation.css';

const StartConversation = ({ employerId, jobId, applicationId, employerName, jobTitle }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:4000/api";

  const handleStartConversation = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First, check if a conversation already exists or create one
      const response = await axios.post(`${API_BASE_URL}/messages/start`, {
        recipientId: employerId,
        jobId,
        applicationId
      }, { withCredentials: true });
      
      if (response.data.success) {
        // Redirect to messages page
        navigate('/employee/messages', { 
          state: { 
            conversationId: response.data.conversation,
            newConversation: true
          }
        });
      } else {
        setError('Failed to start conversation');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Unable to start conversation. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="start-conversation">
      <button 
        className="start-conversation-btn"
        onClick={handleStartConversation}
        disabled={loading}
      >
        {loading ? (
          <FaSpinner className="spinning" />
        ) : (
          <>
            <FaComment className="message-icon" />
            <span>Message {employerName}</span>
          </>
        )}
      </button>
      
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default StartConversation;
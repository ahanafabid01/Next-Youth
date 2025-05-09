import React, { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaTimes, FaSpinner } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './MessageIcon.css';

const MessageIcon = () => {
  const { unreadCount, refreshUnreadCount } = useSocket();
  const [showDropdown, setShowDropdown] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Handle clicks outside dropdown
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);
  
  // Fetch recent conversations when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetchConversations();
    }
  }, [showDropdown]);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:4000/api/messages/conversations', {
        withCredentials: true
      });
      
      if (res.data.success) {
        setConversations(res.data.conversations.slice(0, 5)); // Show only 5 most recent
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleViewAllClick = () => {
    navigate('/messages');
    setShowDropdown(false);
  };
  
  const handleMessageClick = (userId) => {
    navigate(`/messages/${userId}`);
    setShowDropdown(false);
  };
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/messages/unread-count', {
          withCredentials: true
        });
        
        if (response.data.success) {
          // Use the refreshUnreadCount function from the socket context
          refreshUnreadCount();
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
    
    // Poll for updates every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]); // Added refreshUnreadCount as a dependency
  
  return (
    <div className="message-icon-container" ref={dropdownRef}>
      <button 
        className="message-icon-button"
        onClick={() => setShowDropdown(prev => !prev)}
        aria-label="Messages"
      >
        <FaEnvelope />
        {unreadCount > 0 && (
          <span className="message-badge">{unreadCount}</span>
        )}
      </button>
      
      {showDropdown && (
        <div className="messages-dropdown">
          <div className="messages-dropdown-header">
            <h3>Messages</h3>
            <button 
              className="close-dropdown"
              onClick={() => setShowDropdown(false)}
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="messages-dropdown-content">
            {loading ? (
              <div className="messages-loading">
                <FaSpinner className="spinning" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="no-messages">
                <p>No messages yet</p>
                <p className="no-messages-sub">When you have conversations, they'll appear here</p>
              </div>
            ) : (
              <>
                {conversations.map(convo => (
                  <div 
                    key={convo.otherUser._id} 
                    className={`conversation-preview ${convo.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => handleMessageClick(convo.otherUser._id)}
                  >
                    <div className="conversation-avatar">
                      {convo.otherUser.profilePicture ? (
                        <img src={convo.otherUser.profilePicture} alt={`${convo.otherUser.name}'s avatar`} />
                      ) : (
                        <div className="default-avatar">{convo.otherUser.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <h4>{convo.otherUser.name}</h4>
                        <span className="conversation-time">
                          {formatTime(convo.latestMessage.createdAt)}
                        </span>
                      </div>
                      <p className="conversation-preview-text">
                        {convo.latestMessage.content.length > 30
                          ? `${convo.latestMessage.content.substring(0, 30)}...`
                          : convo.latestMessage.content
                        }
                      </p>
                      {convo.unreadCount > 0 && (
                        <span className="unread-indicator">{convo.unreadCount}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="messages-dropdown-footer">
                  <button 
                    className="view-all-messages"
                    onClick={handleViewAllClick}
                  >
                    View All Messages
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageIcon;
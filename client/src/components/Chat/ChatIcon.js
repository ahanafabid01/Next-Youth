import React, { useState, useEffect } from 'react';
import { FaCommentDots } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ChatIcon.css';

const ChatIcon = ({ userType }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/api/messages/unread/count',
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount);
        }
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };
    
    // Fetch initially
    fetchUnreadCount();
    
    // Set up interval to check periodically
    const intervalId = setInterval(fetchUnreadCount, 30000); // check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <Link to={`/${userType}-messages`} className="chat-icon-container">
      <FaCommentDots className="chat-icon" />
      {unreadCount > 0 && (
        <span className="chat-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </Link>
  );
};

export default ChatIcon;
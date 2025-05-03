import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MessageNotification.css';

const MessageNotification = ({ targetLink }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = "http://localhost:4000/api";

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/messages/unread`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setUnreadCount(response.data.unreadCount);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching unread message count:", error);
        setLoading(false);
      }
    };

    fetchUnreadCount();

    // Set up polling for unread messages
    const intervalId = setInterval(fetchUnreadCount, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [API_BASE_URL]);

  if (loading || unreadCount === 0) return null;

  return (
    <div className="message-notification-badge" data-testid="message-notification">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};

export default MessageNotification;
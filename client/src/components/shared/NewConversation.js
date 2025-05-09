import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaArrowLeft, FaUser, FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import './NewConversation.css';

const NewConversation = ({ userType, onConversationStart, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const API_BASE_URL = 'http://localhost:4000/api';

  useEffect(() => {
    if (searchTerm.length < 2) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      setLoading(true);
      try {
        // The endpoint depends on user type
        const endpoint = userType === 'employer' 
          ? `${API_BASE_URL}/messages/search/employees` 
          : `${API_BASE_URL}/messages/search/employers`;
        
        const response = await axios.get(`${endpoint}?q=${searchTerm}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setUsers(response.data.users || []);
        }
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, userType, API_BASE_URL]);

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    
    try {
      // Check if we can message this user
      const response = await axios.get(`${API_BASE_URL}/messages/permission/${user._id}`, {
        withCredentials: true
      });
      
      if (response.data.success && response.data.canMessage) {
        onConversationStart(user._id);
      } else {
        alert(response.data.message || "You cannot message this user");
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error checking message permission:", error);
      alert("Failed to start conversation");
      setSelectedUser(null);
    }
  };

  return (
    <div className="new-conversation">
      <div className="new-conversation-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft />
        </button>
        <h3>New Message</h3>
      </div>
      
      <div className="search-container">
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />
          <input
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${userType === 'employer' ? 'employees' : 'employers'}...`}
            type="text"
          />
        </div>
      </div>
      
      <div className="search-results">
        {loading ? (
          <div className="loading-results">
            <FaSpinner className="spinning" />
            <p>Searching...</p>
          </div>
        ) : searchTerm.length < 2 ? (
          <div className="search-hint">
            <p>Type at least 2 characters to search</p>
          </div>
        ) : users.length === 0 ? (
          <div className="no-results">
            <p>No users found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="user-list">
            {users.map(user => (
              <div
                key={user._id}
                className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="user-avatar">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} />
                  ) : (
                    userType === 'employer' ? <FaUser /> : <FaBuilding />
                  )}
                </div>
                <div className="user-info">
                  <h4>{user.name}</h4>
                  {userType === 'employee' && user.companyName && (
                    <p className="company-name">{user.companyName}</p>
                  )}
                  {user.info && <p className="user-detail">{user.info}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConversation;
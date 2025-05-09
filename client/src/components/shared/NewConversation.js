import React, { useState, useEffect } from 'react';
import { FaSearch, FaSpinner, FaArrowLeft, FaUser, FaBuilding, FaBriefcase } from 'react-icons/fa';
import axios from 'axios';
import './NewConversation.css';

const NewConversation = ({ userType, onConversationStart, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch users based on user type
  useEffect(() => {
    const fetchUsers = async () => {
      setInitialLoading(true);
      try {
        const endpoint = userType === 'employer'
          ? `${API_BASE_URL}/messages/applicants`
          : `${API_BASE_URL}/messages/employers`;

        const response = await axios.get(endpoint, { withCredentials: true });

        if (response.data.success) {
          setUsers(response.data.applicants || response.data.employers || []);
        }
      } catch (error) {
        console.error(`Error fetching ${userType === 'employer' ? 'applicants' : 'employers'}:`, error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUsers();
  }, [userType, API_BASE_URL]);

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="new-conversation">
      <div className="new-conversation-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft />
        </button>
        <h3>New Message</h3>
      </div>

      <div className="search-box">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder={`Search ${userType === 'employer' ? 'applicants' : 'employers'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="users-list">
        {initialLoading ? (
          <div className="loading">
            <FaSpinner className="spinning" />
            <p>Loading...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-users">
            <p>No users found</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user._id} className="user-item" onClick={() => onConversationStart(user._id)}>
              <div className="user-avatar">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} />
                ) : (
                  <div className="default-avatar">{user.name.charAt(0).toUpperCase()}</div>
                )}
              </div>
              <div className="user-info">
                <h4>{user.name}</h4>
                {user.jobTitle && (
                  <p className="job-applied-for">
                    <FaBriefcase className="job-icon" /> {user.jobTitle}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewConversation;
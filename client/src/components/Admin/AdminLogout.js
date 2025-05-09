import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaSignOutAlt } from 'react-icons/fa';
import './logout.css';

const AdminLogout = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:4000/api/auth/logout", {}, { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally display an error message to the user
    }
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      <FaSignOutAlt className="logout-icon" />
      Logout
    </button>
  );
};

export default AdminLogout;
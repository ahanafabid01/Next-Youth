import React from "react";
import Sidebar from "./Sidebar"; // Import the reusable Sidebar component
import "./Messages.css"; // Optional: Add CSS for styling
import API_BASE_URL from '../../utils/apiConfig';
const Messages = () => {
  return (
    <div className="admin-dashboard">
      <Sidebar /> {/* Reuse the Sidebar component */}
      <div className="main-content">
        <h1>Messages Page</h1>
        <p>Manage messages here.</p>
      </div>
    </div>
  );
};

export default Messages;
import React from "react";
import Sidebar from "./Sidebar"; // Import the reusable Sidebar component
import "./Applications.css"; // Optional: Add CSS for styling

const Applications = () => {
  return (
    <div className="admin-dashboard">
      <Sidebar /> {/* Reuse the Sidebar component */}
      <div className="main-content">
        <h1>Applications Page</h1>
        <p>Manage applications here.</p>
      </div>
    </div>
  );
};

export default Applications;
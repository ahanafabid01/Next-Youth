import React from "react";
import Sidebar from "./Sidebar"; // Import the Sidebar component
import "./Statistics.css"; // Reuse the same CSS for consistency

const Statistics = () => {
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="main-content">
        <h1>Statistics Page</h1>
        <p>View statistics here.</p>
      </div>
    </div>
  );
};

export default Statistics;
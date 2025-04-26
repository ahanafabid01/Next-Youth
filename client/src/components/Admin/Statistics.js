import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch } from "react-icons/fa";
import "./Statistics.css"; // Reuse the same CSS for consistency

const Statistics = () => {
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h2>NextYouth</h2>
        </div>
        <div className="menu">
          <ul>
            <li><Link to="/admin-dashboard"><FaSearch /> Dashboard</Link></li>
            <li><Link to="/admin-dashboard/users"><FaUsers /> Users</Link></li>
            <li><Link to="/admin-dashboard/messages"><FaEnvelope /> Messages</Link></li>
            <li><Link to="/admin-dashboard/applications"><FaClipboardList /> Applications</Link></li>
            <li><Link to="/admin-dashboard/statistics"><FaChartBar /> Statistics</Link></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Statistics Page</h1>
        <p>View statistics here.</p>
      </div>
    </div>
  );
};

export default Statistics;
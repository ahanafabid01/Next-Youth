import React from "react";
import API_BASE_URL from '../../utils/apiConfig';
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch } from "react-icons/fa";
import "./Dashboard.css"; // Optional: Add CSS for styling

const Dashboard = () => {
  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h2>NextYouth</h2>
        </div>
        <div className="menu">
          <ul>
            <li><Link to="/admin-dashboard/dashboard"><FaSearch /> Dashboard</Link></li>
            <li><Link to="/admin-dashboard/users"><FaUsers /> Users</Link></li>
            <li><Link to="/admin-dashboard/messages"><FaEnvelope /> Messages</Link></li>
            <li><Link to="/admin-dashboard/applications"><FaClipboardList /> Applications</Link></li>
            <li><Link to="/admin-dashboard/statistics"><FaChartBar /> Statistics</Link></li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin dashboard. Manage your application here.</p>
      </div>
    </div>
  );
};

export default Dashboard;
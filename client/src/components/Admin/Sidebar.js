import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch, FaBriefcase } from "react-icons/fa";
import "./Sidebar.css"; // Optional: Add CSS for styling
import AdminLogout from "./AdminLogout";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="logo">
        <h2>NextYouth</h2>
      </div>
      <div className="menu">
        <ul>
          <li><Link to="/admin-dashboard"><FaSearch /> Dashboard</Link></li>
          <li><Link to="/admin-dashboard/users"><FaUsers /> User Details</Link></li>
          <li><Link to="/admin-dashboard/messages"><FaEnvelope /> Messages</Link></li>
          <li><Link to="/admin-dashboard/applications"><FaClipboardList /> Applications</Link></li>
          <li><Link to="/admin-dashboard/statistics"><FaChartBar /> Statistics</Link></li>
          <li><Link to="/admin-dashboard/job-details"><FaBriefcase /> Job Details</Link></li>
          <li>
            <AdminLogout />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
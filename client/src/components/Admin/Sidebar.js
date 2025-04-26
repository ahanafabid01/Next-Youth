import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch } from "react-icons/fa";
import "./Sidebar.css"; // Optional: Add CSS for styling

const Sidebar = () => {
  return (
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
  );
};

export default Sidebar;
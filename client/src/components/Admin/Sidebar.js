import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FaUsers, 
  FaChartBar, 
  FaClipboardList, 
  FaEnvelope, 
  FaSearch, 
  FaBriefcase,
  FaMoon,
  FaSun,
  FaPaperPlane // Added new icon for mail system
} from "react-icons/fa";
import "./Sidebar.css";
import AdminLogout from "./AdminLogout";

const Sidebar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const location = useLocation();

  // Check for saved theme preference when component mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem("adminTheme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add('admin-dark-mode');
    } else {
      document.body.classList.remove('admin-dark-mode');
    }
  }, []);

  // Apply theme changes when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      localStorage.setItem("adminTheme", "dark");
      document.body.classList.add('admin-dark-mode');
    } else {
      localStorage.setItem("adminTheme", "light");
      document.body.classList.remove('admin-dark-mode');
    }
    
    // Dispatch an event for other components to listen to
    window.dispatchEvent(new Event('storage'));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileExpanded(false);
  }, [location]);

  return (
    <div className={`sidebar ${isMobileExpanded ? "expanded" : ""}`}>
      <div className="logo">
        <h2>NextYouth</h2>
        <button 
          className="hamburger" 
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          aria-label="Toggle menu"
        >
          {isMobileExpanded ? "×" : "☰"}
        </button>
      </div>
      <div className="menu">
        <ul>
          <li>
            <Link 
              to="/admin-dashboard" 
              className={location.pathname === "/admin-dashboard" ? "active" : ""}
            >
              <FaSearch /> Dashboard
            </Link>
          </li>
          <li>
            <Link 
              to="/admin-dashboard/users" 
              className={location.pathname === "/admin-dashboard/users" ? "active" : ""}
            >
              <FaUsers /> User Details
            </Link>
          </li>
          <li>
            <Link 
              to="/admin-dashboard/consultations" 
              className={location.pathname === "/admin-dashboard/consultations" ? "active" : ""}
            >
              <FaEnvelope /> Consultations
            </Link>
          </li>

          <li>
            <Link 
              to="/admin-dashboard/applications" 
              className={location.pathname === "/admin-dashboard/applications" ? "active" : ""}
            >
              <FaClipboardList /> Job Applications
            </Link>
          </li>

          <li>
            <Link 
              to="/admin-dashboard/job-details" 
              className={location.pathname === "/admin-dashboard/job-details" ? "active" : ""}
            >
              <FaBriefcase /> Job Details
            </Link>
          </li>
          
          <li>
            <Link 
              to="/admin-dashboard/statistics" 
              className={location.pathname === "/admin-dashboard/statistics" ? "active" : ""}
            >
              <FaChartBar /> Statistics
            </Link>
          </li>
          {/* New Central Mailing System link */}
          <li>
            <Link 
              to="/admin-dashboard/mail-system" 
              className={location.pathname === "/admin-dashboard/mail-system" ? "active" : ""}
            >
              <FaPaperPlane /> Central Mailing System
            </Link>
          </li>
          <li className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light Mode" : "Dark Mode"}
          </li>
          <li>
            <AdminLogout />
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
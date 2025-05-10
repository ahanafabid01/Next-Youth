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
  FaPaperPlane,
  FaSignOutAlt,
  FaTimes
} from "react-icons/fa";
import "./Sidebar.css";
import AdminLogout from "./AdminLogout";
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

const Sidebar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const location = useLocation();

  // Check for saved theme preference when component mounts
  useEffect(() => {
    const savedTheme = localStorage.getItem("adminTheme");
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.body.classList.add('admin-dash-dark-mode');
    } else {
      document.body.classList.remove('admin-dash-dark-mode');
    }
  }, []);

  // Apply theme changes when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      localStorage.setItem("adminTheme", "dark");
      document.body.classList.add('admin-dash-dark-mode');
    } else {
      localStorage.setItem("adminTheme", "light");
      document.body.classList.remove('admin-dash-dark-mode');
    }
    
    // Dispatch an event for other components to listen to
    window.dispatchEvent(new Event('storage'));
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      // Update both theme keys for consistency
      localStorage.setItem("adminTheme", newMode ? "dark" : "light");
      localStorage.setItem("theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    setIsMobileExpanded(false);
  }, [location]);

  // Handle click outside to close mobile sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      const sidebar = document.querySelector('.admin-dash-sidebar');
      if (isMobileExpanded && sidebar && !sidebar.contains(event.target)) {
        setIsMobileExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileExpanded]);

  return (
    <div className={`admin-dash-sidebar ${isMobileExpanded ? "expanded" : ""}`}>
      <div className="admin-dash-logo-container">
        <img 
          src={darkMode ? logoDark : logoLight} 
          alt="NextYouth Admin" 
          className="admin-dash-logo" 
        />
        <button 
          className="admin-dash-hamburger" 
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          aria-label="Toggle menu"
        >
          {isMobileExpanded ? <FaTimes /> : "☰"}
        </button>
      </div>
      <div className="admin-dash-menu">
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
              <FaUsers /> User Management
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
              <FaBriefcase /> Job Listings
            </Link>
          </li>
          <li>
            <Link 
              to="/admin-dashboard/statistics" 
              className={location.pathname === "/admin-dashboard/statistics" ? "active" : ""}
            >
              <FaChartBar /> Analytics
            </Link>
          </li>
          <li>
            <Link 
              to="/admin-dashboard/mail-system" 
              className={location.pathname === "/admin-dashboard/mail-system" ? "active" : ""}
            >
              <FaPaperPlane /> Mailing System
            </Link>
          </li>
        </ul>
        
        <div className="admin-dash-theme-toggle">
          <ul>
            <li>
              <button onClick={toggleTheme} className="admin-dash-theme-button">
                {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? "Light Mode" : "Dark Mode"}
              </button>
            </li>
            <li>
              <AdminLogout>
                <FaSignOutAlt /> Sign Out
              </AdminLogout>
            </li>
          </ul>
        </div>
      </div>
      <div className="admin-dash-footer">
        © 2025 NextYouth Admin Panel
      </div>
    </div>
  );
};

export default Sidebar;
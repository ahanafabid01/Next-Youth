import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AiFillHome, AiOutlineLogout } from "react-icons/ai";
import { FaBriefcase, FaUserCircle, FaBell, FaClipboardList } from "react-icons/fa";
import { BiMessageDetail } from "react-icons/bi";
import MessageNotification from "../common/MessageNotification";
import "./EmployerSidebar.css";

const EmployerSidebar = () => {
  const location = useLocation();

  return (
    <div className="employer-sidebar">
      <div className="sidebar-links">
        <Link
          to="/employer-dashboard"
          className={location.pathname === "/employer-dashboard" ? "active" : ""}
        >
          <AiFillHome className="sidebar-icon" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/post-job"
          className={location.pathname === "/post-job" ? "active" : ""}
        >
          <FaBriefcase className="sidebar-icon" />
          <span>Post Job</span>
        </Link>
        <Link
          to="/manage-jobs"
          className={location.pathname === "/manage-jobs" ? "active" : ""}
        >
          <FaClipboardList className="sidebar-icon" />
          <span>Manage Jobs</span>
        </Link>
        <Link
          to="/profile"
          className={location.pathname === "/profile" ? "active" : ""}
        >
          <FaUserCircle className="sidebar-icon" />
          <span>My Profile</span>
        </Link>
        <Link
          to="/employer/messages"
          className={location.pathname === "/employer/messages" ? "active" : ""}
        >
          <div className="icon-with-notification">
            <BiMessageDetail className="sidebar-icon" />
            <MessageNotification targetLink="/employer/messages" />
          </div>
          <span>Messages</span>
        </Link>
        <Link
          to="/notifications"
          className={location.pathname === "/employer-notifications" ? "active" : ""}
        >
          <FaBell className="sidebar-icon" />
          <span>Notifications</span>
        </Link>
        <Link to="/login" className="logout-link">
          <AiOutlineLogout className="sidebar-icon logout-icon" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default EmployerSidebar;
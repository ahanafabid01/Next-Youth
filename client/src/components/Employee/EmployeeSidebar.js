import React from "react";
import { Link, useLocation } from "react-router-dom";
import { AiFillHome, AiOutlineLogout } from "react-icons/ai";
import { FaBriefcase, FaUserCircle, FaBell } from "react-icons/fa";
import { BiMessageDetail } from "react-icons/bi";
import MessageNotification from "../common/MessageNotification";
import "./EmployeeSidebar.css";

const EmployeeSidebar = () => {
  const location = useLocation();

  return (
    <div className="employee-sidebar">
      <div className="sidebar-links">
        <Link
          to="/employee-dashboard"
          className={location.pathname === "/employee-dashboard" ? "active" : ""}
        >
          <AiFillHome className="sidebar-icon" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/find-jobs"
          className={location.pathname.includes("/find-jobs") ? "active" : ""}
        >
          <FaBriefcase className="sidebar-icon" />
          <span>Find Jobs</span>
        </Link>
        <Link
          to="/my-profile"
          className={location.pathname === "/my-profile" ? "active" : ""}
        >
          <FaUserCircle className="sidebar-icon" />
          <span>My Profile</span>
        </Link>
        <Link
          to="/notifications"
          className={location.pathname === "/notifications" ? "active" : ""}
        >
          <FaBell className="sidebar-icon" />
          <span>Notifications</span>
        </Link>
        <Link
          to="/employee/messages"
          className={location.pathname === "/employee/messages" ? "active" : ""}
        >
          <div className="icon-with-notification">
            <BiMessageDetail className="sidebar-icon" />
            <MessageNotification targetLink="/employee/messages" />
          </div>
          <span>Messages</span>
        </Link>
        <Link to="/login" className="logout-link">
          <AiOutlineLogout className="sidebar-icon logout-icon" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default EmployeeSidebar;
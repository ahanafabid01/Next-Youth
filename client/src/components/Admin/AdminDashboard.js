import React, { useState, useEffect } from "react";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch, FaCalendarAlt, FaFileAlt } from "react-icons/fa"; // Import icons
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"; // Import for graph
import './AdminDashboard.css';  // Import the CSS file for styling
import { Link } from "react-router-dom"; // Import Link from react-router-dom

const AdminDashboard = () => {
  const [stats] = useState({
    interviewsScheduled: 86,
    applicationsSent: 75,
    profileViews: 45673,
    unreadMessages: 93,
  });

  // Sample data for Vacancy Stats (replace with API calls in a real app)
  const data = [
    { name: "Jan", applicationSent: 30, interviews: 40, rejected: 10 },
    { name: "Feb", applicationSent: 40, interviews: 60, rejected: 15 },
    { name: "Mar", applicationSent: 50, interviews: 70, rejected: 20 },
    { name: "Apr", applicationSent: 60, interviews: 90, rejected: 25 },
    { name: "May", applicationSent: 80, interviews: 100, rejected: 30 },
    { name: "Jun", applicationSent: 100, interviews: 120, rejected: 35 },
  ];

  useEffect(() => {
    // You can fetch data here using an API and update the state.
  }, []);

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h2>NextYouth</h2>
        </div>
        <div className="menu">
          <ul>
            <li>
              <Link to="/admin-dashboard/dashboard">
                <FaSearch /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/users">
                <FaUsers /> Users
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/messages">
                <FaEnvelope /> Messages
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/applications">
                <FaClipboardList /> Applications
              </Link>
            </li>
            <li>
              <Link to="/admin-dashboard/statistics">
                <FaChartBar /> Statistics
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Search Bar with Icon */}
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search something..." />
        </div>

        {/* Stats */}
        <div className="stats">
          <div className="stat-card">
            <FaCalendarAlt className="stat-icon" />
            <div className="stat-text">
              <h3>Interviews Scheduled</h3>
              <p>{stats.interviewsScheduled}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaFileAlt className="stat-icon" />
            <div className="stat-text">
              <h3>Applications Sent</h3>
              <p>{stats.applicationsSent}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaUsers className="stat-icon" />
            <div className="stat-text">
              <h3>Profile Viewed</h3>
              <p>{stats.profileViews}</p>
            </div>
          </div>
          <div className="stat-card">
            <FaEnvelope className="stat-icon" />
            <div className="stat-text">
              <h3>Unread Messages</h3>
              <p>{stats.unreadMessages}</p>
            </div>
          </div>
        </div>

        {/* Vacancy Stats Graph */}
        <div className="vacancy-stats">
          <h2>Vacancy Stats</h2>
          <LineChart width={800} height={300} data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="applicationSent" stroke="#8884d8" />
            <Line type="monotone" dataKey="interviews" stroke="#82ca9d" />
            <Line type="monotone" dataKey="rejected" stroke="#ff7300" />
          </LineChart>
        </div>

        {/* Recent Activities */}
        <div className="recent-activities">
          <h2>Recent Activities</h2>
          <ul>
            <li>Job vacancy posted for 'Web Developer'</li>
            <li>New application received from 'John Smith'</li>
            <li>Interview scheduled for 'Jane Doe'</li>
          </ul>
        </div>

        {/* Recommended Jobs */}
        <div className="recommended-jobs">
          <h2>Recommended Jobs</h2>
          <div className="job-card">
            <h3>Senior Software Engineer</h3>
            <p>ABC Company</p>
          </div>
          <div className="job-card">
            <h3>Product Manager</h3>
            <p>XYZ Corp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

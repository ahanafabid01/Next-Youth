import React, { useState, useEffect } from "react";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaBriefcase, FaCheckCircle, FaCalendarAlt, FaBars, FaUserCircle, FaBell, FaRegClock } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import './AdminDashboard.css';
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import axios from "axios";
import { eventEmitter, dataStore } from '../../utils/eventEmitter';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

// Helper function to calculate time ago
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffHour > 0) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffMin > 0) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  return 'just now';
};

// Helper function to count items created on a specific date
const countItemsCreatedOnDate = (items, startDate, endDate) => {
  if (!Array.isArray(items)) return 0;
  
  return items.filter(item => {
    try {
      const createdTime = new Date(item.createdAt).getTime();
      return createdTime >= startDate.getTime() && createdTime < endDate.getTime();
    } catch (err) {
      console.error("Error processing item date:", err);
      return false;
    }
  }).length;
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    users: { total: 0, verified: 0 },
    consultations: { total: 0, pending: 0, confirmed: 0, completed: 0 },
    jobs: { total: 0, available: 0 },
    recentActivities: []
  });
  const [userTrend, setUserTrend] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("adminTheme") === "dark";
  });

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("adminTheme") === "dark");
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch fresh user data
        const usersResponse = await axios.get("http://localhost:4000/api/auth/admin/users", {
          withCredentials: true
        });
        let users = [];
        if (usersResponse.data?.success) {
          users = usersResponse.data.users;
          dataStore.setUsers(users);
        }
        
        // Get cached or fetch other data
        let consultations = dataStore.consultations;
        let jobs = dataStore.jobs;
        
        if (consultations.length === 0) {
          const consultationsResponse = await axios.get("http://localhost:4000/api/contact/all", {
            withCredentials: true
          });
          if (consultationsResponse.data?.success) {
            consultations = consultationsResponse.data.consultations;
            dataStore.setConsultations(consultations);
          }
        }
        
        if (jobs.length === 0) {
          const jobsResponse = await axios.get("http://localhost:4000/api/jobs/available", {
            withCredentials: true
          });
          if (jobsResponse.data?.success) {
            jobs = jobsResponse.data.jobs;
            dataStore.setJobs(jobs);
          }
        }

        if (users.length > 0 && consultations.length > 0 && jobs.length > 0) {
          // Calculate statistics
          const verifiedUsers = users.filter(user => user.idVerification?.status === 'verified').length;
          const pendingConsultations = consultations.filter(c => c.status === 'pending' || !c.status).length;
          const confirmedConsultations = consultations.filter(c => c.status === 'confirmed').length;
          const completedConsultations = consultations.filter(c => c.status === 'completed').length;
          
          // Check both isAvailable and status fields for job availability
          const availableJobs = jobs.filter(job => 
            job.isAvailable === true || job.status === 'available' || job.status === 'active'
          ).length;

          // Sort items by date
          const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedConsultations = [...consultations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Create recent activity data
          const recentActivities = [];

          // Add users to recent activities
          if (sortedUsers && sortedUsers.length) {
            sortedUsers.slice(0, 3).forEach(user => {
              if (user && user.createdAt) {
                try {
                  recentActivities.push({
                    type: 'user',
                    message: `New user registered: ${user.name || 'Unknown'}`,
                    date: new Date(user.createdAt).toLocaleDateString(),
                    timestamp: new Date(user.createdAt).getTime(),
                    createdAt: user.createdAt
                  });
                } catch (err) {
                  console.error("Error processing user activity:", err);
                }
              }
            });
          }

          // Add consultations to recent activities
          if (sortedConsultations && sortedConsultations.length) {
            sortedConsultations.slice(0, 3).forEach(c => {
              if (c && c.createdAt) {
                try {
                  recentActivities.push({
                    type: 'consultation',
                    message: `New consultation request: ${c.fullName || 'Unknown'}`,
                    date: new Date(c.createdAt).toLocaleDateString(),
                    timestamp: new Date(c.createdAt).getTime(),
                    createdAt: c.createdAt
                  });
                } catch (err) {
                  console.error("Error processing consultation activity:", err);
                }
              }
            });
          }

          // Add jobs to recent activities
          if (sortedJobs && sortedJobs.length) {
            sortedJobs.slice(0, 2).forEach(job => {
              if (job && job.createdAt) {
                try {
                  recentActivities.push({
                    type: 'job',
                    message: `New job posted: ${job.title || job.position || 'Untitled'}`,
                    date: new Date(job.createdAt).toLocaleDateString(),
                    timestamp: new Date(job.createdAt).getTime(),
                    createdAt: job.createdAt
                  });
                } catch (err) {
                  console.error("Error processing job activity:", err);
                }
              }
            });
          }

          // Sort all activities by timestamp (newest first)
          recentActivities.sort((a, b) => b.timestamp - a.timestamp);

          // Keep only the top 5 most recent activities
          const topRecentActivities = recentActivities.slice(0, 5);

          // Generate combined trend data for chart (last 7 days)
          const last7Days = [];
          // For each of the last 7 days
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0); // Start of day
            
            const nextDate = new Date(date);
            nextDate.setDate(date.getDate() + 1); // End of day
            
            // Count items created on this specific day
            const userCount = countItemsCreatedOnDate(users, date, nextDate);
            const consultationCount = countItemsCreatedOnDate(consultations, date, nextDate);
            const jobCount = countItemsCreatedOnDate(jobs, date, nextDate);
            
            last7Days.push({ 
              name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              users: userCount,
              consultations: consultationCount,
              jobs: jobCount
            });
          }
          
          setUserTrend(last7Days);
          
          // Update dashboard data
          setDashboardData({
            users: {
              total: users.length,
              verified: verifiedUsers
            },
            consultations: {
              total: consultations.length,
              pending: pendingConsultations,
              confirmed: confirmedConsultations,
              completed: completedConsultations
            },
            jobs: {
              total: jobs.length,
              available: availableJobs
            },
            recentActivities: topRecentActivities
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "An error occurred while fetching dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up listener for data updates
    const unsubscribe = eventEmitter.on('dataUpdated', ({ type }) => {
      console.log(`Data updated: ${type}`);
      fetchDashboardData();
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // If there's no real data, use sample data for the chart
  if (userTrend.length === 0 || !userTrend.some(day => day.users > 0 || day.consultations > 0 || day.jobs > 0)) {
    const sampleData = [
      { name: 'Apr 30', users: 3, consultations: 1, jobs: 0 },
      { name: 'May 1', users: 5, consultations: 2, jobs: 1 },
      { name: 'May 2', users: 2, consultations: 3, jobs: 0 },
      { name: 'May 3', users: 4, consultations: 2, jobs: 2 },
      { name: 'May 4', users: 6, consultations: 1, jobs: 1 },
      { name: 'May 5', users: 3, consultations: 4, jobs: 0 },
      { name: 'May 6', users: 7, consultations: 2, jobs: 3 }
    ];
    setUserTrend(sampleData);
  }

  if (loading) {
    return (
      <div className="admin-dash-container">
        <Sidebar />
        <div className="admin-dash-main">
          <div className="admin-dash-loading">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dash-container">
        <Sidebar />
        <div className="admin-dash-main">
          <div className="admin-dash-error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`admin-dash-container ${darkMode ? 'admin-dash-dark-mode' : ''}`}>
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="admin-dash-mobile-header">
        <button 
          className="admin-dash-mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <FaBars />
        </button>
        <img 
          src={darkMode ? logoDark : logoLight}
          alt="NextYouth Admin"
          className="admin-dash-mobile-logo"
        />
      </div>
      
      <div className="admin-dash-main">
        <div className="admin-dash-header">
          <div className="admin-dash-title">
            <h1>Admin Dashboard</h1>
            <p>Welcome to NextYouth admin panel. Monitor and manage your platform efficiently.</p>
          </div>
        </div>
        
        <div className="admin-dash-stats-grid">
          <div className="admin-dash-stat-card">
            <div className="admin-dash-stat-icon">
              <FaUsers />
            </div>
            <div className="admin-dash-stat-title">Total Users</div>
            <div className="admin-dash-stat-value">{dashboardData.users.total}</div>
          </div>
          
          <div className="admin-dash-stat-card">
            <div className="admin-dash-stat-icon">
              <FaCheckCircle />
            </div>
            <div className="admin-dash-stat-title">Verified Users</div>
            <div className="admin-dash-stat-value">{dashboardData.users.verified}</div>
          </div>
          
          <div className="admin-dash-stat-card">
            <div className="admin-dash-stat-icon">
              <FaEnvelope />
            </div>
            <div className="admin-dash-stat-title">Consultations</div>
            <div className="admin-dash-stat-value">{dashboardData.consultations.total}</div>
          </div>
          
          <div className="admin-dash-stat-card">
            <div className="admin-dash-stat-icon">
              <FaBriefcase />
            </div>
            <div className="admin-dash-stat-title">Active Jobs</div>
            <div className="admin-dash-stat-value">{dashboardData.jobs.available}</div>
          </div>
        </div>
        
        <div className="admin-dash-grid">
          <div className="admin-dash-chart-card">
            <h2><FaChartBar /> Activity Summary Trends</h2>
            <div className="admin-dash-chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }} 
                  />
                  <YAxis 
                    tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                      color: darkMode ? "#e2e8f0" : "#334155",
                      border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    name="Users" 
                    stroke="#3a86ff" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consultations" 
                    name="Consultations" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="jobs" 
                    name="Jobs" 
                    stroke="#f59e0b" 
                    activeDot={{ r: 8 }} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="admin-dash-activities-card">
            <h2><FaRegClock /> Recent Activities</h2>
            <ul className="admin-dash-activities-list">
              {dashboardData.recentActivities.length > 0 ? (
                dashboardData.recentActivities.map((activity, index) => {
                  const timeAgo = getTimeAgo(activity.createdAt);
                  
                  let icon;
                  let activityClass = '';
                  
                  if (activity.type === 'user') {
                    icon = <FaUserCircle />;
                    activityClass = 'user-activity';
                  } else if (activity.type === 'consultation') {
                    icon = <FaEnvelope />;
                    activityClass = 'consultation-activity';
                  } else if (activity.type === 'job') {
                    icon = <FaBriefcase />;
                    activityClass = 'job-activity';
                  }
                  
                  let messageParts = [];
                  if (activity.type === 'user') {
                    const userName = activity.message.replace('New user registered: ', '');
                    messageParts = <><strong>New user registered:</strong> {userName}</>;
                  } else if (activity.type === 'consultation') {
                    const consultName = activity.message.split(': ')[1];
                    messageParts = <><strong>New consultation request:</strong> {consultName}</>;
                  } else if (activity.type === 'job') {
                    const jobTitle = activity.message.split(': ')[1];
                    messageParts = <><strong>New job posted:</strong> {jobTitle}</>;
                  } else {
                    messageParts = activity.message;
                  }
                  
                  return (
                    <li key={index} className={activityClass}>
                      <div className="activity-icon">{icon}</div>
                      {messageParts}
                      <span className="activity-time">{timeAgo}</span>
                    </li>
                  );
                })
              ) : (
                <li>No recent activities found</li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="admin-dash-actions-section">
          <h2><FaClipboardList /> Quick Actions</h2>
          <div className="admin-dash-actions-grid">
            <Link to="/admin-dashboard/users" className="admin-dash-action-card">
              <div className="admin-dash-action-icon"><FaUsers /></div>
              <div className="admin-dash-action-text">
                <h3>Manage Users</h3>
                <p>View and manage accounts</p>
              </div>
            </Link>
            
            <Link to="/admin-dashboard/consultations" className="admin-dash-action-card">
              <div className="admin-dash-action-icon"><FaCalendarAlt /></div>
              <div className="admin-dash-action-text">
                <h3>Consultations</h3>
                <p>Handle client requests</p>
              </div>
            </Link>
            
            <Link to="/admin-dashboard/job-details" className="admin-dash-action-card">
              <div className="admin-dash-action-icon"><FaBriefcase /></div>
              <div className="admin-dash-action-text">
                <h3>Job Listings</h3>
                <p>Manage available jobs</p>
              </div>
            </Link>
            
            <Link to="/admin-dashboard/statistics" className="admin-dash-action-card">
              <div className="admin-dash-action-icon"><FaChartBar /></div>
              <div className="admin-dash-action-text">
                <h3>Analytics</h3>
                <p>View detailed reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

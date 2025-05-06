import React, { useState, useEffect } from "react";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch, FaCalendarAlt, FaBriefcase, FaCheckCircle, FaRegClock } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import './AdminDashboard.css';
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import axios from "axios";

// Add this function above your AdminDashboard component

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch users data
        const usersResponse = await axios.get("http://localhost:4000/api/auth/admin/users", {
          withCredentials: true
        });
        
        // Fetch consultations data
        const consultationsResponse = await axios.get("http://localhost:4000/api/contact/all", {
          withCredentials: true
        });
        
        // Fetch jobs data
        const jobsResponse = await axios.get("http://localhost:4000/api/jobs/available", {
          withCredentials: true
        });

        if (usersResponse.data?.success && consultationsResponse.data?.success && jobsResponse.data?.success) {
          const users = usersResponse.data.users;
          const consultations = consultationsResponse.data.consultations;
          const jobs = jobsResponse.data.jobs;
          
          // Calculate statistics
          const verifiedUsers = users.filter(user => user.idVerification?.status === 'verified').length;
          const pendingConsultations = consultations.filter(c => c.status === 'pending' || !c.status).length;
          const confirmedConsultations = consultations.filter(c => c.status === 'confirmed').length;
          const completedConsultations = consultations.filter(c => c.status === 'completed').length;
          
          // FIX: Check both isAvailable and status fields for job availability
          const availableJobs = jobs.filter(job => 
            job.isAvailable === true || job.status === 'available' || job.status === 'active'
          ).length;

          // Sort users, consultations and jobs by date first
          const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedConsultations = [...consultations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Create recent activity data directly from the sorted arrays
          const recentActivities = [
            ...sortedUsers.slice(0, 3).map(user => ({
              type: 'user',
              message: `New user registered: ${user.name}`,
              date: new Date(user.createdAt).toLocaleDateString(),
              timestamp: new Date(user.createdAt).getTime(),
              createdAt: user.createdAt
            })),
            ...sortedConsultations.slice(0, 3).map(c => ({
              type: 'consultation',
              message: `New consultation request from ${c.fullName}`,
              date: new Date(c.createdAt).toLocaleDateString(),
              timestamp: new Date(c.createdAt).getTime(),
              createdAt: c.createdAt
            })),
            ...sortedJobs.slice(0, 2).map(job => ({
              type: 'job',
              message: `New job posted: ${job.title || job.position || 'Untitled'}`,
              date: new Date(job.createdAt).toLocaleDateString(),
              timestamp: new Date(job.createdAt).getTime(),
              createdAt: job.createdAt
            }))
          ];

          // Sort all activities by timestamp (newest first)
          recentActivities.sort((a, b) => b.timestamp - a.timestamp);

          // Keep only the top 5 most recent activities
          const topRecentActivities = recentActivities.slice(0, 5);

          // Generate user trend data for chart (last 7 days)
          const last7Days = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            const userCount = users.filter(user => {
              const userDate = new Date(user.createdAt);
              return userDate.getDate() === date.getDate() && 
                     userDate.getMonth() === date.getMonth() &&
                     userDate.getFullYear() === date.getFullYear();
            }).length;
            
            last7Days.push({ name: dateString, users: userCount });
          }
          
          setUserTrend(last7Days);
          
          // FIX: Make sure to update with all calculated values
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
              available: availableJobs  // This was missing or incorrect before
            },
            recentActivities: topRecentActivities // Use the sorted activities
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
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="main-content">
          <div className="loading">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <Sidebar />
        <div className="main-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the NextYouth admin dashboard. View key metrics and manage your platform.</p>
        
        <div className="stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FaUsers />
            </div>
            <div className="stat-text">
              <h3>Total Users</h3>
              <p>{dashboardData.users.total}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-text">
              <h3>Verified Users</h3>
              <p>{dashboardData.users.verified}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaEnvelope />
            </div>
            <div className="stat-text">
              <h3>Consultations</h3>
              <p>{dashboardData.consultations.total}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">
              <FaBriefcase />
            </div>
            <div className="stat-text">
              <h3>Jobs</h3>
              <p>{dashboardData.jobs.total}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="vacancy-stats">
            <h2>User Registration Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="recent-activities">
            <h2>Recent Activities</h2>
            <ul>
              {dashboardData.recentActivities.length > 0 ? (
                dashboardData.recentActivities.map((activity, index) => {
                  // Calculate time ago
                  const timeAgo = getTimeAgo(activity.createdAt);
                  
                  // Split message to bold the activity type prefix
                  let messageParts = [];
                  
                  if (activity.type === 'user') {
                    messageParts = [<strong key="prefix">New user registered: </strong>, activity.message.replace("New user registered: ", "")];
                  } else if (activity.type === 'consultation') {
                    messageParts = [<strong key="prefix">New consultation request: </strong>, activity.message.replace("New consultation request from ", "")];
                  } else if (activity.type === 'job') {
                    messageParts = [<strong key="prefix">New job posted: </strong>, activity.message.replace("New job posted: ", "")];
                  } else {
                    messageParts = [activity.message];
                  }
                  
                  return (
                    <li key={index}>
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
        
        <div className="recommended-jobs">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <Link to="/admin-dashboard/users">
              <div className="action-card">
                <div className="action-icon"><FaUsers /></div>
                <div className="action-text">
                  <h3>Manage Users</h3>
                  <p>View and manage user accounts</p>
                </div>
              </div>
            </Link>
            
            <Link to="/admin-dashboard/consultations">
              <div className="action-card">
                <div className="action-icon"><FaCalendarAlt /></div>
                <div className="action-text">
                  <h3>Consultations</h3>
                  <p>Handle consultation requests</p>
                </div>
              </div>
            </Link>
            
            <Link to="/admin-dashboard/job-details">
              <div className="action-card">
                <div className="action-icon"><FaBriefcase /></div>
                <div className="action-text">
                  <h3>Job Details</h3>
                  <p>Manage job listings</p>
                </div>
              </div>
            </Link>
            
            <Link to="/admin-dashboard/statistics">
              <div className="action-card">
                <div className="action-icon"><FaChartBar /></div>
                <div className="action-text">
                  <h3>Statistics</h3>
                  <p>View detailed analytics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

import React, { useState, useEffect } from "react";
import { FaUsers, FaChartBar, FaClipboardList, FaEnvelope, FaSearch, FaCalendarAlt, FaBriefcase, FaCheckCircle, FaRegClock } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import './AdminDashboard.css';
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import axios from "axios";
import { eventEmitter, dataStore } from '../../utils/eventEmitter';

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

// Add this function to your component
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // MODIFIED: Always fetch fresh user data
        const usersResponse = await axios.get("http://localhost:4000/api/auth/admin/users", {
          withCredentials: true
        });
        let users = [];
        if (usersResponse.data?.success) {
          users = usersResponse.data.users;
          dataStore.setUsers(users);  // Update the dataStore with fresh data
        }
        
        // Only fetch other data if dataStore is empty (can keep this logic)
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
          
          // FIX: Check both isAvailable and status fields for job availability
          const availableJobs = jobs.filter(job => 
            job.isAvailable === true || job.status === 'available' || job.status === 'active'
          ).length;

          // Sort users, consultations and jobs by date first
          const sortedUsers = [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedConsultations = [...consultations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const sortedJobs = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // Create recent activity data directly from the sorted arrays
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

// First fix: Change how the message is initially created
// In the section where consultation activities are added
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

// Debug output to help identify issues
console.log("Processed activities before sorting:", recentActivities.map(a => ({
  type: a.type,
  timestamp: a.timestamp,
  message: a.message
})));

          // Sort all activities by timestamp (newest first)
          recentActivities.sort((a, b) => b.timestamp - a.timestamp);

          // Keep only the top 5 most recent activities
          const topRecentActivities = recentActivities.slice(0, 5);

          // Add this right before setting dashboardData
          console.log("Final activities to display:", topRecentActivities.map(a => ({
            type: a.type,
            message: a.message,
            name: a.type === 'user' ? a.message.replace('New user registered: ', '') : '',
            createdAt: a.createdAt
          })));

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
            
            // Similar filtering for consultations and jobs
            const consultationCount = countItemsCreatedOnDate(consultations, date, nextDate);
            
            const jobCount = countItemsCreatedOnDate(jobs, date, nextDate);
            
            last7Days.push({ 
              name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              users: userCount,
              consultations: consultationCount,
              jobs: jobCount
            });
          }
          
          console.log("Chart data:", last7Days); // Add this for debugging
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

    // Set up listener for data updates
    const unsubscribe = eventEmitter.on('dataUpdated', ({ type }) => {
      console.log(`Data updated: ${type}`);
      
      // Force a complete data refresh when users are updated
      fetchDashboardData();
    });

    // Clean up listener on unmount
    return () => unsubscribe();
  }, []);

  // Add this just before the return statement for testing purposes:

  // TEMPORARY: Add mock data for testing if chart is empty
  if (userTrend.length === 0 || !userTrend.some(day => day.users > 0 || day.consultations > 0 || day.jobs > 0)) {
    setUserTrend([
      { name: 'Apr 30', users: 3, consultations: 1, jobs: 0 },
      { name: 'May 1', users: 5, consultations: 2, jobs: 1 },
      { name: 'May 2', users: 2, consultations: 3, jobs: 0 },
      { name: 'May 3', users: 4, consultations: 2, jobs: 2 },
      { name: 'May 4', users: 6, consultations: 1, jobs: 1 },
      { name: 'May 5', users: 3, consultations: 4, jobs: 0 },
      { name: 'May 6', users: 7, consultations: 2, jobs: 3 }
    ]);
    console.log("Using mock data for chart testing");
  }

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
            <h2>Activity Summary Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              {userTrend.length > 0 ? (
                <LineChart data={userTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    name="Users" 
                    stroke="#3b82f6" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consultations" 
                    name="Consultations" 
                    stroke="#10b981" 
                    activeDot={{ r: 8 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="jobs" 
                    name="Jobs" 
                    stroke="#f59e0b" 
                    activeDot={{ r: 8 }}  
                  />
                </LineChart>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#666' }}>
                  <p>No activity data available for the past 7 days</p>
                  <small>Activity will appear here as users register, consultations are requested, and jobs are posted</small>
                </div>
              )}
            </ResponsiveContainer>
          </div>
          
          <div className="recent-activities">
            <h2>Recent Activities</h2>
            <ul>
              {dashboardData.recentActivities.length > 0 ? (
                dashboardData.recentActivities.map((activity, index) => {
                  // Calculate time ago
                  const timeAgo = getTimeAgo(activity.createdAt);
                  
                  // Create appropriate message based on activity type
                  let messageParts = [];
                  
                  if (activity.type === 'user') {
                    // Don't split the message - just extract the name directly
                    const userName = activity.message.replace('New user registered: ', '');
                    messageParts = [<strong key="prefix">New user registered: </strong>, userName];
                  } else if (activity.type === 'consultation') {
                    messageParts = [<strong key="prefix">New consultation request: </strong>, activity.message.split(': ')[1]];
                  } else if (activity.type === 'job') {
                    messageParts = [<strong key="prefix">New job posted: </strong>, activity.message.split(': ')[1]];
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

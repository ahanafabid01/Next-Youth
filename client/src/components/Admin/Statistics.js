import React, { useState, useEffect, useCallback } from "react";
import {
  FaUsers,
  FaChartBar,
  FaBriefcase,
  FaCheckCircle,
  FaTimesCircle,
  FaInfoCircle,
  FaSync,
  FaCalendarCheck,
  FaClipboardList,
  FaArrowUp,
  FaArrowDown,
  FaRegClock,
  FaThumbsUp
} from "react-icons/fa";
import {
  LineChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "./Statistics.css";
import Sidebar from "./Sidebar";
import axios from "axios";

// Create an event system for real-time updates
const updateEvents = {};
const updateListeners = {};

// Function to notify the Statistics component that data has changed
export const notifyDataUpdate = (dataType) => {
  if (updateEvents[dataType]) {
    clearTimeout(updateEvents[dataType]);
  }
  
  // Debounce the update to prevent multiple rapid updates
  updateEvents[dataType] = setTimeout(() => {
    if (updateListeners[dataType]) {
      updateListeners[dataType].forEach(listener => listener());
    }
  }, 500);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="admin-stats-custom-tooltip">
        <p className="admin-stats-tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Statistics = () => {
  // State for all types of data
  const [users, setUsers] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
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

  // Color palette for consistent design
  const colorPalette = {
    primary: darkMode ? "#60a5fa" : "#3a86ff",
    secondary: darkMode ? "#34d399" : "#10b981",
    accent: darkMode ? "#fbbf24" : "#f97316",
    danger: darkMode ? "#f87171" : "#ef4444",
    neutral: darkMode ? "#94a3b8" : "#6b7280",
    chartColors: darkMode ? 
      ["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6"] : 
      ["#3a86ff", "#10b981", "#f97316", "#ef4444", "#8b5cf6", "#ec4899"]
  };

  // Get color for status badges
  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
      case 'completed':
      case 'accepted':
      case 'active':
        return colorPalette.secondary;
      case 'pending':
      case 'confirmed':
        return colorPalette.accent;
      case 'rejected':
      case 'closed':
        return colorPalette.danger;
      default:
        return colorPalette.neutral;
    }
  };

  // Fetch all data types
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Fetch user data
      const usersResponse = await axios.get("http://localhost:4000/api/auth/admin/users", {
        withCredentials: true
      });
      
      // Fetch consultations
      const consultationsResponse = await axios.get("http://localhost:4000/api/contact/all", {
        withCredentials: true
      });
      
      // Fetch jobs
      const jobsResponse = await axios.get("http://localhost:4000/api/jobs/available", {
        withCredentials: true
      });
      
      // Fetch job applications
      const applicationsResponse = await axios.get("http://localhost:4000/api/applications/all", {
        withCredentials: true
      }).catch(() => ({ data: { success: true, applications: [] } }));
      
      // Update state with fetched data
      if (usersResponse.data?.success) {
        setUsers(usersResponse.data.users || []);
      }
      
      if (consultationsResponse.data?.success) {
        setConsultations(consultationsResponse.data.consultations || []);
      }
      
      if (jobsResponse.data?.success) {
        setJobs(jobsResponse.data.jobs || []);
      }
      
      if (applicationsResponse.data?.success) {
        setApplications(applicationsResponse.data.applications || []);
      }
      
      setLastUpdated(new Date());
      setLoading(false);
      setRefreshing(false);
      setError(null);
    } catch (err) {
      console.error("Error fetching statistics data:", err);
      setError(err.message || "Failed to fetch statistics data");
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Set up listeners for data updates
  useEffect(() => {
    // Register update listeners for each data type
    updateListeners['users'] = [fetchData];
    updateListeners['consultations'] = [fetchData];
    updateListeners['jobs'] = [fetchData];
    updateListeners['applications'] = [fetchData];
    
    // Initial data fetch
    fetchData();
    
    // Cleanup listeners on unmount
    return () => {
      updateListeners['users'] = [];
      updateListeners['consultations'] = [];
      updateListeners['jobs'] = [];
      updateListeners['applications'] = [];
    };
  }, [fetchData]);

  // Filter data based on the selected timeframe
  const filterDataByTimeframe = (data) => {
    if (!Array.isArray(data) || timeframe === 'all') return data;
    
    const now = new Date();
    let cutoff = new Date();
    
    switch (timeframe) {
      case '24h':
        cutoff.setDate(now.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoff.setDate(now.getDate() - 90);
        break;
      default:
        return data;
    }
    
    return data.filter(item => new Date(item.createdAt) >= cutoff);
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prepare data for the User Status Chart
  const prepareUserStatusData = () => {
    const verified = users.filter(user => user.idVerification?.status === 'verified').length;
    const pending = users.filter(user => user.idVerification?.status === 'pending').length;
    const rejected = users.filter(user => user.idVerification?.status === 'rejected').length;
    const notSubmitted = users.length - verified - pending - rejected;
    
    return [
      { name: 'Verified', value: verified, color: colorPalette.secondary },
      { name: 'Pending', value: pending, color: colorPalette.accent },
      { name: 'Rejected', value: rejected, color: colorPalette.danger },
      { name: 'Not Submitted', value: notSubmitted, color: colorPalette.neutral }
    ];
  };

  // Prepare data for the Consultation Status Chart
  const prepareConsultationStatusData = () => {
    const completed = consultations.filter(c => c.status === 'completed').length;
    const pending = consultations.filter(c => c.status === 'pending' || !c.status).length;
    const confirmed = consultations.filter(c => c.status === 'confirmed').length;
    const cancelled = consultations.filter(c => c.status === 'cancelled').length;
    
    return [
      { name: 'Completed', value: completed, color: colorPalette.secondary },
      { name: 'Pending', value: pending, color: colorPalette.accent },
      { name: 'Confirmed', value: confirmed, color: colorPalette.primary },
      { name: 'Cancelled', value: cancelled, color: colorPalette.danger }
    ];
  };

  // Prepare data for the Job Status Chart
  const prepareJobStatusData = () => {
    const active = jobs.filter(job => 
      job.status === 'active' || 
      job.isAvailable === true || 
      job.status === 'available'
    ).length;
    
    const closed = jobs.filter(job => 
      job.status === 'closed' || 
      job.isAvailable === false
    ).length;
    
    return [
      { name: 'Active', value: active, color: colorPalette.secondary },
      { name: 'Closed', value: closed, color: colorPalette.neutral },
    ];
  };

  // Prepare data for the Application Status Chart
  const prepareApplicationStatusData = () => {
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const pending = applications.filter(app => app.status === 'pending' || !app.status).length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return [
      { name: 'Accepted', value: accepted, color: colorPalette.secondary },
      { name: 'Pending', value: pending, color: colorPalette.accent },
      { name: 'Rejected', value: rejected, color: colorPalette.danger }
    ];
  };

  // Prepare weekly registration data
  const prepareWeeklyRegistrationsData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);
      
      const dayUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= date && userDate < nextDay;
      });
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'New Users': dayUsers.length
      });
    }
    
    return data;
  };

  // Prepare monthly consultation growth data
  const prepareConsultationTrendData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      date.setDate(1); // First day of month
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      
      const monthConsultations = consultations.filter(consult => {
        const consultDate = new Date(consult.createdAt);
        return consultDate >= date && consultDate < nextMonth;
      });
      
      const completed = monthConsultations.filter(c => c.status === 'completed').length;
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        'All Consultations': monthConsultations.length,
        'Completed': completed
      });
    }
    
    return data;
  };

  // Prepare applications trend data
  const prepareApplicationsTrendData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      date.setDate(1); // First day of month
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      
      const monthApplications = applications.filter(app => {
        const appDate = new Date(app.createdAt);
        return appDate >= date && appDate < nextMonth;
      });
      
      const accepted = monthApplications.filter(app => app.status === 'accepted').length;
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        'All Applications': monthApplications.length,
        'Accepted': accepted
      });
    }
    
    return data;
  };

  // Prepare user growth trend data
  const prepareUserGrowthTrendData = () => {
    const data = [];
    const now = new Date();
    const startDate = new Date(now);
    startDate.setMonth(now.getMonth() - 5);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const monthStart = new Date(currentDate);
      const monthEnd = new Date(currentDate);
      monthEnd.setMonth(monthStart.getMonth() + 1);
      
      const monthUsers = users.filter(user => {
        const userDate = new Date(user.createdAt);
        return userDate >= monthStart && userDate < monthEnd;
      });
      
      data.push({
        name: currentDate.toLocaleDateString('en-US', { month: 'short' }),
        'Users': monthUsers.length
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return data;
  };

  // Calculate growth rates
  const calculateGrowthRate = (currentValue, previousValue) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Handle refresh button click
  const handleRefresh = () => {
    if (!refreshing) {
      fetchData();
    }
  };

  // Calculate the chart data
  const userStatusData = prepareUserStatusData();
  const consultationStatusData = prepareConsultationStatusData();
  const jobStatusData = prepareJobStatusData();
  const applicationStatusData = prepareApplicationStatusData();
  const userRegistrationData = prepareWeeklyRegistrationsData();
  const consultationTrendData = prepareConsultationTrendData();
  const applicationsTrendData = prepareApplicationsTrendData();
  const userGrowthTrendData = prepareUserGrowthTrendData();

  // Loading state with skeleton UI
  if (loading) {
    return (
      <div className={`admin-stats-container ${darkMode ? 'admin-stats-dark-mode' : ''}`}>
        <Sidebar />
        <main className="admin-stats-main">
          <div className="admin-stats-loading">
            <div className="admin-stats-spinner"></div>
            <p>Loading analytics data...</p>
            <p className="admin-stats-loading-subtext">Preparing your dashboard insights</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`admin-stats-container ${darkMode ? 'admin-stats-dark-mode' : ''}`}>
        <Sidebar />
        <main className="admin-stats-main">
          <div className="admin-stats-error-container">
            <FaTimesCircle size={50} />
            <h2>Error Loading Data</h2>
            <p>{error}</p>
            <button className="admin-stats-retry-button" onClick={fetchData}>
              <FaSync /> Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate statistics for the dashboard
  const totalUsers = users.length;
  const filteredUsers = filterDataByTimeframe(users);
  const userGrowth = calculateGrowthRate(
    filteredUsers.length,
    users.length - filteredUsers.length
  );

  const totalConsultations = consultations.length;
  const verifiedUsers = users.filter(user => user.idVerification && user.idVerification.status === 'verified').length;
  const pendingVerifications = users.filter(user => user.idVerification && user.idVerification.status === 'pending').length;
  const verificationRate = totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

  // Calculate consultation statistics
  const completedConsultations = consultations.filter(c => c.status === 'completed').length;
  const pendingConsultations = consultations.filter(c => c.status === 'pending' || !c.status).length;
  const confirmedConsultations = consultations.filter(c => c.status === 'confirmed').length;
  const completionRate = totalConsultations ? Math.round((completedConsultations / totalConsultations) * 100) : 0;

  // Calculate job statistics
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter(job => 
    job.status === 'active' || 
    job.isAvailable === true || 
    job.status === 'available'
  ).length;
  
  const closedJobs = jobs.filter(job => 
    job.status === 'closed' || 
    job.isAvailable === false
  ).length;
  
  // Calculate the average fixed budget amount for jobs
  const avgBudget = jobs.length ? 
    Math.round(jobs.reduce((sum, job) => sum + (job.fixedAmount || 0), 0) / jobs.length) : 0;

  // Update job availability calculation
  const availableJobs = activeJobs;
  const notAvailableJobs = closedJobs;

  // Calculate applications statistics
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(app => app.status === 'pending' || !app.status).length;
  const acceptedApplications = applications.filter(app => app.status === 'accepted').length;
  const rejectedApplications = applications.filter(app => app.status === 'rejected').length;
  const acceptanceRate = totalApplications ? Math.round((acceptedApplications / totalApplications) * 100) : 0;

  return (
    <div className={`admin-stats-container ${darkMode ? 'admin-stats-dark-mode' : ''}`}>
      <Sidebar />
      <main className="admin-stats-main">
        <div className="admin-stats-header">
          <div className="admin-stats-title">
            <h1>Analytics Dashboard</h1>
            <p>Comprehensive insights and performance metrics for NextYouth platform</p>
          </div>
          <div className="admin-stats-actions">
            <div className="admin-stats-last-updated">
              <span>Last updated: {formatDate(lastUpdated)}</span>
              <button 
                className={`admin-stats-refresh-button ${refreshing ? 'refreshing' : ''}`}
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <FaSync className="admin-stats-refresh-icon" /> {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="admin-stats-tabs">
          <button 
            className={`admin-stats-tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartBar /> Overview
          </button>
          <button 
            className={`admin-stats-tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> User Analytics
          </button>
          <button 
            className={`admin-stats-tab-button ${activeTab === 'consultations' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultations')}
          >
            <FaCalendarCheck /> Consultations
          </button>
          <button 
            className={`admin-stats-tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('jobs')}
          >
            <FaBriefcase /> Job Statistics
          </button>
          <button 
            className={`admin-stats-tab-button ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <FaClipboardList /> Applications
          </button>
        </div>
        
        <div className="admin-stats-filter-controls">
          <label htmlFor="timeframe">Data Timeframe:</label>
          <select 
            id="timeframe" 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="admin-stats-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        
        {activeTab === 'overview' && (
          <>
            <div className="admin-stats-overview">
              <div className="admin-stats-card">
                <div className="admin-stats-card-header">
                  <h3 className="admin-stats-card-title">Total Users</h3>
                  <div className="admin-stats-card-icon">
                    <FaUsers />
                  </div>
                </div>
                <p className="admin-stats-card-value">{totalUsers}</p>
                <p className={`admin-stats-card-change ${userGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {userGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(userGrowth).toFixed(1)}% {timeframe === 'all' ? 'growth' : `in last ${timeframe}`}
                </p>
              </div>
              
              <div className="admin-stats-card">
                <div className="admin-stats-card-header">
                  <h3 className="admin-stats-card-title">User Verification</h3>
                  <div className="admin-stats-card-icon">
                    <FaCheckCircle />
                  </div>
                </div>
                <p className="admin-stats-card-value">{verificationRate}%</p>
                <div className="admin-stats-progress-bar">
                  <div 
                    className="admin-stats-progress" 
                    style={{width: `${verificationRate}%`, backgroundColor: getStatusColor('verified')}}
                  ></div>
                </div>
                <p className="admin-stats-card-note">
                  <FaInfoCircle /> {pendingVerifications} pending verification{pendingVerifications !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="admin-stats-card">
                <div className="admin-stats-card-header">
                  <h3 className="admin-stats-card-title">Consultations</h3>
                  <div className="admin-stats-card-icon">
                    <FaCalendarCheck />
                  </div>
                </div>
                <p className="admin-stats-card-value">{totalConsultations}</p>
                <div className="admin-stats-progress-bar">
                  <div 
                    className="admin-stats-progress" 
                    style={{width: `${completionRate}%`, backgroundColor: getStatusColor('completed')}}
                  ></div>
                </div>
                <p className="admin-stats-card-note">
                  <FaThumbsUp /> {completionRate}% completion rate
                </p>
              </div>
              
              <div className="admin-stats-card">
                <div className="admin-stats-card-header">
                  <h3 className="admin-stats-card-title">Job Listings</h3>
                  <div className="admin-stats-card-icon">
                    <FaBriefcase />
                  </div>
                </div>
                <p className="admin-stats-card-value">{totalJobs}</p>
                <p className="admin-stats-card-note">
                  <span className="admin-stats-badge active">{activeJobs} Active</span>
                  <span className="admin-stats-badge closed">{closedJobs} Closed</span>
                </p>
                <p className="admin-stats-card-note">
                  <FaInfoCircle /> Avg. Budget: ${avgBudget}
                </p>
              </div>
            </div>
            
            <div className="admin-stats-grid">
              <div className="admin-stats-chart-card">
                <div className="admin-stats-chart-header">
                  <h3 className="admin-stats-chart-title">User Registration Trend</h3>
                </div>
                <div className="admin-stats-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userRegistrationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }} 
                        tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                      />
                      <YAxis 
                        tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                        tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                          color: darkMode ? "#e2e8f0" : "#334155",
                          border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                        }}
                      />
                      <Legend />
                      <Bar dataKey="New Users" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="admin-stats-chart-card">
                <div className="admin-stats-chart-header">
                  <h3 className="admin-stats-chart-title">Consultation Trends (6 Months)</h3>
                </div>
                <div className="admin-stats-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={consultationTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                        tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                      />
                      <YAxis 
                        tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                        tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                          color: darkMode ? "#e2e8f0" : "#334155",
                          border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                        }}
                      />
                      <Legend />
                      <Bar dataKey="All Consultations" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Completed" fill={colorPalette.secondary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-pie-charts">
              <div className="admin-stats-chart-card">
                <div className="admin-stats-chart-header">
                  <h3 className="admin-stats-chart-title">User Verification Status</h3>
                </div>
                <div className="admin-stats-chart-container">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={userStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({percent}) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {userStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                          color: darkMode ? "#e2e8f0" : "#334155",
                          border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="admin-stats-chart-card">
                <div className="admin-stats-chart-header">
                  <h3 className="admin-stats-chart-title">Consultation Status</h3>
                </div>
                <div className="admin-stats-chart-container">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={consultationStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({percent}) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {consultationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                          color: darkMode ? "#e2e8f0" : "#334155",
                          border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="admin-stats-chart-card">
                <div className="admin-stats-chart-header">
                  <h3 className="admin-stats-chart-title">Job Status</h3>
                </div>
                <div className="admin-stats-chart-container">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={jobStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({percent}) => percent > 0.08 ? `${(percent * 100).toFixed(0)}%` : ''}
                        labelLine={false}
                      >
                        {jobStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                          color: darkMode ? "#e2e8f0" : "#334155",
                          border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                        }}
                      />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Applications Status Overview</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        
        {activeTab === 'users' && (
          <div className="admin-stats-tab-content">
            <div className="admin-stats-section-header">
              <h2>User Analytics</h2>
              <p className="admin-stats-section-description">
                Detailed insights about user registration, verification status, and growth trends.
              </p>
            </div>
            
            <div className="admin-stats-summary-cards">
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaUsers /></div>
                <div className="admin-stats-summary-details">
                  <h3>{totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaCheckCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{verifiedUsers}</h3>
                  <p>Verified Users</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaTimesCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{totalUsers - verifiedUsers}</h3>
                  <p>Not Verified</p>
                </div>
              </div>
            </div>

            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Monthly User Growth</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={userGrowthTrendData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                      tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                      tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Users" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">User Verification Distribution</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {userStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'consultations' && (
          <div className="admin-stats-tab-content">
            <div className="admin-stats-section-header">
              <h2>Consultation Analytics</h2>
              <p className="admin-stats-section-description">
                Detailed metrics about consultation requests, status breakdowns, and completion rates.
              </p>
            </div>
            
            <div className="admin-stats-summary-cards">
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaCalendarCheck /></div>
                <div className="admin-stats-summary-details">
                  <h3>{totalConsultations}</h3>
                  <p>Total Consultations</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaCheckCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{completedConsultations}</h3>
                  <p>Completed</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaRegClock /></div>
                <div className="admin-stats-summary-details">
                  <h3>{confirmedConsultations}</h3>
                  <p>Confirmed</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaInfoCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{pendingConsultations}</h3>
                  <p>Pending</p>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Monthly Consultation Trends</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={consultationTrendData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }} 
                      tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                      tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="All Consultations" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill={colorPalette.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Consultation Status Distribution</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={consultationStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {consultationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'jobs' && (
          <div className="admin-stats-tab-content">
            <div className="admin-stats-section-header">
              <h2>Job Statistics</h2>
              <p className="admin-stats-section-description">
                Detailed metrics about job postings, status distribution, and budget information.
              </p>
            </div>
            
            <div className="admin-stats-summary-cards">
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaBriefcase /></div>
                <div className="admin-stats-summary-details">
                  <h3>{totalJobs}</h3>
                  <p>Total Jobs</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaCheckCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{availableJobs}</h3>
                  <p>Available</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaTimesCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{notAvailableJobs}</h3>
                  <p>Not Available</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaRegClock /></div>
                <div className="admin-stats-summary-details">
                  <h3>${avgBudget}</h3>
                  <p>Avg. Budget</p>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Job Status Distribution</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="admin-stats-tab-content">
            <div className="admin-stats-section-header">
              <h2>Application Analytics</h2>
              <p className="admin-stats-section-description">
                Detailed metrics about job applications, status distribution, and acceptance rates.
              </p>
            </div>
            
            <div className="admin-stats-summary-cards">
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaClipboardList /></div>
                <div className="admin-stats-summary-details">
                  <h3>{totalApplications}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaCheckCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{acceptedApplications}</h3>
                  <p>Accepted</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaRegClock /></div>
                <div className="admin-stats-summary-details">
                  <h3>{pendingApplications}</h3>
                  <p>Pending</p>
                </div>
              </div>
              <div className="admin-stats-summary-card">
                <div className="admin-stats-summary-icon"><FaTimesCircle /></div>
                <div className="admin-stats-summary-details">
                  <h3>{rejectedApplications}</h3>
                  <p>Rejected</p>
                </div>
              </div>
            </div>
            
            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Application Status Distribution</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="admin-stats-chart-card admin-stats-full-width">
              <div className="admin-stats-chart-header">
                <h3 className="admin-stats-chart-title">Monthly Application Trends</h3>
              </div>
              <div className="admin-stats-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={applicationsTrendData} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                      tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? "#e2e8f0" : "#334155" }}
                      tickLine={{ stroke: darkMode ? "#4a5568" : "#cbd5e1" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        color: darkMode ? "#e2e8f0" : "#334155",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`
                      }}
                    />
                    <Legend />
                    <Bar dataKey="All Applications" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Accepted" fill={colorPalette.secondary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Statistics;
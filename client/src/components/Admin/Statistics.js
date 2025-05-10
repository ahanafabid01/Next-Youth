import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
  FaThumbsUp,
  FaMoneyBillWave,
  FaBuilding,
  FaShieldAlt
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

  // Prepare monthly job trend data
  const prepareJobTrendData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(date);
      nextMonth.setMonth(date.getMonth() + 1);
      
      const monthJobs = jobs.filter(job => {
        const jobDate = new Date(job.createdAt);
        return jobDate >= date && jobDate < nextMonth;
      });
      
      const active = monthJobs.filter(job => 
        job.status === 'active' || 
        job.isAvailable === true || 
        job.status === 'available'
      ).length;
      
      const closed = monthJobs.filter(job => 
        job.status === 'closed' || 
        job.isAvailable === false
      ).length;
      
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        'Posted Jobs': monthJobs.length,
        'Active': active,
        'Closed': closed
      });
    }
    
    return data;
  };

  // Prepare job category distribution data
  const prepareJobCategoryData = () => {
    const categories = {};
    
    jobs.forEach(job => {
      const category = job.category || 'Uncategorized';
      if (categories[category]) {
        categories[category]++;
      } else {
        categories[category] = 1;
      }
    });
    
    const colors = colorPalette.chartColors;
    let colorIndex = 0;
    
    return Object.entries(categories).map(([name, value]) => {
      const color = colors[colorIndex % colors.length];
      colorIndex++;
      return { name, value, color };
    });
  };

  // Prepare job salary range distribution data
  const prepareJobSalaryRangeData = () => {
    const ranges = {
      'Under $1k': 0,
      '$1k - $3k': 0,
      '$3k - $5k': 0,
      '$5k - $10k': 0,
      'Above $10k': 0
    };
    
    jobs.forEach(job => {
      const amount = job.fixedAmount || 0;
      
      if (amount < 1000) {
        ranges['Under $1k']++;
      } else if (amount < 3000) {
        ranges['$1k - $3k']++;
      } else if (amount < 5000) {
        ranges['$3k - $5k']++;
      } else if (amount < 10000) {
        ranges['$5k - $10k']++;
      } else {
        ranges['Above $10k']++;
      }
    });
    
    const colors = colorPalette.chartColors;
    let colorIndex = 0;
    
    return Object.entries(ranges).map(([name, value]) => {
      const color = colors[colorIndex % colors.length];
      colorIndex++;
      return { name, value, color };
    });
  };

  // Prepare job applications per month data
  const prepareApplicationsPerJobData = () => {
    if (jobs.length === 0) return [];
    
    // Get the top 10 jobs with the most applications
    const jobApplications = jobs.map(job => {
      const jobApps = applications.filter(app => app.jobId === job._id);
      return {
        jobTitle: job.title || `Job #${job._id.substring(0, 6)}`,
        applications: jobApps.length
      };
    });
    
    return jobApplications
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10)
      .map(item => ({
        name: item.jobTitle.length > 20 ? 
          item.jobTitle.substring(0, 18) + '...' : 
          item.jobTitle,
        Applications: item.applications
      }));
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
  const jobStatusData = prepareJobStatusData();
  const jobTrendData = prepareJobTrendData();
  const jobCategoryData = prepareJobCategoryData();
  const jobSalaryRangeData = prepareJobSalaryRangeData();
  const applicationsPerJobData = prepareApplicationsPerJobData();

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
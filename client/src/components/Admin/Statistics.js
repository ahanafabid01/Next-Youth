import React, { useState, useEffect, useCallback } from "react";
import { 
  FaChartBar, FaUsers, FaBriefcase, FaCalendarCheck, 
  FaFilter, FaRedoAlt, FaFileDownload, FaSearch
} from "react-icons/fa";
import { 
  PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell
} from "recharts";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";
import "./Statistics.css";
import axios from "axios";
import logoLight from "../../assets/images/logo-light.png";
import logoDark from "../../assets/images/logo-dark.png";
import { eventEmitter, dataStore } from '../../utils/eventEmitter';

// Export this function to be used by other components
export const notifyDataUpdate = (type) => {
  eventEmitter.emit('dataUpdated', { type });
};

const Statistics = () => {
  // State management
  const [userData, setUserData] = useState([]);
  const [jobData, setJobData] = useState([]);
  const [consultationData, setConsultationData] = useState([]);
  const [applicationData, setApplicationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeFrame, setTimeFrame] = useState("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("adminTheme") === "dark";
  });
  
  const itemsPerPage = 8;

  // Colors for charts
  const colors = {
    primary: "#3a86ff",
    secondary: "#10b981",
    accent: "#f59e0b",
    danger: "#ef4444",
    chartColors: ["#3a86ff", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
  };

  // Listen for theme changes
  useEffect(() => {
    const handleStorageChange = () => {
      const theme = localStorage.getItem("adminTheme");
      setDarkMode(theme === "dark");
    };
    
    window.addEventListener('storage', handleStorageChange);
    handleStorageChange();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch statistics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Try to get data from dataStore first
      let users = dataStore.users || [];
      let jobs = dataStore.jobs || [];
      let consultations = dataStore.consultations || [];
      let applications = [];
      
      // Fetch data if not available in store
      if (users.length === 0) {
        const usersResponse = await axios.get("http://localhost:4000/api/auth/admin/users", {
          withCredentials: true
        });
        if (usersResponse.data?.success) {
          users = usersResponse.data.users;
          dataStore.setUsers(users);
        }
      }
      
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
      
      // Fetch applications data
      try {
        const applicationsResponse = await axios.get("http://localhost:4000/api/jobs/applications", {
          withCredentials: true
        });
        if (applicationsResponse.data?.success) {
          applications = applicationsResponse.data.applications;
        }
      } catch (appError) {
        console.warn("Failed to fetch applications data:", appError);
      }
      
      // Format data for our component
      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name || 'Unknown',
        email: user.email || 'No email',
        status: user.status || 'active',
        registeredAt: user.createdAt,
        verificationStatus: user.idVerification?.status || 'notsubmitted'
      }));
      
      const formattedJobs = jobs.map(job => ({
        id: job._id,
        title: job.title || 'Untitled Job',
        company: job.company || 'Unknown',
        status: job.status || 'active',
        postedAt: job.createdAt,
        applications: 0 // Will update this below
      }));
      
      const formattedConsultations = consultations.map(consultation => ({
        id: consultation._id,
        title: consultation.subject || 'No Subject',
        status: consultation.status || 'pending',
        scheduledFor: consultation.scheduledDate || consultation.createdAt,
        duration: consultation.duration || 30
      }));
      
      const formattedApplications = applications.map(app => ({
        id: app._id,
        jobId: app.jobId,
        userId: app.userId,
        status: app.status || 'pending',
        appliedAt: app.createdAt
      }));
      
      // Count applications per job
      formattedApplications.forEach(app => {
        const jobIndex = formattedJobs.findIndex(job => job.id === app.jobId);
        if (jobIndex !== -1) {
          formattedJobs[jobIndex].applications++;
        }
      });
      
      setUserData(formattedUsers);
      setJobData(formattedJobs);
      setConsultationData(formattedConsultations);
      setApplicationData(formattedApplications);
      
      // Set up listener for data updates
      const unsubscribe = eventEmitter.on('dataUpdated', ({ type }) => {
        console.log(`Data updated: ${type}`);
        fetchData();
      });
      
      return () => unsubscribe();
      
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(err.message || "Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Data preparation functions
  const prepareStatusData = (data, statusField = 'status') => {
    const statusCounts = data.reduce((acc, item) => {
      const status = item[statusField] || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(statusCounts).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: value
    }));
  };

  const prepareTrendData = () => {
    // Create date buckets for the last 6 months
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      months.push({
        date: d,
        name: d.toLocaleString('default', { month: 'short' }),
        users: 0,
        jobs: 0,
        consultations: 0,
        applications: 0
      });
    }
    
    // Count items by month
    const countByMonth = (data, dateField) => {
      data.forEach(item => {
        if (!item[dateField]) return;
        
        const itemDate = new Date(item[dateField]);
        const monthIndex = months.findIndex(m => 
          m.date.getMonth() === itemDate.getMonth() && 
          m.date.getFullYear() === itemDate.getFullYear()
        );
        
        if (monthIndex >= 0) {
          if (item.id.startsWith('u')) months[monthIndex].users++;
          else if (item.id.startsWith('j')) months[monthIndex].jobs++;
          else if (item.id.startsWith('c')) months[monthIndex].consultations++;
          else if (item.id.startsWith('a')) months[monthIndex].applications++;
        }
      });
    };
    
    // Count users, jobs, consultations, and applications by month
    countByMonth(userData, 'registeredAt');
    countByMonth(jobData, 'postedAt');
    countByMonth(consultationData, 'scheduledFor');
    countByMonth(applicationData, 'appliedAt');
    
    return months;
  };

  // Calculate summary statistics
  const totalUsers = userData.length;
  const activeUsers = userData.filter(user => user.status === "active").length;
  const verifiedUsers = userData.filter(user => user.verificationStatus === "verified").length;
  
  const totalJobs = jobData.length;
  const activeJobs = jobData.filter(job => job.status === "active").length;
  
  const totalConsultations = consultationData.length;
  const completedConsultations = consultationData.filter(cons => cons.status === "completed").length;
  
  const totalApplications = applicationData.length;
  const acceptedApplications = applicationData.filter(app => app.status === "accepted").length;

  // Prepare specific data sets
  const userStatusData = prepareStatusData(userData);
  const jobStatusData = prepareStatusData(jobData);
  const consultationStatusData = prepareStatusData(consultationData);
  const applicationStatusData = prepareStatusData(applicationData);
  const trendData = prepareTrendData();

  // Handle page change for pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Determine which data to paginate based on active tab
  const getTabData = () => {
    switch (activeTab) {
      case "users": return userData;
      case "jobs": return jobData;
      case "consultations": return consultationData;
      case "applications": return applicationData;
      default: return [];
    }
  };

  const tabData = getTabData();
  const totalPages = Math.ceil(tabData.length / itemsPerPage);
  const currentData = tabData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Render loading state
  if (loading) {
    return (
      <div className={`stats-container ${darkMode ? "stats-dark-mode" : ""}`}>
        <Sidebar />
        <div className="stats-mobile-header">
          <button 
            className="stats-mobile-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <img 
            src={darkMode ? logoDark : logoLight}
            alt="NextYouth Admin"
            className="stats-mobile-logo"
          />
        </div>
        <div className="stats-main">
          <div className="stats-loading">
            <div className="stats-loading-spinner"></div>
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`stats-container ${darkMode ? "stats-dark-mode" : ""}`}>
        <Sidebar />
        <div className="stats-mobile-header">
          <button 
            className="stats-mobile-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <img 
            src={darkMode ? logoDark : logoLight}
            alt="NextYouth Admin"
            className="stats-mobile-logo"
          />
        </div>
        <div className="stats-main">
          <div className="stats-error-message">
            <p>Failed to load statistics: {error}</p>
            <button onClick={fetchData} className="stats-retry-button">
              <FaRedoAlt /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`stats-container ${darkMode ? "stats-dark-mode" : ""}`}>
      <Sidebar />
      
      <div className="stats-mobile-header">
        <button 
          className="stats-mobile-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
        <img 
          src={darkMode ? logoDark : logoLight}
          alt="NextYouth Admin"
          className="stats-mobile-logo"
        />
      </div>
      
      <div className="stats-main">
        <div className="stats-header">
          <div className="stats-title">
            <h1>Analytics Dashboard</h1>
            <p>Comprehensive statistical insights into platform performance</p>
          </div>
          <div className="stats-actions">
            <button className="stats-action-button" onClick={fetchData} title="Refresh data">
              <FaRedoAlt /> <span>Refresh</span>
            </button>
            <div className="stats-time-filter">
              <FaFilter />
              <select 
                value={timeFrame} 
                onChange={(e) => setTimeFrame(e.target.value)}
                className="stats-select"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <button className="stats-action-button" title="Export data">
              <FaFileDownload /> <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="stats-summary-grid">
          <div className="stats-summary-card">
            <div className="stats-summary-icon users">
              <FaUsers />
            </div>
            <div className="stats-summary-info">
              <h3>Users</h3>
              <div className="stats-summary-value">{totalUsers}</div>
              <div className="stats-summary-detail">
                <span>{activeUsers} active</span>
                <span className="stats-percentage">{totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0}%</span>
              </div>
            </div>
          </div>
          
          <div className="stats-summary-card">
            <div className="stats-summary-icon jobs">
              <FaBriefcase />
            </div>
            <div className="stats-summary-info">
              <h3>Jobs</h3>
              <div className="stats-summary-value">{totalJobs}</div>
              <div className="stats-summary-detail">
                <span>{activeJobs} active</span>
                <span className="stats-percentage">{totalJobs ? Math.round((activeJobs / totalJobs) * 100) : 0}%</span>
              </div>
            </div>
          </div>
          
          <div className="stats-summary-card">
            <div className="stats-summary-icon consultations">
              <FaCalendarCheck />
            </div>
            <div className="stats-summary-info">
              <h3>Consultations</h3>
              <div className="stats-summary-value">{totalConsultations}</div>
              <div className="stats-summary-detail">
                <span>{completedConsultations} completed</span>
                <span className="stats-percentage">
                  {totalConsultations ? Math.round((completedConsultations / totalConsultations) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="stats-summary-card">
            <div className="stats-summary-icon applications">
              <FaChartBar />
            </div>
            <div className="stats-summary-info">
              <h3>Applications</h3>
              <div className="stats-summary-value">{totalApplications}</div>
              <div className="stats-summary-detail">
                <span>{acceptedApplications} accepted</span>
                <span className="stats-percentage">
                  {totalApplications ? Math.round((acceptedApplications / totalApplications) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Charts Section */}
        <div className="stats-charts-section">
          <div className="stats-chart-container full-width">
            <h2>Growth Trends</h2>
            <div className="stats-chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#2d3748" : "#e2e8f0"} />
                  <XAxis dataKey="name" stroke={darkMode ? "#e2e8f0" : "#334155"} />
                  <YAxis stroke={darkMode ? "#e2e8f0" : "#334155"} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                      border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`,
                      color: darkMode ? "#e2e8f0" : "#334155"
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke={colors.primary} 
                    activeDot={{ r: 8 }} 
                    name="Users" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="jobs" 
                    stroke={colors.secondary} 
                    activeDot={{ r: 8 }} 
                    name="Jobs" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consultations" 
                    stroke={colors.accent} 
                    activeDot={{ r: 8 }} 
                    name="Consultations" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="applications" 
                    stroke={colors.danger} 
                    activeDot={{ r: 8 }} 
                    name="Applications" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="stats-charts-grid">
            <div className="stats-chart-container">
              <h2>User Status</h2>
              <div className="stats-chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={userStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {userStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} (${totalUsers ? ((value / totalUsers) * 100).toFixed(1) : 0}%)`, name]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`,
                        color: darkMode ? "#e2e8f0" : "#334155"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="stats-chart-container">
              <h2>Job Status</h2>
              <div className="stats-chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {jobStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} (${totalJobs ? ((value / totalJobs) * 100).toFixed(1) : 0}%)`, name]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`,
                        color: darkMode ? "#e2e8f0" : "#334155"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="stats-chart-container">
              <h2>Consultation Status</h2>
              <div className="stats-chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={consultationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {consultationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} (${totalConsultations ? ((value / totalConsultations) * 100).toFixed(1) : 0}%)`, name]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`,
                        color: darkMode ? "#e2e8f0" : "#334155"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="stats-chart-container">
              <h2>Application Status</h2>
              <div className="stats-chart-wrapper">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={applicationStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {applicationStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors.chartColors[index % colors.chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} (${totalApplications ? ((value / totalApplications) * 100).toFixed(1) : 0}%)`, name]}
                      contentStyle={{ 
                        backgroundColor: darkMode ? "#1e293b" : "#ffffff",
                        border: `1px solid ${darkMode ? "#2d3748" : "#e2e8f0"}`,
                        color: darkMode ? "#e2e8f0" : "#334155"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Table Section */}
        <div className="stats-table-section">
          <div className="stats-table-header">
            <h2>Detailed Data</h2>
            <div className="stats-tab-navigation">
              <button 
                className={activeTab === "overview" ? "active" : ""} 
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button 
                className={activeTab === "users" ? "active" : ""} 
                onClick={() => {
                  setActiveTab("users");
                  setCurrentPage(1);
                }}
              >
                Users
              </button>
              <button 
                className={activeTab === "jobs" ? "active" : ""} 
                onClick={() => {
                  setActiveTab("jobs");
                  setCurrentPage(1);
                }}
              >
                Jobs
              </button>
              <button 
                className={activeTab === "consultations" ? "active" : ""} 
                onClick={() => {
                  setActiveTab("consultations");
                  setCurrentPage(1);
                }}
              >
                Consultations
              </button>
              <button 
                className={activeTab === "applications" ? "active" : ""} 
                onClick={() => {
                  setActiveTab("applications");
                  setCurrentPage(1);
                }}
              >
                Applications
              </button>
            </div>
          </div>
          
          {activeTab === "overview" ? (
            <div className="stats-overview-cards">
              <div className="stats-metric-card">
                <h3>Verification Rate</h3>
                <div className="stats-metric-value">{totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0}%</div>
                <p>Users with verified accounts</p>
              </div>
              
              <div className="stats-metric-card">
                <h3>Job Activity</h3>
                <div className="stats-metric-value">{totalJobs ? Math.round((activeJobs / totalJobs) * 100) : 0}%</div>
                <p>Currently active job listings</p>
              </div>
              
              <div className="stats-metric-card">
                <h3>Completion Rate</h3>
                <div className="stats-metric-value">{totalConsultations ? Math.round((completedConsultations / totalConsultations) * 100) : 0}%</div>
                <p>Consultations successfully completed</p>
              </div>
              
              <div className="stats-metric-card">
                <h3>Acceptance Rate</h3>
                <div className="stats-metric-value">{totalApplications ? Math.round((acceptedApplications / totalApplications) * 100) : 0}%</div>
                <p>Job applications accepted</p>
              </div>
            </div>
          ) : (
            <>
              <div className="stats-table-container">
                <table className="stats-data-table">
                  <thead>
                    <tr>
                      {activeTab === "users" && (
                        <>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Registration Date</th>
                          <th>Verification</th>
                        </>
                      )}
                      
                      {activeTab === "jobs" && (
                        <>
                          <th>Title</th>
                          <th>Company</th>
                          <th>Status</th>
                          <th>Posted Date</th>
                          <th>Applications</th>
                        </>
                      )}
                      
                      {activeTab === "consultations" && (
                        <>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Scheduled For</th>
                          <th>Duration</th>
                        </>
                      )}
                      
                      {activeTab === "applications" && (
                        <>
                          <th>Job ID</th>
                          <th>User ID</th>
                          <th>Status</th>
                          <th>Applied Date</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((item) => (
                        <tr key={item.id}>
                          {activeTab === "users" && (
                            <>
                              <td>{item.name}</td>
                              <td>{item.email}</td>
                              <td>
                                <span className={`stats-status-badge ${item.status}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{new Date(item.registeredAt).toLocaleDateString()}</td>
                              <td>
                                <span className={`stats-status-badge ${item.verificationStatus}`}>
                                  {item.verificationStatus}
                                </span>
                              </td>
                            </>
                          )}
                          
                          {activeTab === "jobs" && (
                            <>
                              <td>{item.title}</td>
                              <td>{item.company}</td>
                              <td>
                                <span className={`stats-status-badge ${item.status}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{new Date(item.postedAt).toLocaleDateString()}</td>
                              <td>{item.applications}</td>
                            </>
                          )}
                          
                          {activeTab === "consultations" && (
                            <>
                              <td>{item.title}</td>
                              <td>
                                <span className={`stats-status-badge ${item.status}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{new Date(item.scheduledFor).toLocaleDateString()}</td>
                              <td>{item.duration} min</td>
                            </>
                          )}
                          
                          {activeTab === "applications" && (
                            <>
                              <td>
                                <Link to={`/admin-dashboard/job-details/${item.jobId}`}>
                                  {item.jobId}
                                </Link>
                              </td>
                              <td>
                                <Link to={`/admin-dashboard/users/${item.userId}`}>
                                  {item.userId}
                                </Link>
                              </td>
                              <td>
                                <span className={`stats-status-badge ${item.status}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{new Date(item.appliedAt).toLocaleDateString()}</td>
                            </>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                            <FaSearch style={{ fontSize: '2rem', opacity: 0.5 }} />
                            <p>No data available for this category</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="stats-pagination">
                  <button 
                    onClick={() => handlePageChange(1)} 
                    disabled={currentPage === 1}
                    className="stats-pagination-button"
                  >
                    First
                  </button>
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="stats-pagination-button"
                  >
                    Prev
                  </button>
                  
                  {/* Show page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(pageNum => 
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    )
                    .map(pageNum => {
                      // If there's a gap in page numbers, show ellipsis
                      if (pageNum !== 1 && 
                          pageNum !== totalPages && 
                          !(pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                        return <span key={`ellipsis-${pageNum}`} className="stats-pagination-ellipsis">...</span>;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`stats-pagination-button ${currentPage === pageNum ? "active" : ""}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="stats-pagination-button"
                  >
                    Next
                  </button>
                  <button 
                    onClick={() => handlePageChange(totalPages)} 
                    disabled={currentPage === totalPages}
                    className="stats-pagination-button"
                  >
                    Last
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./Statistics.css";
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { FaUsers, FaFileAlt, FaCalendarCheck, FaBriefcase } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  
  // State for statistics data
  const [stats, setStats] = useState({
    users: {
      total: 0,
      verified: 0,
      unverified: 0,
      growth: 0
    },
    jobs: {
      total: 0,
      active: 0,
      completed: 0,
      growth: 0
    },
    consultations: {
      total: 0,
      pending: 0,
      completed: 0,
      growth: 0
    },
    revenue: {
      total: 0,
      monthly: 0,
      growth: 0
    },
    usersByMonth: [],
    jobsByMonth: [],
    consultationsByMonth: [],
    revenueByMonth: [],
    userTypes: [],
    jobCategories: [],
    consultationTypes: []
  });

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // In a real application, you would make API calls to get this data
      // For now, we'll simulate the data fetching with a timeout
      
      setTimeout(() => {
        // Mock data - in a real app, this would come from your API
        const mockStats = generateMockStatistics(timeRange);
        setStats(mockStats);
        setLoading(false);
      }, 1000);

      // Example of how you'd fetch from your actual API:
      /*
      const response = await axios.get(`http://localhost:4000/api/admin/statistics?timeRange=${timeRange}`, {
        withCredentials: true
      });
      
      if (response.data && response.data.success) {
        setStats(response.data.statistics);
      } else {
        throw new Error(response.data?.message || "Failed to fetch statistics");
      }
      setLoading(false);
      */
      
    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError(`Failed to load statistics: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  // User growth chart configuration
  const userGrowthChartData = {
    labels: stats.usersByMonth.map(item => item.month),
    datasets: [
      {
        label: 'Total Users',
        data: stats.usersByMonth.map(item => item.count),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  // Job statistics chart configuration
  const jobStatisticsChartData = {
    labels: stats.jobsByMonth.map(item => item.month),
    datasets: [
      {
        label: 'Posted Jobs',
        data: stats.jobsByMonth.map(item => item.count),
        backgroundColor: '#7c3aed',
      }
    ]
  };

  // Consultation types chart configuration
  const consultationTypesChartData = {
    labels: stats.consultationTypes.map(item => item.type),
    datasets: [
      {
        label: 'Consultation Types',
        data: stats.consultationTypes.map(item => item.count),
        backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#ef4444', '#8b5cf6'],
        borderColor: ['#ffffff'],
        borderWidth: 2,
      }
    ]
  };

  // User types chart configuration
  const userTypesChartData = {
    labels: stats.userTypes.map(item => item.type),
    datasets: [
      {
        label: 'User Types',
        data: stats.userTypes.map(item => item.count),
        backgroundColor: ['#10b981', '#3b82f6', '#f97316', '#8b5cf6'],
        borderColor: ['#ffffff'],
        borderWidth: 2,
      }
    ]
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: false
      },
    }
  };

  if (loading) return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="loading">Loading statistics data...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="error-message">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <div className="main-content">
        <div className="dashboard-container">
          <h1>Dashboard Statistics</h1>
          
          {/* Time range filter */}
          <div className="filter-controls">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Select time range"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past 3 Months</option>
              <option value="year">Past Year</option>
            </select>
            <button onClick={fetchStatistics}>Refresh Data</button>
          </div>
          
          {/* Stats Overview Cards */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">TOTAL USERS</h3>
                <div className="stat-icon bg-blue">
                  <FaUsers />
                </div>
              </div>
              <p className="stat-value">{stats.users.total.toLocaleString()}</p>
              <p className="stat-change positive">
                +{stats.users.growth}% since last {timeRange}
              </p>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">ACTIVE JOBS</h3>
                <div className="stat-icon bg-green">
                  <FaBriefcase />
                </div>
              </div>
              <p className="stat-value">{stats.jobs.active.toLocaleString()}</p>
              <p className={`stat-change ${stats.jobs.growth >= 0 ? 'positive' : 'negative'}`}>
                {stats.jobs.growth >= 0 ? '+' : ''}{stats.jobs.growth}% since last {timeRange}
              </p>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">CONSULTATIONS</h3>
                <div className="stat-icon bg-purple">
                  <FaCalendarCheck />
                </div>
              </div>
              <p className="stat-value">{stats.consultations.total.toLocaleString()}</p>
              <p className="stat-change positive">
                +{stats.consultations.growth}% since last {timeRange}
              </p>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <h3 className="stat-title">DOCUMENTS</h3>
                <div className="stat-icon bg-orange">
                  <FaFileAlt />
                </div>
              </div>
              <p className="stat-value">{(stats.users.total * 2.5).toFixed(0).toLocaleString()}</p>
              <p className="stat-change positive">
                +{(stats.users.growth * 1.2).toFixed(1)}% since last {timeRange}
              </p>
            </div>
          </div>
          
          {/* Charts Grid */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">User Growth</h3>
              </div>
              <div className="chart-container">
                <Line options={lineChartOptions} data={userGrowthChartData} />
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Jobs Posted</h3>
              </div>
              <div className="chart-container">
                <Bar options={barChartOptions} data={jobStatisticsChartData} />
              </div>
            </div>
          </div>
          
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Consultation Distribution</h3>
              </div>
              <div className="chart-container">
                <Pie options={pieChartOptions} data={consultationTypesChartData} />
              </div>
            </div>
            
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">User Types</h3>
              </div>
              <div className="chart-container">
                <Doughnut options={pieChartOptions} data={userTypesChartData} />
              </div>
            </div>
          </div>
          
          {/* Detailed Statistics Cards */}
          <div className="detailed-stats">
            <div className="stat-type-card">
              <h3>User Statistics</h3>
              <ul className="stat-list">
                <li className="stat-item">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{stats.users.total.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Verified Users</span>
                  <span className="stat-value">{stats.users.verified.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Unverified Users</span>
                  <span className="stat-value">{stats.users.unverified.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Active Today</span>
                  <span className="stat-value">{Math.floor(stats.users.total * 0.3).toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">New This Week</span>
                  <span className="stat-value">{Math.floor(stats.users.total * 0.08).toLocaleString()}</span>
                </li>
              </ul>
            </div>
            
            <div className="stat-type-card">
              <h3>Job Statistics</h3>
              <ul className="stat-list">
                <li className="stat-item">
                  <span className="stat-label">Total Jobs</span>
                  <span className="stat-value">{stats.jobs.total.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Active Jobs</span>
                  <span className="stat-value">{stats.jobs.active.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Completed Jobs</span>
                  <span className="stat-value">{stats.jobs.completed.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Average Budget</span>
                  <span className="stat-value">${Math.floor(Math.random() * 500 + 500).toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Posted This Week</span>
                  <span className="stat-value">{Math.floor(stats.jobs.total * 0.15).toLocaleString()}</span>
                </li>
              </ul>
            </div>
            
            <div className="stat-type-card">
              <h3>Consultation Statistics</h3>
              <ul className="stat-list">
                <li className="stat-item">
                  <span className="stat-label">Total Consultations</span>
                  <span className="stat-value">{stats.consultations.total.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Pending</span>
                  <span className="stat-value">{stats.consultations.pending.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{stats.consultations.completed.toLocaleString()}</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Satisfaction Rate</span>
                  <span className="stat-value">94%</span>
                </li>
                <li className="stat-item">
                  <span className="stat-label">Average Duration</span>
                  <span className="stat-value">48 min</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Function to generate mock statistics data
const generateMockStatistics = (timeRange) => {
  const multiplier = timeRange === 'week' ? 1 : 
                    timeRange === 'month' ? 4 : 
                    timeRange === 'quarter' ? 12 : 48;
  
  // Generate user growth data
  const usersByMonth = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  let baseUsers = 150;
  for (let i = 0; i < multiplier; i++) {
    const monthIndex = (currentMonth - multiplier + i + 12) % 12;
    baseUsers += Math.floor(Math.random() * 50) + 20;
    usersByMonth.push({
      month: months[monthIndex],
      count: baseUsers
    });
  }
  
  // Generate job statistics
  const jobsByMonth = [];
  let baseJobs = 10;
  for (let i = 0; i < multiplier; i++) {
    const monthIndex = (currentMonth - multiplier + i + 12) % 12;
    baseJobs += Math.floor(Math.random() * 15) + 5;
    jobsByMonth.push({
      month: months[monthIndex],
      count: baseJobs
    });
  }
  
  // Generate consultation data
  const consultationsByMonth = [];
  let baseConsultations = 5;
  for (let i = 0; i < multiplier; i++) {
    const monthIndex = (currentMonth - multiplier + i + 12) % 12;
    baseConsultations += Math.floor(Math.random() * 20) + 8;
    consultationsByMonth.push({
      month: months[monthIndex],
      count: baseConsultations
    });
  }
  
  // Calculate total users
  const totalUsers = baseUsers;
  const verifiedUsers = Math.floor(totalUsers * 0.75);
  
  // Calculate total jobs
  const totalJobs = baseJobs * 3;
  const activeJobs = Math.floor(totalJobs * 0.4);
  const completedJobs = totalJobs - activeJobs;
  
  // Calculate total consultations
  const totalConsultations = baseConsultations * 5;
  const pendingConsultations = Math.floor(totalConsultations * 0.3);
  const completedConsultations = totalConsultations - pendingConsultations;
  
  // Consultation types
  const consultationTypes = [
    { type: 'Career Advice', count: Math.floor(totalConsultations * 0.4) },
    { type: 'Resume Review', count: Math.floor(totalConsultations * 0.25) },
    { type: 'Interview Prep', count: Math.floor(totalConsultations * 0.2) },
    { type: 'Job Search', count: Math.floor(totalConsultations * 0.1) },
    { type: 'Other', count: Math.floor(totalConsultations * 0.05) }
  ];
  
  // User types
  const userTypes = [
    { type: 'Students', count: Math.floor(totalUsers * 0.45) },
    { type: 'Graduates', count: Math.floor(totalUsers * 0.30) },
    { type: 'Employers', count: Math.floor(totalUsers * 0.15) },
    { type: 'Mentors', count: Math.floor(totalUsers * 0.10) }
  ];
  
  // Job categories
  const jobCategories = [
    { category: 'Technology', count: Math.floor(totalJobs * 0.35) },
    { category: 'Marketing', count: Math.floor(totalJobs * 0.15) },
    { category: 'Design', count: Math.floor(totalJobs * 0.20) },
    { category: 'Business', count: Math.floor(totalJobs * 0.20) },
    { category: 'Other', count: Math.floor(totalJobs * 0.10) }
  ];
  
  return {
    users: {
      total: totalUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
      growth: Math.floor(Math.random() * 15) + 10
    },
    jobs: {
      total: totalJobs,
      active: activeJobs,
      completed: completedJobs,
      growth: Math.floor(Math.random() * 25) - 5
    },
    consultations: {
      total: totalConsultations,
      pending: pendingConsultations,
      completed: completedConsultations,
      growth: Math.floor(Math.random() * 30) + 5
    },
    revenue: {
      total: totalUsers * 50,
      monthly: totalUsers * 5,
      growth: Math.floor(Math.random() * 20) + 15
    },
    usersByMonth,
    jobsByMonth,
    consultationsByMonth,
    revenueByMonth: usersByMonth.map(item => ({ month: item.month, amount: item.count * 50 })),
    userTypes,
    jobCategories,
    consultationTypes
  };
};

export default Statistics;
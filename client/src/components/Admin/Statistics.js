import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import "./Statistics.css";
import axios from "axios";
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
    FaUsers, FaChartLine, FaCalendarCheck, FaBriefcase, 
    FaRegClock, FaSync, FaCheckCircle, FaTimesCircle,
    FaArrowUp, FaArrowDown, FaThumbsUp, FaInfoCircle
} from "react-icons/fa";

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
            updateListeners[dataType].forEach(callback => callback());
        }
    }, 500);
};

const Statistics = () => {
    // State for all types of data
    const [users, setUsers] = useState([]);
    const [consultations, setConsultations] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeframe, setTimeframe] = useState('7d'); // Default timeframe is 7 days
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [activeTab, setActiveTab] = useState('overview');

    // Color palette for consistent design
    const colorPalette = {
        primary: "#4f46e5",
        secondary: "#10b981",
        accent: "#f97316", 
        danger: "#ef4444",
        neutral: "#6b7280",
        chartColors: ["#4f46e5", "#10b981", "#f97316", "#ef4444", "#3b82f6", "#ec4899"]
    };

    // Get color for status badges
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'verified':
            case 'active':
                return colorPalette.secondary; // Green
            case 'confirmed':
            case 'pending':
                return colorPalette.primary; // Blue
            case 'cancelled':
            case 'rejected':
            case 'inactive':
                return colorPalette.danger; // Red
            default:
                return colorPalette.neutral; // Gray
        }
    };

    // Fetch all data types
    const fetchData = useCallback(async () => {
        setRefreshing(true);
        try {
            // Fetch users data
            const usersResponse = await axios.get("http://localhost:4000/api/auth/admin/users", {
                withCredentials: true
            });
            
            if (usersResponse.data && usersResponse.data.success) {
                setUsers(usersResponse.data.users);
            }
            
            // Fetch consultations data
            const consultationsResponse = await axios.get("http://localhost:4000/api/contact/all", {
                withCredentials: true
            });
            
            if (consultationsResponse.data && consultationsResponse.data.success) {
                setConsultations(consultationsResponse.data.consultations);
            }
            
            // Fetch jobs data
            const jobsResponse = await axios.get("http://localhost:4000/api/jobs/available", {
                withCredentials: true
            });
            
            if (jobsResponse.data && jobsResponse.data.success) {
                setJobs(jobsResponse.data.jobs);
            }
            
            setLoading(false);
            setLastUpdated(new Date());
        } catch (err) {
            console.error("Error fetching statistics data:", err);
            setError(`Failed to load statistics: ${err.response?.data?.message || err.message}`);
            setLoading(false);
        } finally {
            setRefreshing(false);
        }
    }, []);

    // Set up listeners for data updates
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/auth/admin/users", {
                    withCredentials: true
                });
                if (response.data?.success) {
                    setUsers(response.data.users);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.error("Error updating user stats:", err);
            }
        };
        
        const fetchConsultationData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/contact/all", {
                    withCredentials: true
                });
                if (response.data?.success) {
                    setConsultations(response.data.consultations);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.error("Error updating consultation stats:", err);
            }
        };
        
        const fetchJobsData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs/available", {
                    withCredentials: true
                });
                if (response.data?.success) {
                    setJobs(response.data.jobs);
                    setLastUpdated(new Date());
                }
            } catch (err) {
                console.error("Error updating job stats:", err);
            }
        };
        
        // Register update listeners
        updateListeners.users = [fetchUserData];
        updateListeners.consultations = [fetchConsultationData];
        updateListeners.jobs = [fetchJobsData];
        
        // Initial data fetch
        fetchData();
        
        // Clean up listeners when component unmounts
        return () => {
            updateListeners.users = [];
            updateListeners.consultations = [];
            updateListeners.jobs = [];
        };
    }, [fetchData]);

    // Filter data based on the selected timeframe
    const filterDataByTimeframe = (data) => {
        if (!data || !data.length) return [];
        
        const now = new Date();
        let cutoffDate;
        
        switch(timeframe) {
            case '24h':
                cutoffDate = new Date(now.setHours(now.getHours() - 24));
                break;
            case '7d':
                cutoffDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case '30d':
                cutoffDate = new Date(now.setDate(now.getDate() - 30));
                break;
            case '90d':
                cutoffDate = new Date(now.setDate(now.getDate() - 90));
                break;
            case 'all':
            default:
                return data;
        }
        
        return data.filter(item => new Date(item.createdAt) >= cutoffDate);
    };

    // Format date for display
    const formatDate = (date) => {
        if (!date) return '';
        
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit'
        };
        return new Date(date).toLocaleDateString(undefined, options);
    };

    // Prepare data for the User Status Chart
    const prepareUserStatusData = () => {
        if (!users.length) return [];
        
        const verifiedUsers = users.filter(user => user.idVerification && user.idVerification.status === 'verified').length;
        const pendingUsers = users.filter(user => user.idVerification && user.idVerification.status === 'pending').length;
        const rejectedUsers = users.filter(user => user.idVerification && user.idVerification.status === 'rejected').length;
        const noVerification = users.filter(user => !user.idVerification).length;
        
        return [
            { name: 'Verified', value: verifiedUsers, color: colorPalette.secondary },
            { name: 'Pending', value: pendingUsers, color: colorPalette.primary },
            { name: 'Rejected', value: rejectedUsers, color: colorPalette.danger },
            { name: 'No Verification', value: noVerification, color: colorPalette.neutral }
        ];
    };

    // Prepare data for the Consultation Status Chart
    const prepareConsultationStatusData = () => {
        if (!consultations.length) return [];
        
        const pendingConsultations = consultations.filter(item => item.status === 'pending').length;
        const confirmedConsultations = consultations.filter(item => item.status === 'confirmed').length;
        const completedConsultations = consultations.filter(item => item.status === 'completed').length;
        const cancelledConsultations = consultations.filter(item => item.status === 'cancelled').length;
        
        return [
            { name: 'Pending', value: pendingConsultations, color: colorPalette.accent },
            { name: 'Confirmed', value: confirmedConsultations, color: colorPalette.primary },
            { name: 'Completed', value: completedConsultations, color: colorPalette.secondary },
            { name: 'Cancelled', value: cancelledConsultations, color: colorPalette.danger }
        ];
    };

    // Update the prepareJobStatusData function to be more comprehensive
    const prepareJobStatusData = () => {
        if (!jobs.length) return [];
        
        // Get all unique status values that exist in the jobs data
        const statuses = [...new Set(jobs.map(job => job.status))];
        
        // Count jobs for each status
        const jobsByStatus = statuses.map(status => {
            const count = jobs.filter(job => job.status === status).length;
            
            // Define colors for known statuses, use neutral for others
            let color;
            switch(status) {
                case 'active':
                    color = colorPalette.secondary;
                    break;
                case 'pending':
                    color = colorPalette.primary;
                    break;
                case 'closed':
                    color = colorPalette.neutral;
                    break;
                case 'cancelled':
                case 'rejected':
                    color = colorPalette.danger;
                    break;
                default:
                    color = colorPalette.accent;
            }
            
            return {
                name: status.charAt(0).toUpperCase() + status.slice(1), // Capitalize first letter
                value: count,
                color: color
            };
        });
        
        return jobsByStatus;
    };

    // Prepare weekly registration data
    const prepareWeeklyRegistrationsData = () => {
        if (!users.length) return [];
        
        // Get dates for the last 7 days
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            dates.push(date);
        }
        
        // Count registrations for each day
        const registrationsByDate = dates.map(date => {
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const count = users.filter(user => {
                const creationDate = new Date(user.createdAt);
                return creationDate >= date && creationDate < nextDay;
            }).length;
            
            return {
                name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                Users: count
            };
        });
        
        return registrationsByDate;
    };

    // Prepare monthly consultation growth data
    const prepareConsultationTrendData = () => {
        if (!consultations.length) return [];
        
        // Get data for the last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            date.setDate(1);
            date.setHours(0, 0, 0, 0);
            months.push(date);
        }
        
        // Count consultations for each month
        const consultationsByMonth = months.map(startDate => {
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
            
            const count = consultations.filter(consultation => {
                const creationDate = new Date(consultation.createdAt);
                return creationDate >= startDate && creationDate < endDate;
            }).length;
            
            const completedCount = consultations.filter(consultation => {
                const creationDate = new Date(consultation.createdAt);
                return creationDate >= startDate && creationDate < endDate && consultation.status === 'completed';
            }).length;
            
            return {
                name: startDate.toLocaleDateString('en-US', { month: 'short' }),
                'All Consultations': count,
                'Completed': completedCount
            };
        });
        
        return consultationsByMonth;
    };

    // Calculate growth rates
    const calculateGrowthRate = (currentValue, previousValue) => {
        if (!previousValue) return 100; // First data point, assume 100% growth
        const growth = ((currentValue - previousValue) / previousValue) * 100;
        return isFinite(growth) ? growth : 0;
    };

    // Handle refresh button click
    const handleRefresh = () => {
        fetchData();
    };

    // Loading state with skeleton UI
    if (loading) {
        return (
            <div className="admin-dashboard">
                <Sidebar />
                <div className="main-content">
                    <div className="dashboard-container">
                        <div className="dashboard-header">
                            <h1>Statistics Dashboard</h1>
                        </div>
                        <div className="stats-overview">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="stat-card skeleton-loading">
                                    <div className="skeleton-line" style={{width: '60%'}}></div>
                                    <div className="skeleton-line" style={{width: '40%', height: '30px'}}></div>
                                    <div className="skeleton-line" style={{width: '70%'}}></div>
                                </div>
                            ))}
                        </div>
                        <div className="charts-grid">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="chart-card skeleton-loading">
                                    <div className="skeleton-line" style={{width: '50%'}}></div>
                                    <div className="skeleton-chart"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-dashboard">
                <Sidebar />
                <div className="main-content">
                    <div className="error-container">
                        <FaTimesCircle size={50} />
                        <h2>Error Loading Data</h2>
                        <p>{error}</p>
                        <button className="retry-button" onClick={fetchData}>
                            <FaSync /> Try Again
                        </button>
                    </div>
                </div>
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
    const pendingConsultations = consultations.filter(c => c.status === 'pending').length;
    const confirmedConsultations = consultations.filter(c => c.status === 'confirmed').length;
    const completionRate = totalConsultations ? Math.round((completedConsultations / totalConsultations) * 100) : 0;

    // Calculate job statistics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const closedJobs = jobs.filter(job => job.status === 'closed').length;
    
    // Calculate the average fixed budget amount for jobs
    const avgBudget = jobs.length ? 
        Math.round(jobs.reduce((sum, job) => sum + (job.fixedAmount || 0), 0) / jobs.length) : 0;

    // Prepare chart data
    const userRegistrationData = prepareWeeklyRegistrationsData();
    const userStatusData = prepareUserStatusData();
    const consultationStatusData = prepareConsultationStatusData();
    const jobStatusData = prepareJobStatusData();
    const consultationTrendData = prepareConsultationTrendData();

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{`${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ color: entry.color || entry.fill }}>
                            {`${entry.name}: ${entry.value}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="main-content">
                <div className="dashboard-container">
                    <div className="dashboard-header">
                        <h1>Statistics Dashboard</h1>
                        <div className="dashboard-actions">
                            <div className="last-updated">
                                Last updated: {formatDate(lastUpdated)}
                                <button 
                                    className={`refresh-button ${refreshing ? 'refreshing' : ''}`}
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                >
                                    <FaSync /> {refreshing ? 'Refreshing...' : 'Refresh'}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Dashboard Tabs */}
                    <div className="dashboard-tabs">
                        <button 
                            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            Overview
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            User Analytics
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'consultations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('consultations')}
                        >
                            Consultations
                        </button>
                        <button 
                            className={`tab-button ${activeTab === 'jobs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('jobs')}
                        >
                            Job Statistics
                        </button>
                    </div>
                    
                    {/* Timeframe Filter */}
                    <div className="filter-controls">
                        <label htmlFor="timeframe">Data Timeframe:</label>
                        <select 
                            id="timeframe" 
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    
                    {/* Overview Tab Content */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats Overview Cards */}
                            <div className="stats-overview">
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <h3 className="stat-title">Total Users</h3>
                                        <div className="stat-icon bg-blue"><FaUsers /></div>
                                    </div>
                                    <p className="stat-value">{totalUsers}</p>
                                    <p className={`stat-change ${userGrowth >= 0 ? 'positive' : 'negative'}`}>
                                        {userGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />} {Math.abs(userGrowth).toFixed(1)}% {timeframe === 'all' ? 'growth' : `in last ${timeframe}`}
                                    </p>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <h3 className="stat-title">User Verification</h3>
                                        <div className="stat-icon bg-green"><FaCheckCircle /></div>
                                    </div>
                                    <p className="stat-value">{verificationRate}%</p>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress" 
                                            style={{width: `${verificationRate}%`, backgroundColor: getStatusColor('verified')}}
                                        ></div>
                                    </div>
                                    <p className="stat-note">
                                        <FaInfoCircle /> {pendingVerifications} pending verification{pendingVerifications !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <h3 className="stat-title">Consultations</h3>
                                        <div className="stat-icon bg-purple"><FaCalendarCheck /></div>
                                    </div>
                                    <p className="stat-value">{totalConsultations}</p>
                                    <div className="progress-bar">
                                        <div 
                                            className="progress" 
                                            style={{width: `${completionRate}%`, backgroundColor: getStatusColor('completed')}}
                                        ></div>
                                    </div>
                                    <p className="stat-note">
                                        <FaThumbsUp /> {completionRate}% completion rate
                                    </p>
                                </div>
                                
                                <div className="stat-card">
                                    <div className="stat-header">
                                        <h3 className="stat-title">Job Listings</h3>
                                        <div className="stat-icon bg-orange"><FaBriefcase /></div>
                                    </div>
                                    <p className="stat-value">{totalJobs}</p>
                                    <p className="stat-note">
                                        <span className="badge active">{activeJobs} Active</span>
                                        <span className="badge closed">{closedJobs} Closed</span>
                                    </p>
                                    <p className="stat-note">
                                        <FaInfoCircle /> Avg. Budget: ${avgBudget}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Main Charts */}
                            <div className="charts-grid">
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">User Registrations (Last 7 Days)</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={userRegistrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={colorPalette.primary} stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor={colorPalette.primary} stopOpacity={0.1}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="Users" stroke={colorPalette.primary} fillOpacity={1} fill="url(#colorUsers)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Consultation Trends (6 Months)</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={consultationTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                <Bar dataKey="All Consultations" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Completed" fill={colorPalette.secondary} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Secondary Charts Row */}
                            <div className="charts-grid three-columns">
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">User Verification Status</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie
                                                    data={userStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => 
                                                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                                    }
                                                >
                                                    {userStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Consultation Status</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie
                                                    data={consultationStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => 
                                                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                                    }
                                                >
                                                    {consultationStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                <div className="chart-card">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Job Status</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie
                                                    data={jobStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => 
                                                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                                    }
                                                >
                                                    {jobStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {/* User Analytics Tab Content */}
                    {activeTab === 'users' && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>User Analytics</h2>
                                <p className="section-description">
                                    Detailed insights about user registration, verification status, and growth trends.
                                </p>
                            </div>
                            
                            <div className="stats-summary-cards">
                                <div className="summary-card">
                                    <div className="summary-icon"><FaUsers /></div>
                                    <div className="summary-details">
                                        <h3>{totalUsers}</h3>
                                        <p>Total Users</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-icon"><FaCheckCircle /></div>
                                    <div className="summary-details">
                                        <h3>{verifiedUsers}</h3>
                                        <p>Verified Users</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-icon"><FaRegClock /></div>
                                    <div className="summary-details">
                                        <h3>{pendingVerifications}</h3>
                                        <p>Pending Verifications</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="detailed-stats">
                                <div className="stat-type-card">
                                    <h3>User Profile Statistics</h3>
                                    <ul className="stat-list">
                                        <li className="stat-item">
                                            <span className="stat-label">Verification Rate</span>
                                            <span className="stat-value">{verificationRate}%</span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">Rejected Verifications</span>
                                            <span className="stat-value">
                                                {users.filter(user => user.idVerification?.status === 'rejected').length}
                                            </span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">New Users (7 days)</span>
                                            <span className="stat-value">
                                                {users.filter(user => 
                                                    new Date(user.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                                ).length}
                                            </span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">New Users (30 days)</span>
                                            <span className="stat-value">
                                                {users.filter(user => 
                                                    new Date(user.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                                                ).length}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="chart-card full-width">
                                    <div className="chart-header">
                                        <h3 className="chart-title">User Growth Trend</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <AreaChart data={userRegistrationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorUsersGrowth" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={colorPalette.primary} stopOpacity={0.8}/>
                                                        <stop offset="95%" stopColor={colorPalette.primary} stopOpacity={0.1}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area type="monotone" dataKey="Users" stroke={colorPalette.primary} fillOpacity={1} fill="url(#colorUsersGrowth)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                <div className="chart-card full-width">
                                    <div className="chart-header">
                                        <h3 className="chart-title">User Verification Status Distribution</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={userStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {userStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Consultations Tab Content */}
                    {activeTab === 'consultations' && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>Consultation Analytics</h2>
                                <p className="section-description">
                                    Detailed metrics about consultation requests, status breakdowns, and completion rates.
                                </p>
                            </div>
                            
                            <div className="stats-summary-cards">
                                <div className="summary-card">
                                    <div className="summary-icon"><FaCalendarCheck /></div>
                                    <div className="summary-details">
                                        <h3>{totalConsultations}</h3>
                                        <p>Total Consultations</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-icon" style={{color: colorPalette.secondary}}><FaCheckCircle /></div>
                                    <div className="summary-details">
                                        <h3>{completedConsultations}</h3>
                                        <p>Completed</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-icon" style={{color: colorPalette.primary}}><FaRegClock /></div>
                                    <div className="summary-details">
                                        <h3>{pendingConsultations}</h3>
                                        <p>Pending</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="detailed-stats">
                                <div className="stat-type-card">
                                    <h3>Consultation Statistics</h3>
                                    <ul className="stat-list">
                                        <li className="stat-item">
                                            <span className="stat-label">Completion Rate</span>
                                            <span className="stat-value">{completionRate}%</span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">Confirmed Sessions</span>
                                            <span className="stat-value">{confirmedConsultations}</span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">Cancelled Sessions</span>
                                            <span className="stat-value">
                                                {consultations.filter(c => c.status === 'cancelled').length}
                                            </span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">New Consultations (7 days)</span>
                                            <span className="stat-value">
                                                {consultations.filter(c => 
                                                    new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                                ).length}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="chart-card full-width">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Monthly Consultation Trends</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={consultationTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                                <Bar dataKey="All Consultations" fill={colorPalette.primary} radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="Completed" fill={colorPalette.secondary} radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                <div className="chart-card full-width">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Consultation Status Distribution</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={consultationStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {consultationStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Jobs Tab Content */}
                    {activeTab === 'jobs' && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>Job Statistics</h2>
                                <p className="section-description">
                                    Detailed metrics about job postings, status distribution, and budget information.
                                </p>
                            </div>
                            
                            <div className="stats-summary-cards">
                                <div className="summary-card">
                                    <div className="summary-icon"><FaBriefcase /></div>
                                    <div className="summary-details">
                                        <h3>{totalJobs}</h3>
                                        <p>Total Jobs</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-icon" style={{color: colorPalette.secondary}}><FaCheckCircle /></div>
                                    <div className="summary-details">
                                        <h3>{activeJobs}</h3>
                                        <p>Active Jobs</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <div className="summary-icon" style={{color: colorPalette.neutral}}><FaRegClock /></div>
                                    <div className="summary-details">
                                        <h3>${avgBudget}</h3>
                                        <p>Avg. Budget</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="detailed-stats">
                                <div className="stat-type-card">
                                    <h3>Job Posting Statistics</h3>
                                    <ul className="stat-list">
                                        <li className="stat-item">
                                            <span className="stat-label">Active Jobs</span>
                                            <span className="stat-value">{activeJobs}</span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">Closed Jobs</span>
                                            <span className="stat-value">{closedJobs}</span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">Avg. Fixed Budget</span>
                                            <span className="stat-value">${avgBudget}</span>
                                        </li>
                                        <li className="stat-item">
                                            <span className="stat-label">New Jobs (7 days)</span>
                                            <span className="stat-value">
                                                {jobs.filter(job => 
                                                    new Date(job.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                                ).length}
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="chart-card full-width">
                                    <div className="chart-header">
                                        <h3 className="chart-title">Job Status Distribution</h3>
                                    </div>
                                    <div className="chart-container">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={jobStatusData}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                >
                                                    {jobStatusData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Statistics;
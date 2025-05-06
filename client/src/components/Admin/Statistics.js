import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./Sidebar";
import "./Statistics.css";
import axios from "axios";
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
    FaUsers, FaChartLine, FaCalendarCheck, FaBriefcase, 
    FaRegClock, FaSync, FaCheckCircle, FaTimesCircle
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

    // Get color for status badges
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
            case 'verified':
            case 'active':
                return "#10b981"; // Green
            case 'confirmed':
            case 'pending':
                return "#3b82f6"; // Blue
            case 'cancelled':
            case 'rejected':
            case 'inactive':
                return "#ef4444"; // Red
            default:
                return "#6b7280"; // Gray
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
                if (response.data?.success) setUsers(response.data.users);
            } catch (err) {
                console.error("Error updating user stats:", err);
            }
        };
        
        const fetchConsultationData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/contact/all", {
                    withCredentials: true
                });
                if (response.data?.success) setConsultations(response.data.consultations);
            } catch (err) {
                console.error("Error updating consultation stats:", err);
            }
        };
        
        const fetchJobsData = async () => {
            try {
                const response = await axios.get("http://localhost:4000/api/jobs/available", {
                    withCredentials: true
                });
                if (response.data?.success) setJobs(response.data.jobs);
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
            { name: 'Verified', value: verifiedUsers, color: '#10b981' },
            { name: 'Pending', value: pendingUsers, color: '#3b82f6' },
            { name: 'Rejected', value: rejectedUsers, color: '#ef4444' },
            { name: 'No Verification', value: noVerification, color: '#6b7280' }
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
            { name: 'Pending', value: pendingConsultations, color: '#f59e0b' },
            { name: 'Confirmed', value: confirmedConsultations, color: '#3b82f6' },
            { name: 'Completed', value: completedConsultations, color: '#10b981' },
            { name: 'Cancelled', value: cancelledConsultations, color: '#ef4444' }
        ];
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

    // Handle refresh button click
    const handleRefresh = () => {
        fetchData();
    };

    // Calculate statistics for the dashboard
    const totalUsers = users.length;
    const totalConsultations = consultations.length;
    const totalJobs = jobs.length;
    const verifiedUsers = users.filter(user => user.idVerification && user.idVerification.status === 'verified').length;
    const pendingVerifications = users.filter(user => user.idVerification && user.idVerification.status === 'pending').length;
    const verificationRate = totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

    // Calculate consultation statistics
    const completedConsultations = consultations.filter(c => c.status === 'completed').length;
    const pendingConsultations = consultations.filter(c => c.status === 'pending').length;
    const confirmedConsultations = consultations.filter(c => c.status === 'confirmed').length;
    const completionRate = totalConsultations ? Math.round((completedConsultations / totalConsultations) * 100) : 0;

    // Prepare user growth chart data
    const userRegistrationData = prepareWeeklyRegistrationsData();

    // Prepare user status and consultation status data for pie charts
    const userStatusData = prepareUserStatusData();
    const consultationStatusData = prepareConsultationStatusData();

    if (loading) return <div className="loading">Loading statistics data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <div className="main-content">
                <div className="dashboard-container">
                    <div className="dashboard-header">
                        <h1>Statistics Dashboard</h1>
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
                    
                    {/* Timeframe Filter */}
                    <div className="filter-controls">
                        <label htmlFor="timeframe">Timeframe:</label>
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
                    
                    {/* Stats Overview Cards */}
                    <div className="stats-overview">
                        <div className="stat-card">
                            <div className="stat-header">
                                <h3 className="stat-title">Total Users</h3>
                                <div className="stat-icon bg-blue"><FaUsers /></div>
                            </div>
                            <p className="stat-value">{totalUsers}</p>
                            <p className="stat-change positive">
                                <FaChartLine /> Active growth
                            </p>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <h3 className="stat-title">User Verification Rate</h3>
                                <div className="stat-icon bg-green"><FaCheckCircle /></div>
                            </div>
                            <p className="stat-value">{verificationRate}%</p>
                            <p className="stat-change">
                                {pendingVerifications} pending verifications
                            </p>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <h3 className="stat-title">Total Consultations</h3>
                                <div className="stat-icon bg-purple"><FaCalendarCheck /></div>
                            </div>
                            <p className="stat-value">{totalConsultations}</p>
                            <p className="stat-change">
                                {completionRate}% completion rate
                            </p>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-header">
                                <h3 className="stat-title">Active Jobs</h3>
                                <div className="stat-icon bg-orange"><FaBriefcase /></div>
                            </div>
                            <p className="stat-value">{totalJobs}</p>
                            <p className="stat-change">
                                <FaRegClock /> Job metrics
                            </p>
                        </div>
                    </div>
                    
                    {/* Charts Grid */}
                    <div className="charts-grid">
                        {/* User Registration Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">User Registrations (Last 7 Days)</h3>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={userRegistrationData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Users" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* User Verification Status Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">User Verification Status</h3>
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
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        {/* Consultation Status Chart */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3 className="chart-title">Consultation Status</h3>
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
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    
                    {/* Detailed Statistics */}
                    <div className="detailed-stats">
                        <div className="stat-type-card">
                            <h3>User Statistics</h3>
                            <ul className="stat-list">
                                <li className="stat-item">
                                    <span className="stat-label">Total Users</span>
                                    <span className="stat-value">{totalUsers}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Verified Users</span>
                                    <span className="stat-value">{verifiedUsers}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Pending Verifications</span>
                                    <span className="stat-value">{pendingVerifications}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Verification Rate</span>
                                    <span className="stat-value">{verificationRate}%</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="stat-type-card">
                            <h3>Consultation Statistics</h3>
                            <ul className="stat-list">
                                <li className="stat-item">
                                    <span className="stat-label">Total Consultations</span>
                                    <span className="stat-value">{totalConsultations}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Pending</span>
                                    <span className="stat-value">{pendingConsultations}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Confirmed</span>
                                    <span className="stat-value">{confirmedConsultations}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Completed</span>
                                    <span className="stat-value">{completedConsultations}</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="stat-type-card">
                            <h3>Job Statistics</h3>
                            <ul className="stat-list">
                                <li className="stat-item">
                                    <span className="stat-label">Active Jobs</span>
                                    <span className="stat-value">{jobs.filter(job => job.status === 'active').length}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Closed Jobs</span>
                                    <span className="stat-value">{jobs.filter(job => job.status === 'closed').length}</span>
                                </li>
                                <li className="stat-item">
                                    <span className="stat-label">Avg. Budget</span>
                                    <span className="stat-value">
                                        ${jobs.length ? 
                                            Math.round(jobs.reduce((sum, job) => sum + (job.fixedAmount || 0), 0) / jobs.length) 
                                            : 0}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;
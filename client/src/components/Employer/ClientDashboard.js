// ClientDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaList, FaClock, FaSpinner, FaCheckCircle, FaPauseCircle } from "react-icons/fa";
import './ClientDashboard.css';

// Map each stat key to an icon component
const iconsMap = {
  total: FaList,
  available: FaClock,
  inProgress: FaSpinner,
  completed: FaCheckCircle,
  onHold: FaPauseCircle,
};

const labelsMap = {
  total: 'Total Jobs Posted',
  available: 'Available Jobs',
  inProgress: 'In Progress',
  completed: 'Completed',
  onHold: 'On Hold',
};

const ClientDashboard = () => {
  const [jobStats, setJobStats] = useState({
    total: 0,
    available: 0,
    inProgress: 0,
    completed: 0,
    onHold: 0,
  });

  useEffect(() => {
    const fetchJobStats = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/jobs", { withCredentials: true });
        if (response.data.success && Array.isArray(response.data.jobs)) {
          const jobs = response.data.jobs;
          const stats = {
            total: jobs.length,
            available: jobs.filter(job => job.status === "Available").length,
            inProgress: jobs.filter(job => job.status === "In Progress").length,
            completed: jobs.filter(job => job.status === "Completed").length,
            onHold: jobs.filter(job => job.status === "On Hold").length,
          };
          setJobStats(stats);
        }
      } catch (error) {
        console.error("Error fetching job statistics:", error);
      }
    };

    fetchJobStats();
  }, []);

  return (
    <div className="client-dashboard">
      <h1>Welcome to the Client Dashboard</h1>
      <p>Here you can view your job statistics at a glance.</p>

      <div className="dashboard-stats">
        {Object.entries(jobStats).map(([key, value]) => {
          const Icon = iconsMap[key];
          return (
            <div key={key} className="stat-card">
              <Icon className="stat-icon" />
              <div className="stat-text">
                <h3>{labelsMap[key]}</h3>
                <p>{value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientDashboard;
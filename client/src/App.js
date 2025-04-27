import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/Admin/AdminDashboard";
import Dashboard from "./components/Admin/Dashboard";
import Users from "./components/Admin/Users";
import Messages from "./components/Admin/Messages";
import Applications from "./components/Admin/Applications";
import Statistics from "./components/Admin/Statistics";
import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployerDashboard from "./components/EmployerDashboard";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import EmployeeProfile from "./components/EmployeeProfile";
import FindJobs from "./components/FindJobs";
import VerifyAccount from './components/VerifyAccount';
import MyProfile from './components/MyProfile';
import JobDetails from "./components/Admin/JobDetails"; // <-- Add this line

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/admin-dashboard/dashboard" element={<Dashboard />} />
                <Route path="/admin-dashboard/users" element={<Users />} />
                <Route path="/admin-dashboard/messages" element={<Messages />} />
                <Route path="/admin-dashboard/applications" element={<Applications />} />
                <Route path="/admin-dashboard/statistics" element={<Statistics />} />
                <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/employee-profile" element={<EmployeeProfile />} />
                <Route path="/find-jobs" element={<FindJobs />} />
                <Route path="/find-jobs/saved" element={<FindJobs />} />
                <Route path="/find-jobs/proposals" element={<FindJobs />} />
                <Route path="/find-jobs/details/:jobId" element={<FindJobs />} />
                <Route path="/verify-account" element={<VerifyAccount />} />
                <Route path="/my-profile" element={<MyProfile />} />
                <Route path="/admin-dashboard/job-details" element={<JobDetails />} /> {/* Add this line */}
            </Routes>
        </Router>
    );
};

export default App;

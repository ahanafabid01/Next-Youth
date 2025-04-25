import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage"; // Import Homepage
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployerDashboard from "./components/EmployerDashboard";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import EmployeeProfile from "./components/EmployeeProfile"; // Updated import
import FindJobs from "./components/FindJobs"; // Import FindJobs component
import VerifyAccount from './components/VerifyAccount'; // Add this import
import MyProfile from './components/MyProfile'; // Import MyProfile

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} /> {/* Set Homepage as default */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/employee-profile" element={<EmployeeProfile />} /> {/* Route for Employee Profile */}
                <Route path="/find-jobs" element={<FindJobs />} /> {/* Route for FindJobs */}
                <Route path="/find-jobs/saved" element={<FindJobs />} /> {/* Route for FindJobs saved */}
                <Route path="/find-jobs/proposals" element={<FindJobs />} /> {/* Route for FindJobs proposals */}
                <Route path="/find-jobs/details/:jobId" element={<FindJobs />} /> {/* Route for FindJobs details */}
                <Route path="/verify-account" element={<VerifyAccount />} /> {/* Add this route */}
                <Route path="/my-profile" element={<MyProfile />} /> {/* Route for MyProfile */}
            </Routes>
        </Router>
    );
};

export default App;

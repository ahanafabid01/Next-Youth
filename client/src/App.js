import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/Admin/AdminDashboard";

import Users from "./components/Admin/Users";
import Applications from "./components/Admin/Applications";
import Statistics from "./components/Admin/Statistics";
import JobDetails from "./components/Admin/JobDetails"; // Add this import
import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployerDashboard from "./components/EmployerDashboard";
import ForgotPassword from "./components/ForgotPassword";
import Profile from "./components/Profile";
import EmployeeProfile from "./components/EmployeeProfile"; // Updated import
import FindJobs from "./components/FindJobs"; // Import FindJobs component
import VerifyAccount from './components/VerifyAccount'; // Add this import
import MyProfile from './components/MyProfile'; // Import MyProfile
import Notifications from './components/Notifications'; // Import Notifications
import JobApplication from "./components/JobApplication"; // Add this import
import BusinessSolutions from "./BusinessSolutions"; // Import BusinessSolutions
import ScheduleConsultation from "./contact"; // Import ScheduleConsultation
import RequestDemo from "./RequestDemo"; // Import RequestDemo component
import Consultations from "./components/Admin/Consultations"; // Add this import
import "./App.css"; // Import App.css

const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                
                <Route path="/admin-dashboard/users" element={<Users />} />
            
                <Route path="/admin-dashboard/applications" element={<Applications />} />
                <Route path="/admin-dashboard/statistics" element={<Statistics />} /> {/* Corrected spelling */}
                <Route path="/admin-dashboard/job-details" element={<JobDetails />} /> {/* Add this route */}
                <Route path="/admin-dashboard/consultations" element={<Consultations />} /> {/* Add this route */}
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
                <Route path="/notifications" element={<Notifications />} /> {/* Route for Notifications */}
                <Route path="/jobs/apply/:jobId" element={<JobApplication />} /> {/* Add this route */}
                <Route path="/business-solutions" element={<BusinessSolutions />} /> {/* Route for BusinessSolutions */}
                <Route path="/contact" element={<ScheduleConsultation />} /> {/* Route for ScheduleConsultation */}
                <Route path="/request-demo" element={<RequestDemo />} /> {/* Route for RequestDemo */}
            </Routes>
        </Router>
    );
};

export default App;
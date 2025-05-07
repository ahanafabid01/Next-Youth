import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepages/Homepage";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import AdminDashboard from "./components/Admin/AdminDashboard";
import Dashboard from "./components/Admin/Dashboard";
import Users from "./components/Admin/Users";
import Messages from "./components/Admin/Messages";
import Applications from "./components/Admin/Applications";
import Statistics from "./components/Admin/Statistics";
import JobDetails from "./components/Admin/JobDetails";
import Consultations from "./components/Admin/Consultations";
import MailSystem from "./components/Admin/MailSystem";
import EmployeeDashboard from "./components/Employee/EmployeeDashboard";
import EmployerDashboard from "./components/Employer/EmployerDashboard";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Profile from "./components/Employer/Profile";
import EmployeeProfile from "./components/Employee/EmployeeProfile";
import FindJobs from "./components/Employee/FindJobs";
import VerifyAccount from './components/Employee/VerifyAccount';
import MyProfile from './components/Employee/MyProfile';
import Notifications from './components/Employee/Notifications';
import JobApplication from "./components/Employee/JobApplication";
import Settings from "./components/Employee/Settings";
import BusinessSolutions from "./Homepages/BusinessSolutions";
import ScheduleConsultation from "./Homepages/contact";
import ViewApplication from "./components/Employee/ViewApplication";
import ViewProfile from './components/Employer/ViewProfile';
import EmployerVerification from './components/Employer/EmployerVerification';
import EditApplication from './components/Employee/EditApplication';
import BecomeSeller from "./Homepages/BecomeSeller";
import HelpAndSupport from './Homepages/Help&Support';
import "./App.css";

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
                <Route path="/admin-dashboard/job-details" element={<JobDetails />} />
                <Route path="/admin-dashboard/consultations" element={<Consultations />} />
                
                <Route path="/admin-dashboard/mail-system" element={<MailSystem />} />
                <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
                <Route path="/employer-dashboard" element={<EmployerDashboard />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/employee-profile" element={<EmployeeProfile />} />
                <Route path="/find-jobs" element={<FindJobs />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/find-jobs/saved" element={<FindJobs />} />
                <Route path="/find-jobs/proposals" element={<FindJobs />} />
                <Route path="/find-jobs/details/:jobId" element={<FindJobs />} />
                <Route path="/verify-account" element={<VerifyAccount />} />
                <Route path="/employer-verification" element={<EmployerVerification />} />
                <Route path="/my-profile" element={<MyProfile />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/jobs/apply/:jobId" element={<JobApplication />} />
                <Route path="/business-solutions" element={<BusinessSolutions />} />
                <Route path="/contact" element={<ScheduleConsultation />} />
                <Route path="/view-application/:applicationId" element={<ViewApplication />} />
                <Route path="/view-profile/:userId" element={<ViewProfile />} />
                <Route path="/edit-application/:applicationId" element={<EditApplication />} />
                <Route path="/become-seller" element={<BecomeSeller />} />
                <Route path="/help-support" element={<HelpAndSupport />} />
            </Routes>
        </Router>
    );
};

export default App;
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage"; // Import Homepage
import Login from "./components/Login";
import Register from "./components/Register";
import AdminDashboard from "./components/AdminDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";
import EmployerDashboard from "./components/EmployerDashboard";
import ForgotPassword from "./components/ForgotPassword";

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
            </Routes>
        </Router>
    );
};

export default App;

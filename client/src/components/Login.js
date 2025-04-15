import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(
                "http://localhost:4000/api/auth/login",
                { email, password },
                { withCredentials: true }
            );

            if (response.data.success) {
                alert("Login successful!");
                const userType = response.data.user_type;
                if (userType === "admin") navigate("/admin-dashboard");
                else if (userType === "employee") navigate("/employee-dashboard");
                else if (userType === "employer") navigate("/employer-dashboard");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <h2 className="auth-title">Welcome Back</h2>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    {error && <p className="error">{error}</p>}
                    <button type="submit" className="btn">Login</button>
                </form>
                <p className="auth-link">
                    <Link to="/forgot-password">Forgot Password?</Link>
                </p>
                <p className="auth-link">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
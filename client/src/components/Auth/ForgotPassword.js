import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Auth.css";
import logoLight from "../../assets/images/logo-light.png";
import logoDark from "../../assets/images/logo-dark.png";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

    useEffect(() => {
        // Apply dark mode on initial load
        document.body.classList.toggle("dark-mode", isDarkMode);
        
        // Add auth-body-reset class to prevent auth styles affecting other pages
        document.body.classList.add("auth-body-reset");
        
        // Cleanup function when component unmounts
        return () => {
            // Remove dark-mode class when leaving auth pages
            document.body.classList.remove("dark-mode");
            document.body.classList.remove("auth-body-reset");
        };
    }, [isDarkMode]);

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post("http://localhost:4000/api/auth/reset-password", { email });
            alert(response.data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post("http://localhost:4000/api/auth/reset-password", {
                email,
                otp,
                newPassword,
            });

            if (response.data.success) {
                alert(response.data.message);
                setStep(1);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle("dark-mode", !isDarkMode);
        localStorage.setItem("theme", !isDarkMode ? "dark" : "light");
    };

    return (
        <div className={`auth-page ${isDarkMode ? "dark-mode" : ""}`}>
            <div className="auth-background">
                <div className="auth-background-pattern"></div>
            </div>
            
            <header className="auth-header">
                <Link to="/">
                    <img 
                        src={isDarkMode ? logoDark : logoLight} 
                        alt="Next Youth" 
                        className="logo" 
                    />
                </Link>
                <button className="theme-toggle" onClick={toggleDarkMode}>
                    <i className="fas fa-sun"></i>
                    <i className="fas fa-moon"></i>
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
            </header>
            <div className="auth-container">
                {step === 1 ? (
                    <>
                        <h2 className="auth-title">
                            <i className="fas fa-key"></i>
                            Forgot <span className="text-gradient">Password</span>
                        </h2>
                        <form onSubmit={handleRequestOtp} className="auth-form">
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-envelope"></i> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    required
                                />
                            </div>
                            {error && (
                                <div className="error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <button type="submit" className="btn">
                                Request OTP
                                <i className="fas fa-paper-plane"></i>
                            </button>
                        </form>
                        <div className="auth-links">
                            <p className="auth-link">
                                Remember your password?{" "}
                                <Link to="/login">
                                    <i className="fas fa-sign-in-alt"></i>
                                    Back to Login
                                </Link>
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="auth-title">
                            <i className="fas fa-lock-open"></i>
                            Reset <span className="text-gradient">Password</span>
                        </h2>
                        <p className="otp-instruction">
                            We've sent a verification code to <strong>{email}</strong>
                        </p>
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-shield-alt"></i> OTP Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter the OTP sent to your email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-lock"></i> New Password
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    required
                                />
                            </div>
                            {error && (
                                <div className="error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <button type="submit" className="btn">
                                Reset Password
                                <i className="fas fa-check-circle"></i>
                            </button>
                        </form>
                        <div className="auth-links">
                            <p className="auth-link">
                                Didn't receive the code?{" "}
                                <Link to="#" onClick={(e) => {
                                    e.preventDefault();
                                    alert("Resending code...");
                                    // Add resend OTP logic here
                                }}>
                                    <i className="fas fa-redo"></i>
                                    Resend Code
                                </Link>
                            </p>
                        </div>
                    </>
                )}
            </div>
            <footer className="auth-footer">
                <p>© 2025 Next Youth</p>
            </footer>
        </div>
    );
};

export default ForgotPassword;
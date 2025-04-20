import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Auth.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });

    // Apply dark mode on initial load
    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDarkMode);
    }, []);

    // Create background particles effect
    useEffect(() => {
        createParticles();
        // Cleanup function
        return () => {
            const container = document.querySelector('.background-animation');
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [isDarkMode]);

    const createParticles = () => {
        const container = document.querySelector('.background-animation') || document.createElement('div');
        
        if (!container.classList.contains('background-animation')) {
            container.className = 'background-animation';
            document.body.appendChild(container);
        }
        
        // Clear existing particles
        container.innerHTML = '';
        
        // Create new particles
        for (let i = 0; i < 40; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 80 + 20;
            const posX = Math.random() * window.innerWidth;
            const posY = Math.random() * window.innerHeight;
            const delay = Math.random() * 5;
            const duration = Math.random() * 10 + 10;
            const color = i % 2 === 0 ? 'var(--particles-color)' : 'var(--particles-color-alt)';
            
            // Apply styles
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}px`;
            particle.style.top = `${posY}px`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.backgroundColor = color;
            
            container.appendChild(particle);
        }
    };

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
            <header className="auth-header">
                <Link to="/">
                    <h1>Next <span className="text-gradient">Youth</span></h1>
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
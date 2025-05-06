import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import logo from "../../assets/images/logo.png";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("");
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });
    const navigate = useNavigate();

    // Apply dark mode on initial load
    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDarkMode);
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        if (!userType) {
            setError("Please select a user type");
            return;
        }

        try {
            const response = await axios.post("http://localhost:4000/api/auth/register", {
                name,
                email,
                password,
                user_type: userType,
            });
            if (response.data.success) {
                alert(response.data.message);
                setStep(2);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axios.post("http://localhost:4000/api/auth/verify-email", {
                email,
                otp: otp.join(""),
            });
            if (response.data.success) {
                alert(response.data.message);
                navigate("/login");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Verification failed");
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
        if (element.value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
        document.body.classList.toggle("dark-mode", !isDarkMode);
        localStorage.setItem("theme", !isDarkMode ? "dark" : "light");
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h2 className="auth-title">
                            <i className="fas fa-user-plus"></i>
                            Create <span className="text-gradient">Account</span>
                        </h2>
                        <form onSubmit={handleRegister} className="auth-form">
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-user"></i> Full Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-envelope"></i> Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-lock"></i> Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    <i className="fas fa-user-tag"></i> I am a
                                </label>
                                <div className="role-options">
                                    <div 
                                        className={`role-option ${userType === "employee" ? "active" : ""}`}
                                        onClick={() => setUserType("employee")}
                                    >
                                        <input 
                                            type="radio" 
                                            name="userType" 
                                            value="employee" 
                                            checked={userType === "employee"}
                                            onChange={() => setUserType("employee")}
                                        />
                                        <i className="fas fa-briefcase"></i>
                                        <span>Freelancer</span>
                                    </div>
                                    <div 
                                        className={`role-option ${userType === "employer" ? "active" : ""}`}
                                        onClick={() => setUserType("employer")}
                                    >
                                        <input 
                                            type="radio" 
                                            name="userType" 
                                            value="employer" 
                                            checked={userType === "employer"}
                                            onChange={() => setUserType("employer")}
                                        />
                                        <i className="fas fa-building"></i>
                                        <span>Employer</span>
                                    </div>
                                </div>
                            </div>
                            {error && (
                                <div className="error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <button type="submit" className="btn">
                                Create Account
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </form>
                        <div className="auth-links">
                            <p className="auth-link">
                                Already have an account?{" "}
                                <Link to="/login">
                                    <i className="fas fa-sign-in-alt"></i>
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h2 className="auth-title">
                            <i className="fas fa-shield-alt"></i>
                            Verify <span className="text-gradient">Email</span>
                        </h2>
                        <p className="otp-instruction">
                            We've sent a verification code to <strong>{email}</strong>
                        </p>
                        <form onSubmit={handleVerifyOtp} className="auth-form">
                            <div className="otp-container">
                                {otp.map((data, index) => {
                                    return (
                                        <input
                                            className="otp-input"
                                            type="text"
                                            maxLength="1"
                                            key={index}
                                            id={`otp-${index}`}
                                            value={data}
                                            onChange={e => handleOtpChange(e.target, index)}
                                            onFocus={e => e.target.select()}
                                        />
                                    );
                                })}
                            </div>
                            {error && (
                                <div className="error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <button type="submit" className="btn">
                                Verify Email
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
                );
            default:
                return null;
        }
    };

    return (
        <div className={`auth-page ${isDarkMode ? "dark-mode" : ""}`}>
            <div className="auth-background">
                <div className="auth-background-pattern"></div>
            </div>
            
            <header className="auth-header">
                <Link to="/">
                    <img src={logo} alt="Next Youth" className="logo" />
                </Link>
                <button className="theme-toggle" onClick={toggleDarkMode}>
                    <i className="fas fa-sun"></i>
                    <i className="fas fa-moon"></i>
                    {isDarkMode ? "Light Mode" : "Dark Mode"}
                </button>
            </header>
            <div className="auth-container">
                {renderStep()}
            </div>
            <footer className="auth-footer">
                <p>© 2025 Next Youth</p>
            </footer>
        </div>
    );
};

export default Register;
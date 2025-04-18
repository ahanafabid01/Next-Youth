import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState("");
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

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
            setError(err.response?.data?.message || "Something went wrong");
        }
    };

    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        if (element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                {step === 1 ? (
                    <>
                        <h2 className="auth-title">
                            <i className="fas fa-user-plus"></i>
                            Create Account
                        </h2>
                        <form onSubmit={handleRegister} className="auth-form">
                            <div className="form-group">
                                <label>Full Name</label>
                                <div className="input-icon">
                                    <i className="fas fa-user"></i>
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <div className="input-icon">
                                    <i className="fas fa-envelope"></i>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <div className="input-icon">
                                    <i className="fas fa-lock"></i>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Select Role</label>
                                <div className="role-options">
                                    <label className={`role-option ${userType === "employee" ? "active" : ""}`}>
                                        <input
                                            type="radio"
                                            value="employee"
                                            checked={userType === "employee"}
                                            onChange={(e) => setUserType(e.target.value)}
                                        />
                                        <i className="fas fa-briefcase"></i>
                                        <span>Freelancer</span>
                                    </label>
                                    <label className={`role-option ${userType === "employer" ? "active" : ""}`}>
                                        <input
                                            type="radio"
                                            value="employer"
                                            checked={userType === "employer"}
                                            onChange={(e) => setUserType(e.target.value)}
                                        />
                                        <i className="fas fa-code"></i>
                                        <span>Client</span>
                                    </label>
                                </div>
                            </div>
                            {error && (
                                <div className="error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <button type="submit" className="btn">
                                Continue
                                <i className="fas fa-arrow-right"></i>
                            </button>
                        </form>
                        <p className="auth-link">
                            Already registered? <Link to="/login">Sign In</Link>
                        </p>
                    </>
                ) : (
                    <>
                        <h2 className="auth-title">
                            <i className="fas fa-shield-check"></i>
                            Verify Email
                        </h2>
                        <form onSubmit={handleVerifyOtp} className="auth-form">
                            <p className="otp-instruction">
                                Enter the 6-digit code sent to {email}
                            </p>
                            <div className="otp-container">
                                {otp.map((data, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        maxLength="1"
                                        value={data}
                                        onChange={(e) => handleOtpChange(e.target, index)}
                                        className="otp-input"
                                        autoFocus={index === 0}
                                    />
                                ))}
                            </div>
                            {error && (
                                <div className="error">
                                    <i className="fas fa-exclamation-circle"></i>
                                    {error}
                                </div>
                            )}
                            <button type="submit" className="btn">
                                Verify Account
                                <i className="fas fa-check-circle"></i>
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default Register;
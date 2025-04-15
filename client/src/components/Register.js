import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; // Import Link
import "./Auth.css";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [userType, setUserType] = useState(""); // New state for user type
    const [otp, setOtp] = useState(new Array(6).fill(""));
    const [step, setStep] = useState(1); // Step 1: Register, Step 2: Verify OTP
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
                user_type: userType, // Include user type in the request
            });

            if (response.data.success) {
                alert(response.data.message);
                setStep(2); // Move to OTP verification step
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
                otp: otp.join(""), // Combine OTP digits into a single string
            });

            if (response.data.success) {
                alert(response.data.message);
                navigate("/"); // Redirect to login
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

        // Focus on the next input box
        if (element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    return (
        <div className="auth-container">
            {step === 1 ? (
                <>
                    <h2 className="auth-title">Create an Account</h2>
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                required
                            />
                        </div>
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
                                placeholder="Enter a strong password"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Role</label>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        value="employee"
                                        checked={userType === "employee"}
                                        onChange={(e) => setUserType(e.target.value)}
                                    />
                                    Are you looking for a job?
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        value="employer"
                                        checked={userType === "employer"}
                                        onChange={(e) => setUserType(e.target.value)}
                                    />
                                    Are you hiring people?
                                </label>
                            </div>
                        </div>
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn">Register</button>
                    </form>
                    <p className="auth-link">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </>
            ) : (
                <>
                    <h2 className="auth-title">Verify Your Email</h2>
                    <form onSubmit={handleVerifyOtp} className="auth-form">
                        <div className="otp-container">
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    value={data}
                                    onChange={(e) => handleOtpChange(e.target, index)}
                                    className="otp-input"
                                />
                            ))}
                        </div>
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="btn">Verify</button>
                    </form>
                </>
            )}
        </div>
    );
};

export default Register;
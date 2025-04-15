import React, { useState } from "react";
import axios from "axios";
import "./Auth.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");

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

    return (
        <div className="auth-page">
            <div className="auth-container">
                {step === 1 ? (
                    <>
                        <h2 className="auth-title">Forgot Password</h2>
                        <form onSubmit={handleRequestOtp} className="auth-form">
                            <div className="form-group">
                                <label>Email:</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your registered email"
                                    required
                                />
                            </div>
                            {error && <p className="error">{error}</p>}
                            <button type="submit" className="btn">Request OTP</button>
                        </form>
                    </>
                ) : (
                    <>
                        <h2 className="auth-title">Reset Password</h2>
                        <form onSubmit={handleResetPassword} className="auth-form">
                            <div className="form-group">
                                <label>OTP:</label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="Enter the OTP sent to your email"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password:</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter your new password"
                                    required
                                />
                            </div>
                            {error && <p className="error">{error}</p>}
                            <button type="submit" className="btn">Reset Password</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
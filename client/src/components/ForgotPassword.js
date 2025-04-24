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
                container.remove();
            }
            const mobileBackground = document.querySelector('.mobile-background');
            if (mobileBackground) {
                mobileBackground.remove();
            }
        };
    }, [isDarkMode]);

    // Add listener to check screen size on resize
    useEffect(() => {
        const handleResize = () => {
            createParticles();
        };
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            const container = document.querySelector('.background-animation');
            if (container) {
                container.remove();
            }
            const mobileBackground = document.querySelector('.mobile-background');
            if (mobileBackground) {
                mobileBackground.remove();
            }
        };
    }, [isDarkMode]);

    const createParticles = () => {
        // Check if we're on mobile or desktop
        const isMobile = window.innerWidth <= 768;
        
        // Clear existing background elements
        const existingAnimation = document.querySelector('.background-animation');
        if (existingAnimation) {
            existingAnimation.remove();
        }
        
        const existingMobileBackground = document.querySelector('.mobile-background');
        if (existingMobileBackground) {
            existingMobileBackground.remove();
        }
        
        if (isMobile) {
            // Create simple mobile background
            const mobileBackground = document.createElement('div');
            mobileBackground.className = 'mobile-background';
            document.body.appendChild(mobileBackground);
            return;
        }
        
        // Create interactive desktop background
        const container = document.createElement('div');
        container.className = 'background-animation';
        document.body.appendChild(container);
        
        // Create initial bubbles
        for (let i = 0; i < 20; i++) {
            createBubble();
        }
        
        // Add click handler to container to create bubbles on click
        container.addEventListener('click', (e) => {
            // Create a bubble at click position
            createBubbleAtPosition(e.clientX, e.clientY);
        });
        
        // Function to create a bubble
        function createBubble() {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            
            // Random properties
            const size = Math.random() * 100 + 40;
            const posX = Math.random() * window.innerWidth;
            const posY = Math.random() * window.innerHeight;
            const speedX = Math.random() * 1 - 0.5;
            const speedY = Math.random() * 1 - 0.5;
            
            // Store speed as data attributes
            bubble.dataset.speedX = speedX;
            bubble.dataset.speedY = speedY;
            bubble.dataset.initialSize = size;
            
            // Apply styles
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${posX}px`;
            bubble.style.top = `${posY}px`;
            
            // Add event handlers
            bubble.addEventListener('mouseenter', () => {
                bubble.style.transform = 'scale(1.1)';
                bubble.style.opacity = '0.6';
            });
            
            bubble.addEventListener('mouseleave', () => {
                bubble.style.transform = 'scale(1)';
                bubble.style.opacity = '0.4';
            });
            
            bubble.addEventListener('click', (e) => {
                e.stopPropagation();
                popBubble(bubble);
                // Create two smaller bubbles
                setTimeout(() => {
                    createBubbleAtPosition(parseFloat(bubble.style.left), parseFloat(bubble.style.top), size * 0.6);
                    createBubbleAtPosition(parseFloat(bubble.style.left) + 20, parseFloat(bubble.style.top) - 20, size * 0.5);
                }, 200);
            });
            
            container.appendChild(bubble);
        }
        
        // Create a bubble at specific position
        function createBubbleAtPosition(x, y, size = null) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            
            // Size properties
            const bubbleSize = size || Math.random() * 80 + 40;
            const speedX = Math.random() * 1 - 0.5;
            const speedY = Math.random() * 1 - 0.5;
            
            // Store speed as data attributes
            bubble.dataset.speedX = speedX;
            bubble.dataset.speedY = speedY;
            bubble.dataset.initialSize = bubbleSize;
            
            // Apply styles
            bubble.style.width = `${bubbleSize}px`;
            bubble.style.height = `${bubbleSize}px`;
            bubble.style.left = `${x - bubbleSize/2}px`;
            bubble.style.top = `${y - bubbleSize/2}px`;
            
            // Add event handlers
            bubble.addEventListener('mouseenter', () => {
                bubble.style.transform = 'scale(1.1)';
                bubble.style.opacity = '0.6';
            });
            
            bubble.addEventListener('mouseleave', () => {
                bubble.style.transform = 'scale(1)';
                bubble.style.opacity = '0.4';
            });
            
            bubble.addEventListener('click', (e) => {
                e.stopPropagation();
                popBubble(bubble);
                // Create two smaller bubbles
                setTimeout(() => {
                    if (bubbleSize > 30) {
                        createBubbleAtPosition(parseFloat(bubble.style.left), parseFloat(bubble.style.top), bubbleSize * 0.6);
                        createBubbleAtPosition(parseFloat(bubble.style.left) + 20, parseFloat(bubble.style.top) - 20, bubbleSize * 0.5);
                    }
                }, 200);
            });
            
            container.appendChild(bubble);
        }
        
        // Function to handle bubble popping
        function popBubble(bubble) {
            bubble.classList.add('pop');
            setTimeout(() => {
                bubble.remove();
            }, 500);
        }
        
        // Animate bubbles
        function animateBubbles() {
            const bubbles = document.querySelectorAll('.bubble');
            
            bubbles.forEach(bubble => {
                const rect = bubble.getBoundingClientRect();
                let speedX = parseFloat(bubble.dataset.speedX);
                let speedY = parseFloat(bubble.dataset.speedY);
                
                let left = rect.left + speedX;
                let top = rect.top + speedY;
                
                // Bounce off walls
                if (left <= 0 || left + rect.width >= window.innerWidth) {
                    bubble.dataset.speedX = -speedX;
                }
                
                if (top <= 0 || top + rect.height >= window.innerHeight) {
                    bubble.dataset.speedY = -speedY;
                }
                
                bubble.style.left = `${left}px`;
                bubble.style.top = `${top}px`;
            });
            
            requestAnimationFrame(animateBubbles);
        }
        
        // Start animation
        animateBubbles();
        
        // Periodically add new bubbles
        setInterval(() => {
            const bubbleCount = document.querySelectorAll('.bubble').length;
            if (bubbleCount < 30) {
                createBubble();
            }
        }, 3000);
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
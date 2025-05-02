import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import API_BASE_URL from '../../config';  // Add this import

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "dark";
    });
    const navigate = useNavigate();

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
        // Add listener to check screen size on resize
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
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                // Switch to mobile design
                container.remove();
                createParticles();
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email,
                password,
            }, { withCredentials: true });

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
                <h2 className="auth-title">
                    <i className="fas fa-hand-wave"></i>
                    Welcome <span className="text-gradient">Back!</span>
                </h2>
                <form onSubmit={handleSubmit} className="auth-form">
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
                    {error && (
                        <div className="error">
                            <i className="fas fa-exclamation-circle"></i>
                            {error}
                        </div>
                    )}
                    <button type="submit" className="btn">
                        Sign In
                        <i className="fas fa-arrow-right-to-bracket"></i>
                    </button>
                </form>
                <div className="auth-links">
                    <p className="auth-link">
                        <Link to="/forgot-password">
                            <i className="fas fa-key"></i>
                            Forgot Password?
                        </Link>
                    </p>
                    <p className="auth-link">
                        Don't have an account?{" "}
                        <Link to="/register">
                            <i className="fas fa-user-plus"></i>
                            Register Now
                        </Link>
                    </p>
                </div>
            </div>
            <footer className="auth-footer">
                <p>© 2025 Next Youth</p>
            </footer>
        </div>
    );
};

export default Login;
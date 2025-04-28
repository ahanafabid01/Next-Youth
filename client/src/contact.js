import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./BusinessSolutions.css"; // Reuse existing styles
import "./Homepage.css"; // Reuse homepage styles
import "./contact.css"; // New separated CSS
import axios from "axios"; // Add this import

const ScheduleConsultation = () => {
  const [searchParams] = useSearchParams();
  const contactType = searchParams.get('type') || 'general';
  
  // Initialize form with different service type based on which button was clicked
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    phone: "",
    businessSize: "",
    serviceType: contactType === "consultation" ? "enterprise" : "",
    preferredDate: "",
    preferredTime: "",
    message: "",
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  
  // Animation states
  const [isVisible, setIsVisible] = useState({});
  const sectionsRef = useRef([]);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  
  // Header mobile menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionsRef.current.forEach((section) => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  // Add sections to ref for animation
  const addToRefs = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  // Handle click outside menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        if (hamburgerRef.current && !hamburgerRef.current.contains(event.target)) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme mode effect
  useEffect(() => {
    document.body.classList.toggle("dark-mode", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    
    // Show toast when theme changes
    if (isDarkMode) {
      showToastNotification("Dark mode activated");
    } else {
      showToastNotification("Light mode activated");
    }
  }, [isDarkMode]);

  // Add staggered animation to nav items
  useEffect(() => {
    const navItems = document.querySelectorAll('.desktop-nav ul li, .mobile-menu ul li');
    
    navItems.forEach((item, index) => {
      item.style.animation = `navFadeIn 0.4s forwards ${index * 0.1}s`;
    });
  }, [isMenuOpen]);

  // Toast notification handler
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Menu toggle functions
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleMenuClick = () => {
    setTimeout(() => setIsMenuOpen(false), 150);
  };
  
  // Fix for body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!formData.company.trim()) {
      newErrors.company = "Company name is required";
    }
    
    if (!formData.businessSize) {
      newErrors.businessSize = "Please select your business size";
    }
    
    if (!formData.serviceType) {
      newErrors.serviceType = "Please select a service type";
    }
    
    if (!formData.preferredDate) {
      newErrors.preferredDate = "Please select a preferred date";
    }
    
    if (!formData.preferredTime) {
      newErrors.preferredTime = "Please select a preferred time";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setSubmitted(true);
        
        // Updated with the correct server URL
        const response = await axios.post(
          "http://localhost:4000/api/contact/create", 
          formData
        );
        
        console.log("Server response:", response.data);
        showToastNotification("Consultation request submitted successfully!");
        
        // Reset form after successful submission
        setFormData({
          fullName: "",
          email: "",
          company: "",
          phone: "",
          businessSize: "",
          serviceType: contactType === "consultation" ? "enterprise" : "",
          preferredDate: "",
          preferredTime: "",
          message: "",
        });
        
      } catch (error) {
        console.error("Error submitting consultation request:", error);
        setSubmitted(false);
        showToastNotification(
          error.response?.data?.message || 
          "Failed to submit consultation request. Please try again."
        );
      }
    } else {
      showToastNotification("Please fill all required fields");
    }
  };

  // Get today's date in YYYY-MM-DD format for date input min
  const today = new Date().toISOString().split('T')[0];
  
  // Get date 3 months from now for date input max
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const maxDate = threeMonthsLater.toISOString().split('T')[0];

  return (
    <div className={`homepage-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header Section */}
      <header>
        <div className="header-container">
          <div className="logo float">Next Youth</div>
          
          <nav className="desktop-nav">
            <ul>
              <li><Link to="/business-solutions"><i className="fas fa-briefcase"></i>Business Solutions</Link></li>
              <li><a href="#"><i className="fas fa-compass"></i>Explore</a></li>
              <li><a href="#"><i className="fas fa-globe"></i>English</a></li>
              <li><a href="#"><i className="fas fa-store"></i>Become a Seller</a></li>
              <li>
                <button 
                  className="theme-toggle"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                  {isDarkMode ? ' Light Mode' : ' Dark Mode'}
                </button>
              </li>
            </ul>
          </nav>

          <div className="nav-controls">
            <div className="auth-buttons">
              <Link to="/login" className="login glow-on-hover">
                <i className="fas fa-sign-in-alt"></i>Log In
              </Link>
              <Link to="/register" className="signup glow-on-hover">
                <i className="fas fa-user-plus"></i>Sign Up
              </Link>
            </div>
            
            <button 
              ref={hamburgerRef}
              className={`hamburger-menu ${isMenuOpen ? 'open' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div 
          ref={menuRef}
          className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
          aria-hidden={!isMenuOpen}
        >
          <ul>
            <li className="nav-fade-in"><Link to="/business-solutions" onClick={handleMenuClick}><i className="fas fa-briefcase"></i>Business Solutions</Link></li>
            <li className="nav-fade-in"><a href="#" onClick={handleMenuClick}><i className="fas fa-compass"></i>Explore</a></li>
            <li className="nav-fade-in"><a href="#" onClick={handleMenuClick}><i className="fas fa-globe"></i>English</a></li>
            <li className="nav-fade-in"><a href="#" onClick={handleMenuClick}><i className="fas fa-store"></i>Become a Seller</a></li>
            <li className="nav-fade-in"><Link to="/login" className="login" onClick={handleMenuClick}><i className="fas fa-sign-in-alt"></i>Log In</Link></li>
            <li className="nav-fade-in"><Link to="/register" className="signup" onClick={handleMenuClick}><i className="fas fa-user-plus"></i>Sign Up</Link></li>
            <li className="nav-fade-in">
              <button 
                className="theme-toggle"
                onClick={() => {
                  setIsDarkMode(!isDarkMode);
                  handleMenuClick();
                }}
              >
                <i className={`fas ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                {isDarkMode ? ' Light Mode' : ' Dark Mode'}
              </button>
            </li>
          </ul>
        </div>
      </header>

      {/* Schedule Consultation Content */}
      <div className={`business-solutions-container ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Hero Section */}
        <section 
          className={`bs-hero ${isDarkMode ? "dark-bg" : "light-bg"}`}
          id="sc-hero"
          ref={addToRefs}
        >
          <div className={`bs-hero-content ${isVisible["sc-hero"] ? "bs-animate-in" : ""}`}>
            <h1>Schedule A Consultation</h1>
            <p>Take the first step towards transforming your business with our expert consultation services</p>
          </div>
        </section>

        {/* Form Section */}
        <section 
          className="bs-solutions" 
          id="sc-form"
          ref={addToRefs}
        >
          <div className={`bs-section-title ${isVisible["sc-form"] ? "bs-animate-in" : ""}`}>
            <h2>Book Your Consultation</h2>
            <p>Fill out the form below and one of our specialists will get in touch to confirm your appointment</p>
          </div>

          <div className={`sc-form-container ${isVisible["sc-form"] ? "bs-animate-in" : ""}`}>
            {submitted ? (
              <div className="sc-success-message">
                <div className="sc-success-icon">
                  <i className="fas fa-check-circle"></i>
                </div>
                <h3>Thank You!</h3>
                <p>Your consultation request has been submitted successfully.</p>
                <p>Our team will contact you shortly to confirm your appointment.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="sc-form">
                {/* Personal Information */}
                <div className="sc-form-section">
                  <h3>
                    Personal Information
                    <span></span>
                  </h3>
                  
                  <div className="sc-form-row">
                    <div className="sc-form-group">
                      <label htmlFor="fullName">
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={errors.fullName ? "error" : ""}
                      />
                      {errors.fullName && <div className="error-message">{errors.fullName}</div>}
                    </div>
                    
                    <div className="sc-form-group">
                      <label htmlFor="email">
                        Email Address <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className={errors.email ? "error" : ""}
                      />
                      {errors.email && <div className="error-message">{errors.email}</div>}
                    </div>
                  </div>
                  
                  <div className="sc-form-row">
                    <div className="sc-form-group">
                      <label htmlFor="company">
                        Company Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Enter your company name"
                        className={errors.company ? "error" : ""}
                      />
                      {errors.company && <div className="error-message">{errors.company}</div>}
                    </div>
                    
                    <div className="sc-form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number (optional)"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Business Information */}
                <div className="sc-form-section">
                  <h3>
                    Business Information
                    <span></span>
                  </h3>
                  
                  <div className="sc-form-row">
                    <div className="sc-form-group">
                      <label htmlFor="businessSize">
                        Business Size <span className="required">*</span>
                      </label>
                      <select
                        id="businessSize"
                        name="businessSize"
                        value={formData.businessSize}
                        onChange={handleChange}
                        className={errors.businessSize ? "error" : ""}
                      >
                        <option value="">Select your business size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501+">501+ employees</option>
                      </select>
                      {errors.businessSize && <div className="error-message">{errors.businessSize}</div>}
                    </div>
                    
                    <div className="sc-form-group">
                      <label htmlFor="serviceType">
                        Service Interest <span className="required">*</span>
                      </label>
                      <select
                        id="serviceType"
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className={errors.serviceType ? "error" : ""}
                      >
                        <option value="">Select service type</option>
                        <option value="enterprise">Enterprise Solutions</option>
                        <option value="smb">Small & Medium Business</option>
                        <option value="freelancers">Freelancer & Agency</option>
                        <option value="custom">Custom Solutions</option>
                      </select>
                      {errors.serviceType && <div className="error-message">{errors.serviceType}</div>}
                    </div>
                  </div>
                </div>
                
                {/* Consultation Preferences */}
                <div className="sc-form-section">
                  <h3>
                    Consultation Preferences
                    <span></span>
                  </h3>
                  
                  <div className="sc-form-row">
                    <div className="sc-form-group">
                      <label htmlFor="preferredDate">
                        Preferred Date <span className="required">*</span>
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleChange}
                        min={today}
                        max={maxDate}
                        className={errors.preferredDate ? "error" : ""}
                      />
                      {errors.preferredDate && <div className="error-message">{errors.preferredDate}</div>}
                    </div>
                    
                    <div className="sc-form-group">
                      <label htmlFor="preferredTime">
                        Preferred Time <span className="required">*</span>
                      </label>
                      <select
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        className={errors.preferredTime ? "error" : ""}
                      >
                        <option value="">Select preferred time</option>
                        <option value="morning">Morning (9AM - 12PM)</option>
                        <option value="afternoon">Afternoon (12PM - 3PM)</option>
                        <option value="evening">Evening (3PM - 6PM)</option>
                      </select>
                      {errors.preferredTime && <div className="error-message">{errors.preferredTime}</div>}
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="sc-form-section">
                  <h3>
                    Additional Information
                    <span></span>
                  </h3>
                  
                  <div className="sc-form-group">
                    <label htmlFor="message">Your Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your business needs and any specific requirements for the consultation"
                    />
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="sc-form-footer">
                  <button type="submit" className="bs-primary-btn">
                    <i className="fas fa-calendar-check"></i>
                    Book Consultation
                  </button>
                  
                  <p className="security-message">
                    <i className="fas fa-lock"></i>
                    Your information is secure and will only be used for scheduling your consultation
                  </p>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Why Book Section */}
        <section 
          className={`bs-process ${isDarkMode ? "dark-bg-alt" : "light-bg-alt"}`}
          id="sc-why"
          ref={addToRefs}
        >
          <div className={`bs-section-title ${isVisible["sc-why"] ? "bs-animate-in" : ""}`}>
            <h2>Why Book a Consultation?</h2>
            <p>Discover how our personalized consultation process helps businesses like yours succeed</p>
          </div>

          <div className={`bs-timeline ${isVisible["sc-why"] ? "bs-animate-in" : ""}`}>
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">1</div>
              <div className="bs-timeline-content">
                <h4>Expert Assessment</h4>
                <p>Our specialists will analyze your current business operations and identify opportunities for growth and optimization.</p>
              </div>
            </div>
            
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">2</div>
              <div className="bs-timeline-content">
                <h4>Tailored Solutions</h4>
                <p>We'll create a customized strategy that addresses your specific business challenges and aligns with your goals.</p>
              </div>
            </div>
            
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">3</div>
              <div className="bs-timeline-content">
                <h4>Implementation Roadmap</h4>
                <p>Receive a clear step-by-step plan that outlines how to implement our recommended solutions effectively.</p>
              </div>
            </div>
            
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">4</div>
              <div className="bs-timeline-content">
                <h4>Ongoing Support</h4>
                <p>Our relationship doesn't end after the consultation. We provide continuous support to ensure your success.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className={`bs-cta ${isDarkMode ? "dark-cta-bg" : "light-cta-bg"}`}
          id="sc-cta"
          ref={addToRefs}
        >
          <div className={`bs-cta-container ${isVisible["sc-cta"] ? "bs-animate-in" : ""}`}>
            <h2>Ready to Transform Your Business?</h2>
            <p>Our experts are waiting to help you take your business to the next level with tailored solutions.</p>
            <div className="bs-cta-buttons">
              <a href="#sc-form" className="bs-primary-btn">
                <i className="fas fa-calendar-alt"></i> Schedule Now
              </a>
              <a href="#" className="bs-secondary-btn">
                <i className="fas fa-phone"></i> Contact Sales Team
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      <div className={`toast-notification ${showToast ? 'active' : ''}`}>
        <i className="fas fa-info-circle"></i>
        <span>{toastMessage}</span>
      </div>

      {/* Footer */}
      <footer className={isDarkMode ? "dark-footer" : "light-footer"}>
        <div className="footer-container">
          <div className="footer-section">
            <h3>Next Youth</h3>
            <p>Connecting businesses with world-class talent for exceptional results.</p>
            <div className="social-links">
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-linkedin"></i></a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>For Clients</h4>
            <ul>
              <li><a href="#">Find Talent</a></li>
              <li><a href="#">Enterprise Solutions</a></li>
              <li><a href="#">Success Stories</a></li>
              <li><a href="#">Resources</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>For Talent</h4>
            <ul>
              <li><a href="#">Find Work</a></li>
              <li><a href="#">Become a Seller</a></li>
              <li><a href="#">Community</a></li>
              <li><a href="#">Development Tools</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help & Support</a></li>
              <li><a href="#">Trust & Safety</a></li>
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Next Youth. All rights reserved.</p>
          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ScheduleConsultation;
import React, { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./BusinessSolutions.css"; // Reuse existing styles
import "./Homepage.css"; // Reuse homepage styles
import "./contact.css"; // New separated CSS
import axios from "axios";

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
  
  // Solution categories with icons and descriptions from RequestDemo.js
  const demoSolutions = [
    {
      icon: "chart-line",
      title: "Analytics Dashboard",
      description: "Interactive visualization of your business metrics and KPIs"
    },
    {
      icon: "users",
      title: "Team Management",
      description: "Collaborate effectively across departments and projects"
    },
    {
      icon: "tasks",
      title: "Project Workflow",
      description: "Streamline your operations with our intuitive workflow tools"
    },
    {
      icon: "shield-alt",
      title: "Security Features",
      description: "Enterprise-grade security protocols for your data"
    },
    {
      icon: "bullhorn",
      title: "Marketing Tools",
      description: "Reach your audience with integrated marketing solutions"
    },
    {
      icon: "headset",
      title: "Customer Service",
      description: "Enhanced customer support and engagement tools"
    }
  ];

  // Benefits of our solutions from RequestDemo.js
  const benefits = [
    {
      icon: "clock",
      title: "Save Time",
      description: "Reduce manual processes by up to 75% with automated workflows"
    },
    {
      icon: "coins",
      title: "Cost Efficient",
      description: "Lower operational costs and increase ROI with optimized systems"
    },
    {
      icon: "chart-bar",
      title: "Scale Easily",
      description: "Flexible solutions that grow with your business needs"
    },
    {
      icon: "bolt",
      title: "Boost Productivity",
      description: "Empower your team with tools designed for maximum efficiency"
    }
  ];

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

  // Add this smooth scroll handler function
  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

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

      {/* Contact Content with Sections from Demo Page */}
      <div className={`business-solutions-container ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Hero Section - Enhanced with Demo Page Style */}
        <section 
          className="demo-hero" 
          id="sc-hero"
          ref={addToRefs}
        >
          <div className={`demo-hero-content ${isVisible["sc-hero"] ? "demo-animate-in" : ""}`}>
            <h1>Transform Your Business Today</h1>
            <p>Schedule a consultation with our experts and discover tailored solutions for your unique challenges</p>
            <div className="demo-cta-buttons">
              <a 
                href="#sc-form" 
                className="demo-primary-btn"
                onClick={(e) => handleSmoothScroll(e, "sc-form")}
              >
                <i className="fas fa-calendar-alt"></i> Schedule Now
              </a>
              <a href="#sc-benefits" className="demo-secondary-btn" onClick={(e) => handleSmoothScroll(e, "sc-expect")}>
                <i className="fas fa-info-circle"></i> Learn More
              </a>
            </div>
          </div>
          <div className={`demo-hero-image ${isVisible["sc-hero"] ? "demo-animate-in" : ""}`}>
          </div>
        </section>

        {/* Solutions Preview Section - From Demo Page */}
        <section 
          className="demo-solutions-preview" 
          id="demo-solutions"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-solutions"] ? "demo-animate-in" : ""}`}>
            <h2>Our Comprehensive Solutions</h2>
            <p>Discover how our suite of tools can help your business thrive in today's competitive market</p>
          </div>

          <div className={`demo-solutions-grid ${isVisible["demo-solutions"] ? "demo-animate-in" : ""}`}>
            {demoSolutions.map((solution, index) => (
              <div className="demo-solution-card" key={index}>
                <div className="demo-solution-icon">
                  <i className={`fas fa-${solution.icon}`}></i>
                </div>
                <h3>{solution.title}</h3>
                <p>{solution.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* What to Expect Section - Keep Original */}
        <section 
          className={`bs-process ${isDarkMode ? "dark-bg-alt" : "light-bg-alt"}`}
          id="sc-expect"
          ref={addToRefs}
        >
          <div className={`bs-section-title ${isVisible["sc-expect"] ? "bs-animate-in" : ""}`}>
            <h2>What to Expect From Your Consultation</h2>
            <p>Our personalized approach ensures you receive maximum value from every consultation session</p>
          </div>

          <div className={`bs-features-grid ${isVisible["sc-expect"] ? "bs-animate-in" : ""}`}>
            <div className="bs-feature-card">
              <div className="bs-feature-content">
                <div className="bs-feature-icon">
                  <i className="fas fa-handshake"></i>
                </div>
                <h3>Personalized Attention</h3>
                <p>Your consultation is tailored specifically to your business needs, challenges, and goals.</p>
              </div>
            </div>

            <div className="bs-feature-card">
              <div className="bs-feature-content">
                <div className="bs-feature-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h3>In-depth Analysis</h3>
                <p>Our experts thoroughly analyze your current situation to identify both challenges and opportunities.</p>
              </div>
            </div>

            <div className="bs-feature-card">
              <div className="bs-feature-content">
                <div className="bs-feature-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <h3>Detailed Documentation</h3>
                <p>Receive comprehensive reports and recommendations that serve as your actionable roadmap.</p>
              </div>
            </div>

            <div className="bs-feature-card">
              <div className="bs-feature-content">
                <div className="bs-feature-icon">
                  <i className="fas fa-headset"></i>
                </div>
                <h3>Follow-up Support</h3>
                <p>Our relationship doesn't end after the consultation - we provide ongoing support as you implement changes.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - From Demo Page */}
        <section 
          className="demo-benefits" 
          id="demo-benefits"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-benefits"] ? "demo-animate-in" : ""}`}>
            <h2>Why Work With Us?</h2>
            <p>Experience firsthand how our solutions drive measurable business results</p>
          </div>

          <div className={`demo-benefits-grid ${isVisible["demo-benefits"] ? "demo-animate-in" : ""}`}>
            {benefits.map((benefit, index) => (
              <div className="demo-benefit-card" key={index}>
                <div className="demo-benefit-icon">
                  <i className={`fas fa-${benefit.icon}`}></i>
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Consultation Process Section - Enhanced with Demo Page Style */}
        <section 
          className="demo-process" 
          id="sc-process"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["sc-process"] ? "demo-animate-in" : ""}`}>
            <h2>Our Simple Consultation Process</h2>
            <p>How we help transform your business challenges into opportunities</p>
          </div>

          <div className={`demo-process-steps ${isVisible["sc-process"] ? "demo-animate-in" : ""}`}>
            <div className="demo-process-step">
              <div className="demo-step-number">1</div>
              <div className="demo-step-content">
                <h3>Schedule</h3>
                <p>Book your consultation and complete a brief questionnaire to help us understand your needs</p>
              </div>
            </div>
            <div className="demo-process-step">
              <div className="demo-step-number">2</div>
              <div className="demo-step-content">
                <h3>Analyze</h3>
                <p>Our experts will assess your business situation and develop tailored recommendations</p>
              </div>
            </div>
            <div className="demo-process-step">
              <div className="demo-step-number">3</div>
              <div className="demo-step-content">
                <h3>Implement</h3>
                <p>Receive a comprehensive action plan with ongoing support during implementation</p>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section - Keep Original */}
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
        
        {/* Testimonials Section - From Demo Page */}
        <section 
          className="demo-testimonials" 
          id="demo-testimonials"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-testimonials"] ? "demo-animate-in" : ""}`}>
            <h2>What Our Clients Say</h2>
            <p>Hear from businesses that have transformed after working with us</p>
          </div>

          <div className={`demo-testimonial-cards ${isVisible["demo-testimonials"] ? "demo-animate-in" : ""}`}>
            <div className="demo-testimonial-card">
              <div className="demo-testimonial-content">
                <i className="fas fa-quote-left"></i>
                <p>"The personalized consultation showed us exactly how their solutions could solve our specific challenges. We implemented the recommendations the following week and saw immediate results."</p>
              </div>
              <div className="demo-testimonial-author">
                <div className="demo-author-image">
                  <img src="https://source.unsplash.com/random/100x100/?ceo" alt="CEO" />
                </div>
                <div className="demo-author-details">
                  <h4>David Wilson</h4>
                  <span>CEO, TechInnovate</span>
                </div>
              </div>
            </div>

            <div className="demo-testimonial-card">
              <div className="demo-testimonial-content">
                <i className="fas fa-quote-left"></i>
                <p>"The live consultation was eye-opening. We could immediately see how their approach would transform our decision-making process. Six months later, our efficiency has increased by 43%."</p>
              </div>
              <div className="demo-testimonial-author">
                <div className="demo-author-image">
                  <img src="https://source.unsplash.com/random/100x100/?cto" alt="CTO" />
                </div>
                <div className="demo-author-details">
                  <h4>Alicia Zhang</h4>
                  <span>CTO, Global Solutions Inc.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section - From Demo Page */}
        <section 
          className="demo-final-cta" 
          id="demo-final-cta"
          ref={addToRefs}
        >
          <div className={`demo-cta-container ${isVisible["demo-final-cta"] ? "demo-animate-in" : ""}`}>
            <h2>Ready to transform your business?</h2>
            <p>Schedule your personalized consultation today and discover how we can help your business thrive</p>
            <a 
              href="#sc-form" 
              className="demo-primary-btn"
              onClick={(e) => handleSmoothScroll(e, "sc-form")}
            >
              <i className="fas fa-calendar-check"></i> Book Your Consultation Now
            </a>
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
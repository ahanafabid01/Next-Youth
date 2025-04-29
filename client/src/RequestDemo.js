import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom"; // Add useNavigate
import "./RequestDemo.css";
import "./Homepage.css"; // Import Homepage CSS for header and footer styles
import axios from "axios"; // Add axios import

// Add this near the top where other imports are
// Make sure the API_BASE_URL is properly set
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const RequestDemo = () => {
  // State for animations and visibility
  const [isVisible, setIsVisible] = useState({});
  const sectionsRef = useRef([]);
  
  // Header and footer related state (from Homepage)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);

  // Solution categories with icons and descriptions
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

  // Benefits of our solutions
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

  // Form state variables
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    company: "",
    phone: "",
    businessSize: "1-10",
    preferredDate: "",
    preferredTime: "morning",
    message: "",
    serviceType: "demo" // Identifies this as a demo request
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const navigate = useNavigate();
  
  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");
    
    try {
      console.log("Submitting form data:", formData);
      
      const response = await axios.post(
        `${API_BASE_URL}/contact/demo-request`, 
        formData
      );
      
      console.log("Response received:", response.data);
      
      if (response.data.success) {
        setFormSuccess(true);
        showToastNotification("Demo request submitted successfully!");
        
        // Reset form after successful submission
        setFormData({
          fullName: "",
          email: "",
          company: "",
          phone: "",
          businessSize: "1-10",
          preferredDate: "",
          preferredTime: "morning",
          message: "",
          serviceType: "demo"
        });
        
        // Scroll to success message
        setTimeout(() => {
          document.getElementById("form-success")?.scrollIntoView({ 
            behavior: "smooth",
            block: "center"  
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error submitting demo request:", error);
      setFormError(error.response?.data?.message || "Failed to submit demo request. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Add this function to your component, near other handler functions
  const scrollToForm = () => {
    document.getElementById("demo-request-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };

  // Intersection observer for scroll animations
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

  // Add sections to ref
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
    const handleBodyScroll = () => {
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    };
    
    handleBodyScroll();
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

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

      {/* RequestDemo Content */}
      <div className={`demo-container ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Hero Section */}
        <section 
          className="demo-hero" 
          id="demo-hero"
          ref={addToRefs}
        >
          <div className={`demo-hero-content ${isVisible["demo-hero"] ? "demo-animate-in" : ""}`}>
            <h1>Experience Our Solutions in Action</h1>
            <p>See how our industry-leading tools can transform your business operations</p>
            <div className="demo-cta-buttons">
              <button 
                onClick={scrollToForm} 
                className="demo-primary-btn"
              >
                <i className="fas fa-calendar-alt"></i> Schedule a Demo
              </button>
            </div>
          </div>
          <div className={`demo-hero-image ${isVisible["demo-hero"] ? "demo-animate-in" : ""}`}>
          </div>
        </section>

        {/* Solutions Preview Section */}
        <section 
          className="demo-solutions-preview" 
          id="demo-solutions"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-solutions"] ? "demo-animate-in" : ""}`}>
            <h2>What You'll Experience</h2>
            <p>Our personalized demos showcase our most powerful features tailored to your business needs</p>
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

        {/* Benefits Section */}
        <section 
          className="demo-benefits" 
          id="demo-benefits"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-benefits"] ? "demo-animate-in" : ""}`}>
            <h2>Why Request a Demo?</h2>
            <p>Experience firsthand how our solutions can drive your business forward</p>
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

        {/* Demo Process */}
        <section 
          className="demo-process" 
          id="demo-process"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-process"] ? "demo-animate-in" : ""}`}>
            <h2>How It Works</h2>
            <p>Our simple three-step process to get your personalized demo</p>
          </div>

          <div className={`demo-process-steps ${isVisible["demo-process"] ? "demo-animate-in" : ""}`}>
            <div className="demo-process-step">
              <div className="demo-step-number">1</div>
              <div className="demo-step-content">
                <h3>Schedule</h3>
                <p>Select a convenient time for your personalized demo session</p>
              </div>
            </div>
            <div className="demo-process-step">
              <div className="demo-step-number">2</div>
              <div className="demo-step-content">
                <h3>Customize</h3>
                <p>Our experts will tailor the demonstration to your specific needs</p>
              </div>
            </div>
            <div className="demo-process-step">
              <div className="demo-step-number">3</div>
              <div className="demo-step-content">
                <h3>Experience</h3>
                <p>Join the interactive session and see our solutions in action</p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Request Form */}
        <section 
          className="demo-request-form" 
          id="demo-request-form"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-request-form"] ? "demo-animate-in" : ""}`}>
            <h2>Schedule Your 15-20 Minute Demo Session</h2>
            <p>Fill out the form below and our team will schedule a personalized demonstration</p>
          </div>
          
          <div className={`demo-form-container ${isVisible["demo-request-form"] ? "demo-animate-in" : ""}`}>
            {formSuccess ? (
              <div className="demo-form-success" id="form-success">
                <i className="fas fa-check-circle"></i>
                <h3>Demo Request Submitted!</h3>
                <p>Thank you for your interest in our solutions. Our team will contact you shortly to confirm your 15-20 minute demo session.</p>
                <button 
                  className="demo-secondary-btn"
                  onClick={() => setFormSuccess(false)}
                >
                  <i className="fas fa-plus-circle"></i> Request Another Demo
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="demo-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fas fa-user"></i>
                      <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="Your name"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fas fa-envelope"></i>
                      <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company Name <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fas fa-building"></i>
                      <input 
                        type="text" 
                        id="company" 
                        name="company" 
                        value={formData.company} 
                        onChange={handleInputChange} 
                        required 
                        placeholder="Your company"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <div className="input-with-icon">
                      <i className="fas fa-phone"></i>
                      <input 
                        type="tel" 
                        id="phone" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleInputChange} 
                        placeholder="Optional contact number"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="businessSize">Business Size <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fas fa-users"></i>
                      <select 
                        id="businessSize" 
                        name="businessSize" 
                        value={formData.businessSize} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501+">501+ employees</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="preferredDate">Preferred Date <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fas fa-calendar-alt"></i>
                      <input 
                        type="date" 
                        id="preferredDate" 
                        name="preferredDate" 
                        value={formData.preferredDate} 
                        onChange={handleInputChange} 
                        required 
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="preferredTime">Preferred Time <span className="required">*</span></label>
                    <div className="input-with-icon">
                      <i className="fas fa-clock"></i>
                      <select 
                        id="preferredTime" 
                        name="preferredTime" 
                        value={formData.preferredTime} 
                        onChange={handleInputChange} 
                        required
                      >
                        <option value="morning">Morning (9am - 12pm)</option>
                        <option value="afternoon">Afternoon (12pm - 5pm)</option>
                        <option value="evening">Evening (5pm - 8pm)</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label htmlFor="message">Specific Requirements</label>
                  <div className="input-with-icon textarea-container">
                    <i className="fas fa-comment"></i>
                    <textarea 
                      id="message" 
                      name="message" 
                      value={formData.message} 
                      onChange={handleInputChange} 
                      placeholder="Tell us what you'd like to focus on during the demo..."
                      rows="4"
                    ></textarea>
                  </div>
                </div>
                
                <div className="demo-duration-note">
                  <i className="fas fa-info-circle"></i>
                  <p>Demo sessions are between 15-20 minutes long and tailored to your business needs</p>
                </div>
                
                {formError && (
                  <div className="form-error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>{formError}</p>
                  </div>
                )}
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="demo-primary-btn" 
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-calendar-check"></i> Schedule Demo
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section 
          className="demo-testimonials" 
          id="demo-testimonials"
          ref={addToRefs}
        >
          <div className={`demo-section-title ${isVisible["demo-testimonials"] ? "demo-animate-in" : ""}`}>
            <h2>What Our Clients Say</h2>
            <p>Hear from businesses that have transformed after seeing our demos</p>
          </div>

          <div className={`demo-testimonial-cards ${isVisible["demo-testimonials"] ? "demo-animate-in" : ""}`}>
            <div className="demo-testimonial-card">
              <div className="demo-testimonial-content">
                <i className="fas fa-quote-left"></i>
                <p>"The personalized demo showed us exactly how the platform could solve our specific challenges. We implemented the solution the following week and saw immediate results."</p>
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
                <p>"The live demo was eye-opening. We could immediately see how the analytics dashboard would transform our decision-making process. Six months later, our efficiency has increased by 43%."</p>
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

        {/* Final CTA */}
        <section 
          className="demo-final-cta" 
          id="demo-final-cta"
          ref={addToRefs}
        >
          <div className={`demo-cta-container ${isVisible["demo-final-cta"] ? "demo-animate-in" : ""}`}>
            <h2>Ready to see our solutions in action?</h2>
            <p>Schedule your personalized demo today and discover how we can help your business thrive</p>
            <button 
              onClick={scrollToForm} 
              className="demo-primary-btn"
            >
              <i className="fas fa-calendar-check"></i> Book Your Demo Now
            </button>
          </div>
        </section>
      </div>

      {/* Footer Section */}
      <footer>
        <div className="footer-container">
          <div className="footer-column">
            <h3>Categories</h3>
            <ul>
              {['Graphics & Design', 'Digital Marketing', 'Writing & Translation', 'Video & Animation', 'Music & Audio'].map((cat, i) => (
                <li key={i}><a href="#"><i className={`fas fa-${['palette', 'bullhorn', 'pen', 'film', 'music'][i]}`}></i>{cat}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-column">
            <h3>About</h3>
            <ul>
              {['Careers', 'Press & News', 'Partnerships', 'Privacy Policy', 'Terms of Service'].map((item, i) => (
                <li key={i}><a href="#"><i className={`fas fa-${['briefcase', 'newspaper', 'handshake', 'lock', 'file-contract'][i]}`}></i>{item}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-column">
            <h3>Support</h3>
            <ul>
              {['Help & Support', 'Trust & Safety', 'Selling Guide', 'Buying Guide'].map((item, i) => (
                <li key={i}><a href="#"><i className={`fas fa-${['life-ring', 'shield-alt', 'book', 'shopping-cart'][i]}`}></i>{item}</a></li>
              ))}
            </ul>
          </div>
          <div className="footer-column">
            <h3>Community</h3>
            <ul>
              {['Events', 'Blog', 'Forum', 'Podcast'].map((item, i) => (
                <li key={i}><a href="#"><i className={`fas fa-${['calendar-alt', 'blog', 'comments', 'podcast'][i]}`}></i>{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="copyright">
          <span>© 2025 Next-Youth Marketplace</span>
          <div className="social-icons">
            <a href="https://facebook.com" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
            <a href="https://twitter.com" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            <a href="https://instagram.com" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href="https://linkedin.com" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default RequestDemo;
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./BusinessSolutions.css"; 
import "./Homepage.css"; // Import Homepage CSS for header and footer styles
import logoLight from '../assets/images/logo-light.png';
import logoDark from '../assets/images/logo-dark.png';
// Import testimonial images
import sarahJohnsonImg from '../assets/images/sarah-johnson.jpg';
import michaelChenImg from '../assets/images/michael-chen.jpg';
import emmaRodriguezImg from '../assets/images/emma-rodriguez.jpg';

const BusinessSolutions = () => {
  // Original BusinessSolutions state
  const [activeTab, setActiveTab] = useState("enterprise");
  const [isVisible, setIsVisible] = useState({});
  
  // Header and footer related state (from Homepage)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);
  const sectionsRef = useRef([]);

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

  // Business solutions data
  const solutions = {
    enterprise: {
      title: "Enterprise Solutions",
      description: "Streamline your business operations with our comprehensive enterprise services.",
      features: [
        { 
          icon: "building", 
          title: "Enterprise Management", 
          desc: "End-to-end solutions for large organizations with complex needs"
        },
        { 
          icon: "users-cog", 
          title: "Workforce Solutions", 
          desc: "Manage your global talent pool with our advanced HR tools"
        },
        { 
          icon: "shield-alt", 
          title: "Enterprise Security", 
          desc: "Protect your business with our advanced security protocols"
        },
        { 
          icon: "chart-bar", 
          title: "Data Analytics", 
          desc: "Turn your data into actionable insights with our analytics platform"
        }
      ],
      testimonial: {
        quote: "Next Youth's enterprise solutions have transformed our business operations, saving us thousands of hours in productivity.",
        author: "Sarah Johnson",
        company: "Global Tech Industries",
        image: sarahJohnsonImg
      }
    },
    smb: {
      title: "Small & Medium Business",
      description: "Affordable and scalable solutions designed specifically for growing businesses.",
      features: [
        { 
          icon: "store", 
          title: "Business Growth", 
          desc: "Tools and resources to help your business expand efficiently"
        },
        { 
          icon: "comments-dollar", 
          title: "Cost-Effective Solutions", 
          desc: "Maximize your ROI with our affordable business packages"
        },
        { 
          icon: "tasks", 
          title: "Project Management", 
          desc: "Streamline operations with our intuitive project management tools"
        },
        { 
          icon: "chart-line", 
          title: "Market Expansion", 
          desc: "Reach new markets with our strategic business solutions"
        }
      ],
      testimonial: {
        quote: "As a small business owner, I was amazed at how quickly we scaled after implementing Next Youth's business solutions.",
        author: "Michael Chen",
        company: "Innovative Solutions LLC",
        image: michaelChenImg
      }
    },
    freelancers: {
      title: "Freelancer & Agency",
      description: "Empower your creative work with tools designed for independent professionals and agencies.",
      features: [
        { 
          icon: "user-tie", 
          title: "Freelancer Resources", 
          desc: "Everything you need to succeed as an independent professional"
        },
        { 
          icon: "handshake", 
          title: "Client Management", 
          desc: "Manage your client relationships effectively with our CRM tools"
        },
        { 
          icon: "file-invoice-dollar", 
          title: "Billing & Invoicing", 
          desc: "Hassle-free billing solutions for freelancers and agencies"
        },
        { 
          icon: "briefcase", 
          title: "Portfolio Management", 
          desc: "Showcase your work professionally to attract more clients"
        }
      ],
      testimonial: {
        quote: "The freelancer tools from Next Youth helped me transition from side gigs to a full-time design agency in just one year.",
        author: "Emma Rodriguez",
        company: "Creative Minds Design",
        image: emmaRodriguezImg
      }
    }
  };

  const currentSolution = solutions[activeTab];

  return (
    <div className={`homepage-container ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header Section */}
      <header>
        <div className="header-container">
          <div className="logo">
            <Link to="/">
              <img 
                src={isDarkMode ? logoDark : logoLight} 
                alt="Next Youth" 
                className="logo-image" 
              />
            </Link>
          </div>
          
          <nav className="desktop-nav">
            <ul>
              <li><Link to="/business-solutions"><i className="fas fa-briefcase"></i>Business Solutions</Link></li>
              <li><a href="#"><i className="fas fa-compass"></i>Explore</a></li>
              <li><a href="#"><i className="fas fa-globe"></i>English</a></li>
              <li><Link to="/become-seller"><i className="fas fa-store"></i>Become a Seller</Link></li>
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
            <li className="nav-fade-in"><Link to="/become-seller" onClick={handleMenuClick}><i className="fas fa-store"></i>Become a Seller</Link></li>
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

      {/* Original BusinessSolutions content */}
      <div className={`business-solutions-container ${isDarkMode ? "dark-mode" : ""}`}>
        <section 
          className="bs-hero" 
          id="bs-hero"
          ref={addToRefs}
        >
          <div className={`bs-hero-content ${isVisible["bs-hero"] ? "bs-animate-in" : ""}`}>
            <h1>Business Solutions</h1>
            <p>Discover tailored solutions to help your business thrive in today's competitive marketplace</p>
            <div className="bs-cta-buttons">
              <Link to="/contact?type=general" className="bs-primary-btn">Get Started</Link>
            </div>
          </div>
          <div className="bs-hero-image"></div>
        </section>

        <section 
          className="bs-solutions" 
          id="bs-solutions"
          ref={addToRefs}
        >
          <div className={`bs-section-title ${isVisible["bs-solutions"] ? "bs-animate-in" : ""}`}>
            <h2>Tailored Solutions for Every Business</h2>
            <p>We offer customized services to meet the unique needs of your organization</p>
          </div>

          <div className="bs-tabs">
            <div className="bs-tab-buttons">
              <button 
                className={activeTab === "enterprise" ? "active" : ""}
                onClick={() => setActiveTab("enterprise")}
              >
                <i className="fas fa-building"></i>
                Enterprise
              </button>
              <button 
                className={activeTab === "smb" ? "active" : ""}
                onClick={() => setActiveTab("smb")}
              >
                <i className="fas fa-store"></i>
                SMB
              </button>
              <button 
                className={activeTab === "freelancers" ? "active" : ""}
                onClick={() => setActiveTab("freelancers")}
              >
                <i className="fas fa-user-tie"></i>
                Freelancers
              </button>
            </div>

            <div className="bs-tab-content">
              <div className={`bs-tab-pane ${isVisible["bs-solutions"] ? "bs-animate-in" : ""}`}>
                <h3>{currentSolution.title}</h3>
                <p>{currentSolution.description}</p>
                
                <div className="bs-features-grid">
                  {currentSolution.features.map((feature, index) => (
                    <div className="bs-feature-card" key={index}>
                      <div className="bs-feature-icon">
                        <i className={`fas fa-${feature.icon}`}></i>
                      </div>
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="bs-testimonial">
                  <div className="bs-testimonial-content">
                    <i className="fas fa-quote-left"></i>
                    <p>{currentSolution.testimonial.quote}</p>
                    <div className="bs-testimonial-author">
                      <div className="bs-author-image">
                        <img src={currentSolution.testimonial.image} alt={currentSolution.testimonial.author} />
                      </div>
                      <div className="bs-author-details">
                        <h5>{currentSolution.testimonial.author}</h5>
                        <span>{currentSolution.testimonial.company}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section 
          className="bs-process" 
          id="bs-process"
          ref={addToRefs}
        >
          <div className={`bs-section-title ${isVisible["bs-process"] ? "bs-animate-in" : ""}`}>
            <h2>Our Process</h2>
            <p>A streamlined approach to implementing business solutions</p>
          </div>

          <div className={`bs-timeline ${isVisible["bs-process"] ? "bs-animate-in" : ""}`}>
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">1</div>
              <div className="bs-timeline-content">
                <h4>Consultation</h4>
                <p>We begin with a thorough assessment of your business needs and goals</p>
              </div>
            </div>
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">2</div>
              <div className="bs-timeline-content">
                <h4>Strategy Development</h4>
                <p>Our experts develop a tailored strategy to address your specific challenges</p>
              </div>
            </div>
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">3</div>
              <div className="bs-timeline-content">
                <h4>Implementation</h4>
                <p>We implement solutions with minimal disruption to your operations</p>
              </div>
            </div>
            <div className="bs-timeline-item">
              <div className="bs-timeline-marker">4</div>
              <div className="bs-timeline-content">
                <h4>Review & Optimization</h4>
                <p>Continuous monitoring and refinement to ensure optimal results</p>
              </div>
            </div>
          </div>
        </section>

        <section 
          className="bs-stats" 
          id="bs-stats"
          ref={addToRefs}
        >
          <div className={`bs-stats-grid ${isVisible["bs-stats"] ? "bs-animate-in" : ""}`}>
            <div className="bs-stat-card">
              <div className="bs-stat-number">93%</div>
              <div className="bs-stat-title">Client Satisfaction</div>
            </div>
            <div className="bs-stat-card">
              <div className="bs-stat-number">500+</div>
              <div className="bs-stat-title">Businesses Served</div>
            </div>
            <div className="bs-stat-card">
              <div className="bs-stat-number">30%</div>
              <div className="bs-stat-title">Avg. Efficiency Increase</div>
            </div>
            <div className="bs-stat-card">
              <div className="bs-stat-number">24/7</div>
              <div className="bs-stat-title">Support Available</div>
            </div>
          </div>
        </section>

        <section 
          className="bs-cta" 
          id="bs-cta"
          ref={addToRefs}
        >
          <div className={`bs-cta-container ${isVisible["bs-cta"] ? "bs-animate-in" : ""}`}>
            <h2>Ready to transform your business?</h2>
            <p>Connect with our team to discuss how we can help you achieve your business goals.</p>
            <Link to="/contact?type=consultation" className="bs-primary-btn">Schedule Consultation</Link>
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
    </div>
  );
};

export default BusinessSolutions;
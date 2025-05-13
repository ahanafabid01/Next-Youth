import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./BecomeSeller.css"; 
import "./Homepage.css"; // Import Homepage CSS for header and footer styles
import { initFaqToggle } from "../utils/faqToggle";
import logoLight from '../assets/images/logo-light.png';
import logoDark from '../assets/images/logo-dark.png';
// Import seller profile images
import sellerJohnImg from '../assets/images/seller-john.jpg';
import sellerMayaImg from '../assets/images/seller-maya.jpg';
import sellerDavidImg from '../assets/images/seller-david.jpg';

const BecomeSeller = () => {
  // State management (similar to BusinessSolutions)
  const [activeTab, setActiveTab] = useState("freelancer");
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
  const faqContainerRef = useRef(null);

  // Initialize FAQ toggle functionality
  useEffect(() => {
    if (faqContainerRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        initFaqToggle(faqContainerRef.current);
      }, 100);
    }
  }, [isVisible, activeTab]); // Re-run when visibility or active tab changes

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

  // Seller program data
  const sellerPrograms = {
    freelancer: {
      title: "Freelancer",
      description: "Perfect for individuals looking to offer their skills and services",
      features: [
        { 
          icon: "user-tie", 
          title: "Low Fees", 
          desc: "Competitive commission rates that reward your growth" 
        },
        { 
          icon: "chart-line", 
          title: "Growth Tools", 
          desc: "Analytics and insights to help you expand your client base" 
        },
        { 
          icon: "bolt", 
          title: "Quick Payments", 
          desc: "Receive your earnings within 7 days of order completion" 
        },
        { 
          icon: "globe", 
          title: "Global Reach", 
          desc: "Access clients from over 160+ countries worldwide" 
        }
      ],
      testimonial: {
        quote: "I started as a part-time graphic designer and now run my own studio with clients from three continents, all thanks to Next Youth's seller platform.",
        author: "John Miller",
        profession: "Graphic Designer",
        image: sellerJohnImg
      }
    },
    agency: {
      title: "Agency",
      description: "Designed for teams and established businesses looking to scale",
      features: [
        { 
          icon: "users", 
          title: "Team Management", 
          desc: "Add team members and assign permissions for collaborative work" 
        },
        { 
          icon: "tasks", 
          title: "Workflow Tools", 
          desc: "Specialized tools to manage multiple projects efficiently" 
        },
        { 
          icon: "medal", 
          title: "Priority Support", 
          desc: "Dedicated account manager for agencies with premium status" 
        },
        { 
          icon: "project-diagram", 
          title: "Advanced CRM", 
          desc: "Comprehensive client management system for larger operations" 
        }
      ],
      testimonial: {
        quote: "Our agency has tripled in size since joining Next Youth. The platform handles all our client acquisition, allowing us to focus on delivering quality work.",
        author: "Maya Wilson",
        profession: "Creative Agency Founder",
        image: sellerMayaImg
      }
    },
    enterprise: {
      title: "Enterprise Seller",
      description: "For established businesses looking to expand their digital offerings",
      features: [
        { 
          icon: "building", 
          title: "Brand Control", 
          desc: "Enhanced profile options with custom branding features" 
        },
        { 
          icon: "handshake", 
          title: "Enterprise Clients", 
          desc: "Access to our network of Fortune 500 companies" 
        },
        { 
          icon: "shield-alt", 
          title: "Premium Protection", 
          desc: "Advanced IP protection and confidentiality guarantees" 
        },
        { 
          icon: "money-check-alt", 
          title: "Flexible Billing", 
          desc: "Custom payment terms and enterprise invoicing options" 
        }
      ],
      testimonial: {
        quote: "Next Youth has become our most valuable channel for acquiring new enterprise clients. The platform's reputation for quality gives us instant credibility.",
        author: "David Chang",
        profession: "Software Development Firm CEO",
        image: sellerDavidImg
      }
    }
  };

  const currentProgram = sellerPrograms[activeTab];

  // FAQ items
  const faqItems = [
    {
      question: "How much does it cost to become a seller?",
      answer: "Registration as a seller on Next Youth is completely free. We operate on a commission-based model, where we only earn when you do. Our commission rates range from 5% to 20% based on your seller level and total earnings."
    },
    {
      question: "How do I get paid for my services?",
      answer: "We offer multiple payment options including direct bank transfer, PayPal, Wise, and Payoneer. Once a client approves your work, funds are released to your Next Youth account. You can withdraw your earnings after a 7-day safety period."
    },
    {
      question: "What can I sell on the platform?",
      answer: "You can offer digital services across various categories including graphic design, web development, writing, marketing, video production, music, business consulting, and more. All services must comply with our terms of service."
    },
    {
      question: "How do I handle client communication?",
      answer: "All client communication happens through our secure messaging system. This ensures all project details are documented and provides protection for both sellers and buyers. Video calls can be scheduled through our integrated conference tool."
    },
    {
      question: "What happens if there's a dispute with a client?",
      answer: "We have a dedicated resolution team to handle disputes. If you and a client can't reach an agreement, our team will review the case, including all communication and delivered work, to make a fair decision according to our terms of service."
    }
  ];

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
              <li><Link to="/explore"><i className="fas fa-compass"></i>Explore</Link></li>
              <li><a href="#"><i className="fas fa-globe"></i>English</a></li>
              <li><Link to="/become-seller" className="active"><i className="fas fa-store"></i>Become a Seller</Link></li>
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
            <li className="nav-fade-in"><Link to="/explore" onClick={handleMenuClick}><i className="fas fa-compass"></i>Explore</Link></li>
            <li className="nav-fade-in"><a href="#" onClick={handleMenuClick}><i className="fas fa-globe"></i>English</a></li>
            <li className="nav-fade-in"><Link to="/become-seller" className="active" onClick={handleMenuClick}><i className="fas fa-store"></i>Become a Seller</Link></li>
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

      {/* Become a Seller Content */}
      <div className={`seller-page-container ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Hero Section */}
        <section 
          className="seller-hero" 
          id="seller-hero"
          ref={addToRefs}
        >
          <div className={`seller-hero-content ${isVisible["seller-hero"] ? "seller-animate-in" : ""}`}>
            <h1>Turn Your Skills Into Income</h1>
            <p>Join thousands of professionals selling their services to clients worldwide on Next Youth's global marketplace</p>
            <div className="seller-cta-buttons">
              <Link to="/register?type=seller" className="seller-primary-btn">
                <i className="fas fa-user-plus"></i> Start Selling
              </Link>
              <a href="#how-it-works" className="seller-secondary-btn">
                <i className="fas fa-info-circle"></i> Learn More
              </a>
            </div>
          </div>
          <div className={`seller-hero-stats ${isVisible["seller-hero"] ? "seller-animate-in-delay" : ""}`}>
            <div className="seller-stat">
              <span className="seller-stat-number">15M+</span>
              <span className="seller-stat-text">Active Buyers</span>
            </div>
            <div className="seller-stat">
              <span className="seller-stat-number">$2.5B+</span>
              <span className="seller-stat-text">Seller Earnings</span>
            </div>
            <div className="seller-stat">
              <span className="seller-stat-number">160+</span>
              <span className="seller-stat-text">Countries</span>
            </div>
          </div>
        </section>

        {/* Why Sell With Us Section */}
        <section 
          className="seller-why-us" 
          id="seller-why-us"
          ref={addToRefs}
        >
          <div className={`section-title ${isVisible["seller-why-us"] ? "seller-animate-in" : ""}`}>
            <h2>Why Sell With Next Youth?</h2>
            <p>Join a platform designed with seller success in mind</p>
          </div>

          <div className={`seller-benefits-grid ${isVisible["seller-why-us"] ? "seller-animate-in" : ""}`}>
            <div className="seller-benefit-card">
              <div className="seller-benefit-icon">
                <i className="fas fa-globe-americas"></i>
              </div>
              <h3>Global Marketplace</h3>
              <p>Access millions of buyers from around the world looking for your specific skills and services.</p>
            </div>
            
            <div className="seller-benefit-card">
              <div className="seller-benefit-icon">
                <i className="fas fa-wallet"></i>
              </div>
              <h3>Zero Startup Cost</h3>
              <p>Create your seller profile for free and only pay when you make a sale with our commission-based model.</p>
            </div>
            
            <div className="seller-benefit-card">
              <div className="seller-benefit-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Secure Payments</h3>
              <p>Our secure payment system ensures you get paid for every completed project with protection for sellers.</p>
            </div>
            
            <div className="seller-benefit-card">
              <div className="seller-benefit-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <h3>Growth Tools</h3>
              <p>Access analytics, marketing tools, and resources designed to help you grow your freelance business.</p>
            </div>
            
            <div className="seller-benefit-card">
              <div className="seller-benefit-icon">
                <i className="fas fa-certificate"></i>
              </div>
              <h3>Seller Levels</h3>
              <p>Advance through our seller levels system to unlock benefits like higher visibility and lower fees.</p>
            </div>
            
            <div className="seller-benefit-card">
              <div className="seller-benefit-icon">
                <i className="fas fa-headset"></i>
              </div>
              <h3>24/7 Support</h3>
              <p>Dedicated seller support team available around the clock to help resolve any issues.</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section 
          className="seller-how-works" 
          id="how-it-works"
          ref={addToRefs}
        >
          <div className={`section-title ${isVisible["how-it-works"] ? "seller-animate-in" : ""}`}>
            <h2>How It Works</h2>
            <p>Start selling your services in just four simple steps</p>
          </div>

          <div className={`seller-steps ${isVisible["how-it-works"] ? "seller-animate-in" : ""}`}>
            <div className="seller-step">
              <div className="seller-step-number">1</div>
              <div className="seller-step-content">
                <h3>Create Your Profile</h3>
                <p>Sign up and build your professional seller profile highlighting your skills, experience, and portfolio.</p>
              </div>
            </div>
            
            <div className="seller-step">
              <div className="seller-step-number">2</div>
              <div className="seller-step-content">
                <h3>Create Your Services</h3>
                <p>Set up your service listings with clear descriptions, pricing, and delivery timeframes.</p>
              </div>
            </div>
            
            <div className="seller-step">
              <div className="seller-step-number">3</div>
              <div className="seller-step-content">
                <h3>Receive Orders</h3>
                <p>As buyers discover your services, they'll place orders through our secure platform.</p>
              </div>
            </div>
            
            <div className="seller-step">
              <div className="seller-step-number">4</div>
              <div className="seller-step-content">
                <h3>Deliver & Get Paid</h3>
                <p>Complete projects, deliver to your clients, and receive payment directly to your account.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Seller Programs Section */}
        <section 
          className="seller-programs" 
          id="seller-programs"
          ref={addToRefs}
        >
          <div className={`section-title ${isVisible["seller-programs"] ? "seller-animate-in" : ""}`}>
            <h2>Seller Programs</h2>
            <p>Choose the program that fits your business model</p>
          </div>

          <div className="seller-tabs">
            <div className="seller-tab-buttons">
              <button 
                className={activeTab === "freelancer" ? "active" : ""}
                onClick={() => setActiveTab("freelancer")}
              >
                <i className="fas fa-user-tie"></i>
                Freelancer
              </button>
              <button 
                className={activeTab === "agency" ? "active" : ""}
                onClick={() => setActiveTab("agency")}
              >
                <i className="fas fa-users"></i>
                Agency
              </button>
              <button 
                className={activeTab === "enterprise" ? "active" : ""}
                onClick={() => setActiveTab("enterprise")}
              >
                <i className="fas fa-building"></i>
                Enterprise
              </button>
            </div>

            <div className="seller-tab-content">
              <div className={`seller-tab-pane ${isVisible["seller-programs"] ? "seller-animate-in" : ""}`}>
                <h3>{currentProgram.title}</h3>
                <p>{currentProgram.description}</p>
                
                <div className="seller-features-grid">
                  {currentProgram.features.map((feature, index) => (
                    <div className="seller-feature-card" key={index}>
                      <div className="seller-feature-icon">
                        <i className={`fas fa-${feature.icon}`}></i>
                      </div>
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                    </div>
                  ))}
                </div>
                
                <div className="seller-testimonial">
                  <div className="seller-testimonial-content">
                    <i className="fas fa-quote-left"></i>
                    <p>{currentProgram.testimonial.quote}</p>
                    <div className="seller-testimonial-author">
                      <div className="seller-author-image">
                        <img src={currentProgram.testimonial.image} alt={currentProgram.testimonial.author} />
                      </div>
                      <div className="seller-author-details">
                        <h5>{currentProgram.testimonial.author}</h5>
                        <span>{currentProgram.testimonial.profession}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories Section */}
        <section 
          className="seller-success" 
          id="seller-success"
          ref={addToRefs}
        >
          <div className={`section-title ${isVisible["seller-success"] ? "seller-animate-in" : ""}`}>
            <h2>Success Stories</h2>
            <p>Meet sellers who've transformed their careers on Next Youth</p>
          </div>

          <div className={`seller-stories-grid ${isVisible["seller-success"] ? "seller-animate-in" : ""}`}>
            <div className="seller-story-card">
              <div className="seller-story-header">
                <div className="seller-story-image">
                  <img src={sellerJohnImg} alt="John Miller" />
                </div>
                <div className="seller-story-info">
                  <h4>John Miller</h4>
                  <span>Graphic Designer</span>
                </div>
                <div className="seller-earnings">
                  <span>$150K+</span>
                  <small>Annual Earnings</small>
                </div>
              </div>
              <p>"I started freelancing part-time while working at a corporate job. Within a year on Next Youth, I was making enough to quit and work full-time as a freelancer. Now I run my own design agency with 5 team members."</p>
            </div>
            
            <div className="seller-story-card">
              <div className="seller-story-header">
                <div className="seller-story-image">
                  <img src={sellerMayaImg} alt="Maya Wilson" />
                </div>
                <div className="seller-story-info">
                  <h4>Maya Wilson</h4>
                  <span>Content Creator</span>
                </div>
                <div className="seller-earnings">
                  <span>$95K+</span>
                  <small>Annual Earnings</small>
                </div>
              </div>
              <p>"Next Youth helped me turn my writing hobby into a thriving business. I've worked with clients from over 20 countries, and I've been able to build a reliable income stream that supports my family while doing what I love."</p>
            </div>
            
            <div className="seller-story-card">
              <div className="seller-story-header">
                <div className="seller-story-image">
                  <img src={sellerDavidImg} alt="David Chang" />
                </div>
                <div className="seller-story-info">
                  <h4>David Chang</h4>
                  <span>Web Developer</span>
                </div>
                <div className="seller-earnings">
                  <span>$200K+</span>
                  <small>Annual Earnings</small>
                </div>
              </div>
              <p>"From a solo developer to a team of 12, my journey on Next Youth has been incredible. The platform's tools helped me scale my business exponentially, and now we work with some of the biggest names in tech."</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section 
          className="seller-faq" 
          id="seller-faq"
          ref={addToRefs}
        >
          <div className={`section-title ${isVisible["seller-faq"] ? "seller-animate-in" : ""}`}>
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about selling on Next Youth</p>
          </div>

          <div 
            className={`seller-faq-container ${isVisible["seller-faq"] ? "seller-animate-in" : ""}`}
            ref={faqContainerRef}
          >
            {faqItems.map((item, index) => (
              <div className="seller-faq-item" key={index}>
                <div className="seller-faq-question">
                  <h3>{item.question}</h3>
                  <i className="fas fa-chevron-down"></i>
                </div>
                <div className="seller-faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section 
          className="seller-cta" 
          id="seller-cta"
          ref={addToRefs}
        >
          <div className={`seller-cta-container ${isVisible["seller-cta"] ? "seller-animate-in" : ""}`}>
            <h2>Ready to start earning with your skills?</h2>
            <p>Join our community of professional sellers and reach clients from around the world</p>
            <Link to="/register?type=seller" className="seller-primary-btn">
              <i className="fas fa-rocket"></i> Become a Seller Today
            </Link>
            <div className="seller-cta-note">
              <i className="fas fa-info-circle"></i>
              <span>Free registration, no upfront costs - you only pay when you earn</span>
            </div>
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

      {/* Toast notification for theme toggle */}
      {showToast && (
        <div className="toast show">
          <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default BecomeSeller;
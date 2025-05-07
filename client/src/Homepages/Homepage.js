import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Homepage.css";
import { initFaqToggle } from "../utils/faqToggle"; // Add this import
import heroImage from '../assets/images/hero.jpg';
import logoLight from '../assets/images/logo-light.png';
import logoDark from '../assets/images/logo-dark.png';
import featureImage from '../assets/images/feature.jpg';
import testimonial1 from '../assets/images/testimonial-1.jpg';
import testimonial2 from '../assets/images/testimonial-2.jpg';
import testimonial3 from '../assets/images/testimonial-3.jpg';
import testimonial4 from '../assets/images/testimonial-4.jpg';

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);
  const faqContainerRef = useRef(null); // Add this ref

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

  // Add scroll progress indicator
  useEffect(() => {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    const updateProgress = () => {
      const scrollPosition = window.scrollY;
      const totalHeight = document.body.scrollHeight - window.innerHeight;
      const progress = (scrollPosition / totalHeight) * 100;
      progressBar.style.width = `${progress}%`;
    };
    
    window.addEventListener('scroll', updateProgress);
    
    return () => {
      window.removeEventListener('scroll', updateProgress);
      if (progressBar.parentNode) {
        document.body.removeChild(progressBar);
      }
    };
  }, []);

  // Add ripple effect to buttons
  useEffect(() => {
    const buttons = document.querySelectorAll('.search-button, .signup, .login');
    
    const createRipple = (event) => {
      const button = event.currentTarget;
      
      const circle = document.createElement('span');
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      const rect = button.getBoundingClientRect();
      
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${event.clientX - rect.left - radius}px`;
      circle.style.top = `${event.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');
      
      const ripple = button.querySelector('.ripple');
      if (ripple) {
        ripple.remove();
      }
      
      button.appendChild(circle);
      
      // Remove ripple after animation
      setTimeout(() => {
        if (circle && circle.parentNode) {
          circle.parentNode.removeChild(circle);
        }
      }, 600);
    };
    
    buttons.forEach(button => {
      button.addEventListener('click', createRipple);
    });
    
    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', createRipple);
      });
    };
  }, []);

  // Add staggered animation to nav items
  useEffect(() => {
    const navItems = document.querySelectorAll('.desktop-nav ul li, .mobile-menu ul li');
    
    navItems.forEach((item, index) => {
      item.style.animation = `navFadeIn 0.4s forwards ${index * 0.1}s`;
    });
  }, [isMenuOpen]);

  // Add this useEffect after your other useEffect hooks
  useEffect(() => {
    if (faqContainerRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        initFaqToggle(faqContainerRef.current);
      }, 100);
    }
  }, []); // Only run once on mount

  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  // Improved menu handling
  const handleMenuClick = () => {
    // Small delay to ensure the click registers before closing menu
    setTimeout(() => setIsMenuOpen(false), 150);
  };
  
  // Fix for missing toast body click handling
  useEffect(() => {
    const handleBodyScroll = () => {
      document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    };
    
    handleBodyScroll();
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Categories for the services section
  const serviceCategories = [
    { icon: "fa-pencil-alt", title: "Writing & Translation", description: "Quality content from expert writers", count: "12,400+" },
    { icon: "fa-desktop", title: "Web Development", description: "Custom websites and applications", count: "10,250+" },
    { icon: "fa-paint-brush", title: "Graphics & Design", description: "Creative visual solutions for any need", count: "15,780+" },
    { icon: "fa-video", title: "Video & Animation", description: "Engaging video content production", count: "9,630+" },
    { icon: "fa-chart-line", title: "Digital Marketing", description: "Effective strategies for online growth", count: "8,920+" },
    { icon: "fa-music", title: "Music & Audio", description: "Professional sound production", count: "7,450+" },
    { icon: "fa-mobile-alt", title: "Mobile Development", description: "Apps for iOS and Android platforms", count: "6,830+" },
    { icon: "fa-camera", title: "Photography", description: "High-quality images for all purposes", count: "5,240+" }
  ];

  // Testimonials data
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechFlow Inc.",
      content: "Next Youth has transformed how we find talent. The quality of work and response time is exceptional. We've been able to scale our content production by 200% in just three months.",
      avatar: testimonial1
    },
    {
      name: "Michael Chen",
      role: "Startup Founder",
      company: "Innovate Labs",
      content: "As a startup with limited resources, Next Youth has been a game-changer. Access to world-class talent at affordable rates helped us launch faster than expected.",
      avatar: testimonial2
    },
    {
      name: "Emma Rodriguez",
      role: "Creative Director",
      company: "Design Collective",
      content: "The platform's ease of use and quality control measures ensure we always get exceptional work. Our projects are completed on time and exceed expectations.",
      avatar: testimonial3
    },
    {
      name: "David Smith",
      role: "E-commerce Manager",
      company: "ShopSmart",
      content: "Next Youth has been instrumental in our marketing campaigns. The freelancers are professional, and the platform is user-friendly. Highly recommend!",
      avatar: testimonial4
    }

  ];

  // Feature list data
  const features = [
    { icon: "fa-check-circle", text: "Vetted professionals" },
    { icon: "fa-check-circle", text: "Secure payments" },
    { icon: "fa-check-circle", text: "24/7 customer support" },
    { icon: "fa-check-circle", text: "Money-back guarantee" },
    { icon: "fa-check-circle", text: "Quality assurance" },
    { icon: "fa-check-circle", text: "Fast delivery" }
  ];

  return (
    <div className={`homepage-container ${isDarkMode ? 'dark-mode' : ''}`}>
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

      <div className="main-content-container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Find the perfect <span className="highlight">freelance</span> services for your business</h1>
            <p className="hero-subtitle">Connect with talented professionals from around the world to get your projects done quickly and efficiently.</p>
            
            <div className="search-container">
              <input type="text" placeholder="What service are you looking for today?" className="search-input" />
              <button className="search-button">
                <i className="fas fa-search"></i>
                Search
              </button>
            </div>
            
            <div className="popular-searches">
              <span>Popular:</span>
              <a href="#">Website Design</a>
              <a href="#">Logo Design</a>
              <a href="#">Content Writing</a>
              <a href="#">Video Editing</a>
            </div>
          </div>
          
          <div className="hero-image">
            <img src={heroImage} alt="Freelancers working together" />
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="trusted-by-section">
          <h2>Trusted by leading brands and startups</h2>
          <div className="company-logos">
            <div className="company-logo"><i className="fab fa-google"></i> Google</div>
            <div className="company-logo"><i className="fab fa-facebook"></i> Facebook</div>
            <div className="company-logo"><i className="fab fa-paypal"></i> PayPal</div>
            <div className="company-logo"><i className="fab fa-netflix"></i> Netflix</div>
            <div className="company-logo"><i className="fab fa-spotify"></i> Spotify</div>
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section">
          <div className="section-header">
            <h2>Popular Professional Services</h2>
            <p>Explore the boundaries of art and technology with Next Youth's digital services</p>
          </div>
          
          <div className="service-categories">
            {serviceCategories.map((category, index) => (
              <div className="service-card" key={index}>
                <div className="service-icon">
                  <i className={`fas ${category.icon}`}></i>
                </div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <div className="service-stats">
                  <span>{category.count} services</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="how-it-works-section">
          <div className="section-header">
            <h2>How Next Youth Works</h2>
            <p>Get your projects done in just 4 simple steps</p>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-icon">
                <i className="fas fa-search"></i>
              </div>
              <h3>Browse Services</h3>
              <p>Explore thousands of services and find the perfect match for your needs</p>
            </div>
            
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-icon">
                <i className="fas fa-comments"></i>
              </div>
              <h3>Contact Freelancer</h3>
              <p>Discuss project details and requirements directly with professionals</p>
            </div>
            
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-icon">
                <i className="fas fa-credit-card"></i>
              </div>
              <h3>Pay Securely</h3>
              <p>Payment is held securely until you approve the completed work</p>
            </div>
            
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Receive & Review</h3>
              <p>Get your completed project and provide feedback to the freelancer</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="features-content">
            <h2>Why Choose Next Youth</h2>
            <p>Our platform provides everything you need to get quality work done quickly</p>
            
            <div className="feature-list">
              {features.map((feature, index) => (
                <div className="feature-item" key={index}>
                  <i className={`fas ${feature.icon}`}></i>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
            
            <Link to="/register" className="cta-button">
              Get Started <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
          
          <div className="features-image">
            <img src={featureImage} alt="Next Youth features" />
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <div className="section-header">
            <h2>What Our Clients Say</h2>
            <p>Thousands of satisfied customers trust Next Youth for their project needs</p>
          </div>
          
          <div className="testimonials-container">
            {testimonials.map((testimonial, index) => (
              <div className="testimonial-card" key={index}>
                <div className="testimonial-content">
                  <p>"{testimonial.content}"</p>
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <img src={testimonial.avatar} alt={testimonial.name} onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/api/placeholder/50/50";
                    }} />
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>Join thousands of satisfied clients today</h2>
            <p>Find talented professionals to bring your projects to life or offer your services to clients worldwide.</p>
            
            <div className="cta-buttons">
              <Link to="/register" className="cta-primary">
                Join as Client <i className="fas fa-user-plus"></i>
              </Link>
              <Link to="/become-seller" className="cta-secondary">
                Become a Seller <i className="fas fa-store"></i>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <div className="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Find answers to common questions about Next Youth</p>
          </div>
          
          <div className="faq-container" ref={faqContainerRef}>
            <div className="seller-faq-item">
              <div className="seller-faq-question">
                <h3>How do I get started on Next Youth?</h3>
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="seller-faq-answer">
                <p>Simply create an account, browse available services, and place an order with your chosen freelancer. You can also post a project and have freelancers bid on it.</p>
              </div>
            </div>
            
            <div className="seller-faq-item">
              <div className="seller-faq-question">
                <h3>How does payment work?</h3>
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="seller-faq-answer">
                <p>Payments are held securely in escrow until you approve the completed work. This protects both clients and freelancers and ensures quality delivery.</p>
              </div>
            </div>
            
            <div className="seller-faq-item">
              <div className="seller-faq-question">
                <h3>Can I work with the same freelancer again?</h3>
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="seller-faq-answer">
                <p>Absolutely! You can save your favorite freelancers, rehire them for new projects, and build long-term working relationships.</p>
              </div>
            </div>
            
            <div className="seller-faq-item">
              <div className="seller-faq-question">
                <h3>What if I'm not satisfied with the work?</h3>
                <i className="fas fa-chevron-down"></i>
              </div>
              <div className="seller-faq-answer">
                <p>We have a revision policy that allows you to request changes before accepting delivery. If issues persist, our customer support team will help resolve any disputes.</p>
              </div>
            </div>
          </div>
          
          <div className="more-questions">
            <p>Have more questions? <a href="/help-support">Contact our support team</a></p>
          </div>
        </section>
      </div>

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
                <li key={i}><a href="/help-support"><i className={`fas fa-${['question-circle', 'shield-alt', 'store', 'shopping-cart'][i]}`}></i>{item}</a></li>
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

      {/* Toast Notification Component */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        <i className="fas fa-info-circle"></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};

export default Homepage;
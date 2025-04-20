import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);
  const heroRef = useRef(null);

  // Create particles for hero section
  useEffect(() => {
    if (!heroRef.current) return;
    
    const heroSection = heroRef.current;
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'hero-particles';
    heroSection.appendChild(particlesContainer);
    
    // Create particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      
      // Random particle properties
      const size = Math.random() * 5 + 2;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;
      const delay = Math.random() * 5;
      const duration = Math.random() * 10 + 10;
      
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.opacity = Math.random() * 0.5 + 0.1;
      particle.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
      
      particlesContainer.appendChild(particle);
    }
    
    return () => {
      if (heroSection.contains(particlesContainer)) {
        heroSection.removeChild(particlesContainer);
      }
    };
  }, []);

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
  
  // Scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Add staggered delay based on index
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, index * 100);
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.category-card, .service-card, .section-title').forEach(el => {
      el.classList.add('fade-in');
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  // Add parallax effect to service cards - Only on desktop devices
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return; // Skip parallax effect on mobile
    
    const handleMouseMove = (e) => {
      document.querySelectorAll('.service-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const tiltX = (x - centerX) / centerX;
        const tiltY = (y - centerY) / centerY;
        
        if (rect.left <= e.clientX && e.clientX <= rect.right &&
            rect.top <= e.clientY && e.clientY <= rect.bottom) {
          card.style.transform = `perspective(1000px) rotateX(${tiltY * 3}deg) rotateY(${-tiltX * 3}deg) scale3d(1.02, 1.02, 1.02)`;
        } else {
          card.style.transform = '';
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  // Improved typing effect implementation
  useEffect(() => {
    const heroHeading = document.querySelector('.hero h1');
    if (!heroHeading) return;
    
    // First make sure text is visible immediately for users who prefer reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroHeading.textContent = "Find the perfect freelance services for your business";
      heroHeading.classList.remove('typing-effect');
      return;
    }
    
    // Store the original text and clear it
    const originalText = "Find the perfect freelance services for your business";
    heroHeading.textContent = '';
    heroHeading.classList.add('typing-effect');
    
    // Track animation state to prevent duplicate animations
    let isAnimating = true;
    let animationFrame = null;
    
    // Use a more controlled typing approach
    let index = 0;
    let lastTypingTime = 0;
    const typingSpeed = 40; // ms per character
    
    const typeCharacter = (timestamp) => {
      if (!isAnimating) return;
      
      if (!lastTypingTime) lastTypingTime = timestamp;
      
      // Only type a new character if enough time has passed
      if (timestamp - lastTypingTime >= typingSpeed) {
        if (index < originalText.length) {
          // Add exactly one character at a time
          heroHeading.textContent = originalText.substring(0, index + 1);
          index++;
          lastTypingTime = timestamp;
        } else {
          // Typing finished - remove typing effect after a delay
          setTimeout(() => {
            heroHeading.classList.remove('typing-effect');
          }, 1000);
          isAnimating = false;
          return; // Stop animation
        }
      }
      
      // Continue animation
      animationFrame = requestAnimationFrame(typeCharacter);
    };
    
    // Start animation
    animationFrame = requestAnimationFrame(typeCharacter);
    
    return () => {
      // Clean up - cancel animation and set full text if component unmounts during animation
      isAnimating = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      heroHeading.textContent = originalText;
      heroHeading.classList.remove('typing-effect');
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

  return (
    <div className={`homepage-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <header>
        <div className="header-container">
          <div className="logo float">Next Youth</div>
          
          <nav className="desktop-nav">
            <ul>
              <li><a href="#"><i className="fas fa-briefcase"></i>Business Solutions</a></li>
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
            <li className="nav-fade-in"><a href="#" onClick={handleMenuClick}><i className="fas fa-briefcase"></i>Business Solutions</a></li>
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

      <section className="hero" ref={heroRef}>
        <div className="hero-content">
          <h1 className="hero-heading visible-heading">Find the perfect freelance services for your business</h1>
          <p className="float">Join millions of people who commission freelancers on the world's most popular freelance services website.</p>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="What service are you looking for today?" 
              aria-label="Search services"
            />
            <button className="search-button">
              <i className="fas fa-search"></i>Search
            </button>
          </div>
        </div>
      </section>

      <section className="categories">
        <h2 className="section-title">Popular professional services</h2>
        <div className="category-grid">
          {['Logo Design', 'WordPress', 'Voice Over', 'Video Explainer', 'Social Media', 'SEO', 'App Design', 'Video Editing', 'Web Design', 'Digital Marketing'].map((service, index) => (
            <div className="category-card glow-on-hover" key={index}>
              <div className="category-icon">
                <i className={`fas fa-${['pencil-alt', 'wordpress', 'microphone', 'video', 'hashtag', 'chart-line', 'mobile-alt', 'film', 'desktop', 'bullhorn'][index]}`}></i>
              </div>
              <h3>{service}</h3>
              <p>{[
                'Build your brand',
                'Customize your site',
                'Share your message',
                'Engage your audience',
                'Reach more customers',
                'Unlock growth online',
                'Design your app',
                'Edit your videos',
                'Create your website',
                'Promote your business'
              ][index]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="popular-services">
        <div className="services-container">
          <h2 className="section-title">Popular services</h2>
          <div className="services-grid parallax-container">
            {[1, 2, 3, 4].map((item) => (
              <div className="service-card parallax-layer" key={item}>
                <div className="service-image" style={{ backgroundImage: "url('https://source.unsplash.com/random/800x600')" }}>
                  <div className="service-overlay"></div>
                </div>
                <div className="service-info">
                  <div className="seller-info">
                    <div className="seller-avatar">JD</div>
                    <div className="seller-details">
                      <span className="seller-name">John Doe</span>
                      <span className="seller-rating"><i className="fas fa-star"></i>5.0</span>
                    </div>
                  </div>
                  <h3 className="service-title">Professional {['Logo Design', 'Website Development', 'Voice Over', 'Video Editing'][item-1]}</h3>
                  <div className="price">From ${[20, 50, 10, 35][item-1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                <li key={i}><a href="#"><i className={`fas fa-${['question-circle', 'shield-alt', 'store', 'shopping-cart'][i]}`}></i>{item}</a></li>
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
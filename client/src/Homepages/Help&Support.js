import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Homepage.css"; // Import Homepage CSS for header and footer styles
import "./help&Support.css"; // Import specific styles for help and support
import { initFaqToggle } from "../utils/faqToggle"; // Add this import
import logoLight from '../assets/images/logo-light.png';
import logoDark from '../assets/images/logo-dark.png';
// Import support category icons or images as needed

const HelpAndSupport = () => {
  // Header and footer related state (from BusinessSolutions.js)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isVisible, setIsVisible] = useState({});
  const [activeCategory, setActiveCategory] = useState("getting-started");
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);
  const sectionsRef = useRef([]);
  const faqContainerRef = useRef(null);

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

  // FAQ functionality
  const toggleFaqItem = (item, faqItems) => {
    const isActive = item.classList.contains('active');
    const question = item.querySelector('.hs-faq-question');
    const icon = question.querySelector('i');
    
    // Close all other FAQ items
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
        const otherIcon = otherItem.querySelector('.hs-faq-question i');
        if (otherIcon) otherIcon.className = "fas fa-chevron-down";
      }
    });
    
    // Toggle current item
    if (isActive) {
      item.classList.remove('active');
      icon.className = "fas fa-chevron-down";
    } else {
      item.classList.add('active');
      icon.className = "fas fa-chevron-up";
    }
  };

  useEffect(() => {
    // Use a slightly longer delay to ensure DOM is fully updated
    const timer = setTimeout(() => {
      if (faqContainerRef.current) {
        const faqItems = faqContainerRef.current.querySelectorAll('.hs-faq-item');
        
        // Set up new listeners
        faqItems.forEach(item => {
          const question = item.querySelector('.hs-faq-question');
          if (!question) return;
          
          // Clean up by cloning and replacing to remove any existing listeners
          const newQuestion = question.cloneNode(true);
          question.parentNode.replaceChild(newQuestion, question);
          
          // Add fresh event listener
          newQuestion.addEventListener('click', () => {
            toggleFaqItem(item, faqItems);
          });
        });
      }
    }, 200); // Slightly longer delay for DOM to fully update
    
    return () => clearTimeout(timer);
  }, [activeCategory]); // Re-run when activeCategory changes

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

  // Support categories data
  const supportCategories = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "rocket",
      description: "Learn the basics of using Next Youth platform"
    },
    {
      id: "account",
      title: "Account & Settings",
      icon: "user-cog",
      description: "Manage your account, privacy, and security settings"
    },
    {
      id: "payments",
      title: "Payments & Billing",
      icon: "credit-card",
      description: "Payment methods, invoices, and billing questions"
    },
    {
      id: "orders",
      title: "Orders & Deliveries",
      icon: "shopping-cart",
      description: "Managing your orders, revisions, and deliveries"
    },
    {
      id: "sellers",
      title: "For Sellers",
      icon: "store",
      description: "How to sell your services and manage your gigs"
    },
    {
      id: "security",
      title: "Security & Privacy",
      icon: "shield-alt",
      description: "Keep your account and information secure"
    }
  ];

  // FAQ data for each category
  const faqData = {
    "getting-started": [
      {
        question: "How do I create an account on Next Youth?",
        answer: "To create an account, click on the 'Sign Up' button in the top right corner of the homepage. You can sign up using your email address or through your Google, Facebook, or Apple account."
      },
      {
        question: "What can I do on Next Youth?",
        answer: "Next Youth allows you to hire freelance professionals for various services like graphic design, web development, writing, marketing, and more. You can also offer your own services if you're a professional looking for clients."
      },
      {
        question: "Is Next Youth free to use?",
        answer: "Creating an account and browsing services on Next Youth is completely free. Next Youth charges a service fee only when you make a purchase or earn money as a seller."
      }
    ],
    "account": [
      {
        question: "How do I change my password?",
        answer: "Go to your account settings by clicking on your profile picture in the top right corner, then select 'Settings'. Under the 'Security' tab, you can change your password."
      },
      {
        question: "Can I change my username?",
        answer: "Yes, you can change your username once every 30 days. Go to your account settings and update your username in the 'Profile' section."
      },
      {
        question: "How do I delete my account?",
        answer: "To delete your account, go to your account settings, scroll down to the bottom of the page, and click on 'Delete Account'. Please note that this action is irreversible."
      }
    ],
    "payments": [
      {
        question: "What payment methods are accepted?",
        answer: "Next Youth accepts major credit/debit cards, PayPal, and bank transfers in select countries. The available payment methods may vary depending on your location."
      },
      {
        question: "Is it safe to pay through Next Youth?",
        answer: "Yes, all payments on Next Youth are secure. We use industry-standard encryption and security measures to protect your financial information."
      },
      {
        question: "How do refunds work?",
        answer: "If you're not satisfied with a service, you can request a refund within the specified timeframe, usually 14 days. Each case is reviewed according to our refund policy."
      }
    ],
    "orders": [
      {
        question: "How do I place an order?",
        answer: "To place an order, browse for a service you need, click on it to view details, then click the 'Continue' or 'Order Now' button. Follow the steps to specify your requirements and complete the payment."
      },
      {
        question: "Can I modify my order after placing it?",
        answer: "You can discuss modifications with the seller. If they agree, they may accommodate small changes. For significant changes, you may need to cancel and place a new order or purchase additional services."
      },
      {
        question: "What if I need revisions?",
        answer: "Most sellers include a certain number of revisions in their packages. You can request revisions within the delivery page until you're satisfied with the work, within the seller's revision policy."
      }
    ],
    "sellers": [
      {
        question: "How do I become a seller?",
        answer: "Click on 'Become a Seller' in the navigation menu and complete your seller profile. Once approved, you can create gigs (service offerings) for buyers to purchase."
      },
      {
        question: "How much can I earn?",
        answer: "Earnings vary based on your skills, services, and pricing. You set your own rates, and Next Youth takes a service fee from each completed order."
      },
      {
        question: "When do I get paid for completed work?",
        answer: "After delivering your work and it's accepted by the buyer, the payment will be available for withdrawal after a safety period (usually 14 days). You can withdraw your earnings through the available payment methods."
      }
    ],
    "security": [
      {
        question: "How does Next Youth protect my data?",
        answer: "We employ industry-standard security measures including encryption, secure server protocols, and regular security audits to protect your personal and financial information."
      },
      {
        question: "What should I do if I notice suspicious activity?",
        answer: "If you notice any suspicious activity on your account, immediately change your password and contact our support team at support@nextyouth.com."
      },
      {
        question: "Does Next Youth verify users?",
        answer: "We have various verification processes in place, including email verification and identity verification for sellers. We also use fraud detection systems to maintain platform security."
      }
    ]
  };

  // Contact methods
  const contactMethods = [
    {
      icon: "ticket-alt",
      title: "Submit a Ticket",
      description: "Get help from our support team",
      link: "/contact?type=support"
    },
    {
      icon: "comments",
      title: "Live Chat",
      description: "Chat with our support agents",
      link: "/chat-support"
    },
    {
      icon: "envelope",
      title: "Email Support",
      description: "Email us at support@nextyouth.com",
      link: "mailto:support@nextyouth.com"
    },
    {
      icon: "phone-alt",
      title: "Phone Support",
      description: "Available Mon-Fri, 9am-5pm",
      link: "tel:+18005551234"
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

      {/* Help & Support Content */}
      <div className={`hs-container ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Hero Section */}
        <section 
          className="hs-hero" 
          id="hs-hero"
          ref={addToRefs}
        >
          <div className={`hs-hero-content ${isVisible["hs-hero"] ? "hs-animate-in" : ""}`}>
            <h1>Help & Support</h1>
            <p>Find answers to your questions and get the help you need</p>
            
            <div className="hs-search-container">
              <input type="text" placeholder="Search for help topics..." className="hs-search-input" />
              <button className="hs-search-button">
                <i className="fas fa-search"></i>
                Search
              </button>
            </div>
          </div>
        </section>

        {/* Support Categories */}
        <section 
          className="hs-categories" 
          id="hs-categories"
          ref={addToRefs}
        >
          <div className={`hs-section-title ${isVisible["hs-categories"] ? "hs-animate-in" : ""}`}>
            <h2>Browse Support Topics</h2>
            <p>Select a category to find the help you need</p>
          </div>

          <div className="hs-categories-grid">
            {supportCategories.map((category, index) => (
              <div 
                className={`hs-category-card ${activeCategory === category.id ? "active" : ""}`} 
                key={index}
                onClick={() => {
                  setActiveCategory(category.id);
                  // Force any open FAQ items to close when changing categories
                  if (faqContainerRef.current) {
                    const faqItems = faqContainerRef.current.querySelectorAll('.hs-faq-item');
                    faqItems.forEach(item => {
                      item.classList.remove('active');
                      const icon = item.querySelector('.hs-faq-question i');
                      if (icon) icon.className = "fas fa-chevron-down";
                    });
                  }
                }}
              >
                <div className="hs-category-icon">
                  <i className={`fas fa-${category.icon}`}></i>
                </div>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs Section */}
        <section 
          className="hs-faqs" 
          id="hs-faqs"
          ref={addToRefs}
        >
          <div className={`hs-section-title ${isVisible["hs-faqs"] ? "hs-animate-in" : ""}`}>
            <h2>Frequently Asked Questions</h2>
            <p>{supportCategories.find(cat => cat.id === activeCategory)?.title}: Common Questions</p>
          </div>

          {/* Add key={activeCategory} to force complete re-render when category changes */}
          <div className="hs-faq-container" ref={faqContainerRef} key={activeCategory}>
            {faqData[activeCategory]?.map((item, index) => (
              <div className="hs-faq-item" key={index}>
                <div className="hs-faq-question">
                  <h3>{item.question}</h3>
                  <i className="fas fa-chevron-down"></i>
                </div>
                <div className="hs-faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Options */}
        <section 
          className="hs-contact" 
          id="hs-contact"
          ref={addToRefs}
        >
          <div className={`hs-section-title ${isVisible["hs-contact"] ? "hs-animate-in" : ""}`}>
            <h2>Still Need Help?</h2>
            <p>Get in touch with our support team</p>
          </div>

          <div className="hs-contact-grid">
            {contactMethods.map((method, index) => (
              <a href={method.link} className="hs-contact-card" key={index}>
                <div className="hs-contact-icon">
                  <i className={`fas fa-${method.icon}`}></i>
                </div>
                <h3>{method.title}</h3>
                <p>{method.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* Resources Section */}
        <section 
          className="hs-resources" 
          id="hs-resources"
          ref={addToRefs}
        >
          <div className={`hs-section-title ${isVisible["hs-resources"] ? "hs-animate-in" : ""}`}>
            <h2>Additional Resources</h2>
            <p>Helpful guides and documentation</p>
          </div>

          <div className="hs-resources-grid">
            <div className="hs-resource-card">
              <div className="hs-resource-icon">
                <i className="fas fa-book"></i>
              </div>
              <h3>User Guide</h3>
              <p>Complete guide to using Next Youth platform</p>
              <a href="/resources/user-guide" className="hs-resource-link">View Guide <i className="fas fa-arrow-right"></i></a>
            </div>

            <div className="hs-resource-card">
              <div className="hs-resource-icon">
                <i className="fas fa-video"></i>
              </div>
              <h3>Video Tutorials</h3>
              <p>Step-by-step visual guides for all features</p>
              <a href="/resources/tutorials" className="hs-resource-link">Watch Videos <i className="fas fa-arrow-right"></i></a>
            </div>

            <div className="hs-resource-card">
              <div className="hs-resource-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3>API Documentation</h3>
              <p>Technical documentation for developers</p>
              <a href="/resources/api-docs" className="hs-resource-link">Read Docs <i className="fas fa-arrow-right"></i></a>
            </div>

            <div className="hs-resource-card">
              <div className="hs-resource-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <h3>Tips & Tricks</h3>
              <p>Best practices to maximize your experience</p>
              <a href="/resources/tips" className="hs-resource-link">Learn More <i className="fas fa-arrow-right"></i></a>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section 
          className="hs-community" 
          id="hs-community"
          ref={addToRefs}
        >
          <div className={`hs-community-container ${isVisible["hs-community"] ? "hs-animate-in" : ""}`}>
            <h2>Join Our Community</h2>
            <p>Connect with other users, share experiences, and get advice from the Next Youth community</p>
            <div className="hs-community-buttons">
              <a href="/community/forum" className="hs-primary-btn">Visit Forum <i className="fas fa-users"></i></a>
              <a href="/community/events" className="hs-secondary-btn">Upcoming Events <i className="fas fa-calendar-alt"></i></a>
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

      {/* Toast Notification */}
      <div className={`toast ${showToast ? 'show' : ''}`}>
        <i className="fas fa-info-circle"></i>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
};

export default HelpAndSupport;
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Homepage.css";

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  }, [isMenuOpen]);

  const handleMenuClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="homepage-container">
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo">Next Youth</div>
          
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
          
          <nav className="desktop-nav">
            <ul>
              <li><a href="#"><i className="fas fa-briefcase"></i>Business Solutions</a></li>
              <li><a href="#"><i className="fas fa-compass"></i>Explore</a></li>
              <li><a href="#"><i className="fas fa-globe"></i>English</a></li>
              <li><a href="#"><i className="fas fa-store"></i>Become a Seller</a></li>
            </ul>
          </nav>
          
          <div className="auth-buttons">
            <Link to="/login" className="login"><i className="fas fa-sign-in-alt"></i>Log In</Link>
            <Link to="/register" className="signup"><i className="fas fa-user-plus"></i>Sign Up</Link>
          </div>
        </div>
        
        <div 
          ref={menuRef}
          className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}
          aria-hidden={!isMenuOpen}
        >
          <ul onClick={handleMenuClick}>
            <li><a href="#"><i className="fas fa-briefcase"></i>Business Solutions</a></li>
            <li><a href="#"><i className="fas fa-compass"></i>Explore</a></li>
            <li><a href="#"><i className="fas fa-globe"></i>English</a></li>
            <li><a href="#"><i className="fas fa-store"></i>Become a Seller</a></li>
            <li><Link to="/login" className="login"><i className="fas fa-sign-in-alt"></i>Log In</Link></li>
            <li><Link to="/register" className="signup"><i className="fas fa-user-plus"></i>Sign Up</Link></li>
          </ul>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Find the perfect freelance services for your business</h1>
          <p>Join millions of people who commission freelancers on the world's most popular freelance services website.</p>
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

      {/* Categories Section */}
      <section className="categories">
        <h2 className="section-title">Popular professional services</h2>
        <div className="category-grid">
          {['Logo Design', 'WordPress', 'Voice Over', 'Video Explainer', 'Social Media', 'SEO'].map((service, index) => (
            <div className="category-card" key={index}>
              <div className="category-icon">
                <i className={`fas fa-${['pencil-alt', 'wordpress', 'microphone', 'video', 'hashtag', 'chart-line'][index]}`}></i>
              </div>
              <h3>{service}</h3>
              <p>{[
                'Build your brand',
                'Customize your site',
                'Share your message',
                'Engage your audience',
                'Reach more customers',
                'Unlock growth online'
              ][index]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="popular-services">
        <div className="services-container">
          <h2 className="section-title">Popular services</h2>
          <div className="services-grid">
            {[1, 2, 3].map((item) => (
              <div className="service-card" key={item}>
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
                  <h3 className="service-title">Professional {['Logo Design', 'Website Development', 'Voice Over'][item-1]}</h3>
                  <div className="price">From ${[20, 50, 10][item-1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
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
            <a href="https://facebook.com"><i className="fab fa-facebook"></i></a>
            <a href="https://twitter.com"><i className="fab fa-twitter"></i></a>
            <a href="https://instagram.com"><i className="fab fa-instagram"></i></a>
            <a href="https://linkedin.com"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
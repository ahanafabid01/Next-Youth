import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import "./Homepage.css"; // Ensure this file contains the styles from the <style> tag

const Homepage = () => {
  return (
    <div>
      {/* Header */}
      <header>
        <div className="header-container">
          <div className="logo">Next Youth</div>
          <nav>
            <ul>
              <li><a href="#">Business Solutions</a></li>
              <li><a href="#">Explore</a></li>
              <li><a href="#">English</a></li>
              <li><a href="#">Become a Seller</a></li>
            </ul>
          </nav>
          <div className="auth-buttons">
            <Link to="/login" className="login">Log In</Link> {/* Navigate to Login */}
            <Link to="/register" className="signup">Sign Up</Link> {/* Navigate to Register */}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1>Find the perfect freelance services for your business</h1>
        <p>Join millions of people who commission freelancers on the world's most popular freelance services website.</p>
        <div className="search-bar">
          <input type="text" placeholder="What service are you looking for today?" />
          <button>Search</button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <h2 className="section-title">Popular professional services</h2>
        <div className="category-grid">
          <div className="category-card">
            <h3>Logo Design</h3>
            <p>Build your brand</p>
          </div>
          <div className="category-card">
            <h3>WordPress</h3>
            <p>Customize your site</p>
          </div>
          <div className="category-card">
            <h3>Voice Over</h3>
            <p>Share your message</p>
          </div>
          <div className="category-card">
            <h3>Video Explainer</h3>
            <p>Engage your audience</p>
          </div>
          <div className="category-card">
            <h3>Social Media</h3>
            <p>Reach more customers</p>
          </div>
          <div className="category-card">
            <h3>SEO</h3>
            <p>Unlock growth online</p>
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="popular-services">
        <div className="services-container">
          <h2 className="section-title">Popular services</h2>
          <div className="services-grid">
            <div className="service-card">
              <div
                className="service-image"
                style={{ backgroundImage: "url('https://via.placeholder.com/300x200')" }}
              ></div>
              <div className="service-info">
                <div className="seller-info">
                  <div className="seller-avatar"></div>
                  <span>username</span>
                </div>
                <h3 className="service-title">I will design a professional logo for your business</h3>
                <div className="rating">★★★★★ (123)</div>
                <div className="price">From $20</div>
              </div>
            </div>
            <div className="service-card">
              <div
                className="service-image"
                style={{ backgroundImage: "url('https://via.placeholder.com/300x200')" }}
              ></div>
              <div className="service-info">
                <div className="seller-info">
                  <div className="seller-avatar"></div>
                  <span>username</span>
                </div>
                <h3 className="service-title">I will create a wordpress website for you</h3>
                <div className="rating">★★★★☆ (98)</div>
                <div className="price">From $50</div>
              </div>
            </div>
            <div className="service-card">
              <div
                className="service-image"
                style={{ backgroundImage: "url('https://via.placeholder.com/300x200')" }}
              ></div>
              <div className="service-info">
                <div className="seller-info">
                  <div className="seller-avatar"></div>
                  <span>username</span>
                </div>
                <h3 className="service-title">I will record professional voice over for your project</h3>
                <div className="rating">★★★★★ (215)</div>
                <div className="price">From $10</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-container">
          <div className="footer-column">
            <h3>Categories</h3>
            <ul>
              <li><a href="#">Graphics & Design</a></li>
              <li><a href="#">Digital Marketing</a></li>
              <li><a href="#">Writing & Translation</a></li>
              <li><a href="#">Video & Animation</a></li>
              <li><a href="#">Music & Audio</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>About</h3>
            <ul>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Press & News</a></li>
              <li><a href="#">Partnerships</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Support</h3>
            <ul>
              <li><a href="#">Help & Support</a></li>
              <li><a href="#">Trust & Safety</a></li>
              <li><a href="#">Selling on Fiverr</a></li>
              <li><a href="#">Buying on Fiverr</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Community</h3>
            <ul>
              <li><a href="#">Events</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Forum</a></li>
              <li><a href="#">Podcast</a></li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <span>© 2025 Next-Youth Marketplace</span>
          <div className="social-icons">
            <a href="https://facebook.com">FB</a>
            <a href="https://twitter.com">TW</a>
            <a href="https://instagram.com">IG</a>
            <a href="https://linkedin.com">LI</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
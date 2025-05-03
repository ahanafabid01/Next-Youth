import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  const handleNavClick = (section) => {
    // Handle navigation click
  };

  return (
    <div>
      <nav>
        <ul className="nav">
          <li className="nav-item">
            <a onClick={() => handleNavClick("features")} className="nav-link" href="#features">Features</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("about")} className="nav-link" href="#about">About</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("contact")} className="nav-link" href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <div className="dropdown-menu">
        <a onClick={() => handleNavClick("features")} className="dropdown-item" href="#features">Features</a>
        <a onClick={() => handleNavClick("about")} className="dropdown-item" href="#about">About</a>
        <a onClick={() => handleNavClick("contact")} className="dropdown-item" href="#contact">Contact</a>
      </div>

      <footer>
        <a href="/privacy-policy" className="text-white text-decoration-none">Privacy Policy</a>
        <a href="/terms-of-service" className="text-white text-decoration-none">Terms of Service</a>
        <a href="/contact" className="text-white text-decoration-none">Contact Us</a>
        <a href="/faq" className="text-white text-decoration-none">FAQ</a>
      </footer>
    </div>
  );
};

export default Homepage;
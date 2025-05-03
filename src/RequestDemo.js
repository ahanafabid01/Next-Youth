import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const RequestDemo = () => {
  const sectionsRef = useRef({});

  const handleIntersection = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Handle intersection
      }
    });
  };

  const handleNavClick = (section) => {
    const sectionElement = sectionsRef.current[section];
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const currentSections = sectionsRef.current;
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.3,
    });

    if (currentSections) {
      Object.values(currentSections).forEach((section) => {
        if (section) observer.observe(section);
      });
    }

    return () => {
      if (currentSections) {
        Object.values(currentSections).forEach((section) => {
          if (section) observer.unobserve(section);
        });
      }
    };
  }, []);

  return (
    <div>
      <nav>
        <ul>
          <li className="nav-item">
            <a onClick={() => handleNavClick("features")} className="nav-link" href="#features">Features</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("pricing")} className="nav-link" href="#pricing">Pricing</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("contact")} className="nav-link" href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <div className="dropdown-menu">
        <a onClick={() => handleNavClick("features")} className="dropdown-item" href="#features">Features</a>
        <a onClick={() => handleNavClick("pricing")} className="dropdown-item" href="#pricing">Pricing</a>
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

export default RequestDemo;
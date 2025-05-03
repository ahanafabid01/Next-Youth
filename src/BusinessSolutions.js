import React, { useEffect, useRef } from 'react';
import { useState } from 'react';

const BusinessSolutions = () => {
  const sectionsRef = useRef({});

  const handleIntersection = (entries) => {
    // ...existing code...
  };

  const handleNavClick = (section) => {
    // ...existing code...
  };

  // Fix useEffect cleanup
  useEffect(() => {
    // Store the ref value in a variable for use in cleanup
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

  // Fix href attributes in navigation
  return (
    <div>
      <nav>
        <ul>
          <li className="nav-item">
            <a onClick={() => handleNavClick("solutions")} className="nav-link" href="#solutions">Solutions</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("process")} className="nav-link" href="#process">Our Process</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("contact")} className="nav-link" href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <div className="dropdown">
        <a onClick={() => handleNavClick("solutions")} className="dropdown-item" href="#solutions">Solutions</a>
        <a onClick={() => handleNavClick("process")} className="dropdown-item" href="#process">Process</a>
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

export default BusinessSolutions;
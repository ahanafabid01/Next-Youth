import React, { useEffect, useRef } from 'react';

const Contact = () => {
  const sectionsRef = useRef({});

  const handleIntersection = (entries) => {
    // Intersection logic
  };

  const handleNavClick = (section) => {
    // Navigation click logic
  };

  // Fix useEffect cleanup function
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
          {/* Fix navigation links */}
          <li className="nav-item">
            <a onClick={() => handleNavClick("about")} className="nav-link" href="#about">About</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("services")} className="nav-link" href="#services">Services</a>
          </li>
          <li className="nav-item">
            <a onClick={() => handleNavClick("contact")} className="nav-link" href="#contact">Contact</a>
          </li>
        </ul>
      </nav>

      <div className="dropdown-menu">
        {/* Fix dropdown menu links */}
        <a onClick={() => handleNavClick("about")} className="dropdown-item" href="#about">About</a>
        <a onClick={() => handleNavClick("services")} className="dropdown-item" href="#services">Services</a>
        <a onClick={() => handleNavClick("contact")} className="dropdown-item" href="#contact">Contact</a>
      </div>

      <footer>
        {/* Fix footer links */}
        <a href="/company" className="text-white">Company</a>
        <a href="/privacy" className="text-white">Privacy Policy</a>
        <a href="/terms" className="text-white">Terms of Service</a>
        <a href="/support" className="text-white">Support</a>
        <a href="/faq" className="text-white">FAQ</a>
        <a href="/products" className="text-white">Products</a>
        <a href="/services" className="text-white">Services</a>
        <a href="/solutions" className="text-white">Solutions</a>
        <a href="/case-studies" className="text-white">Case Studies</a>
        <a href="/partnerships" className="text-white">Partnerships</a>
        <a href="/careers" className="text-white">Careers</a>
        <a href="/press" className="text-white">Press Releases</a>
        <a href="/blog" className="text-white">Blog</a>
        <a href="/investor-relations" className="text-white">Investor Relations</a>
        <a href="/sustainability" className="text-white">Sustainability</a>
        <a href="/events" className="text-white">Events</a>
        <a href="/news" className="text-white">News</a>
        <a href="https://facebook.com" className="text-white">Facebook</a>
        <a href="https://twitter.com" className="text-white">Twitter</a>
        <a href="https://linkedin.com" className="text-white">LinkedIn</a>
      </footer>
    </div>
  );
};

export default Contact;
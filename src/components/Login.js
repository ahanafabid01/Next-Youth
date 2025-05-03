import React, { useEffect, useRef, useState } from 'react';
import './Login.css';

const Login = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const canvas = useRef(null);
  let animationFrameId;

  const createParticles = () => {
    // Particle creation logic
  };

  const handleResize = () => {
    // Resize handling logic
  };

  // Fix missing dependency in first useEffect
  useEffect(() => {
    // Apply themes based on dark mode
    document.body.classList.toggle('dark-mode', isDarkMode);
    // Additional theming code
  }, [isDarkMode]); // Added isDarkMode as a dependency

  // Fix missing dependency in second useEffect
  useEffect(() => {
    if (canvas.current) {
      createParticles();
    }
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [createParticles]); // Added createParticles as a dependency

  // Fix missing dependency in third useEffect
  useEffect(() => {
    // Cleanup particles on unmount
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      createParticles(); // Reset particles when needed
    };
  }, [animationFrameId, createParticles]); // Added createParticles as a dependency

  return (
    <div className="login-container">
      <canvas ref={canvas}></canvas>
      <button onClick={() => setIsDarkMode(!isDarkMode)}>
        Toggle Dark Mode
      </button>
    </div>
  );
};

export default Login;
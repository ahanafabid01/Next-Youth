import React, { useState, useEffect } from "react";
import "./Auth.css";

const SplineBackground = ({ splineUrl = "https://prod.spline.design/9vMg2B2AO98B1VFC/scene.splinecode" }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   https://prod.spline.design/KU37PhsRODUvqucG/scene.splinecode
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Only load Spline viewer script on non-mobile devices
    if (!isMobile) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.89/build/spline-viewer.js';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
        window.removeEventListener('resize', handleResize);
      };
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobile, splineUrl]);

  return (
    <div className="background-container">
      {isMobile ? (
        <div className="static-background"></div>
      ) : (
        <div className="spline-background">
          <spline-viewer 
            url={splineUrl}
            events-target="global"
          />
        </div>
      )}
    </div>
  );
};

export default SplineBackground;
import React, { useState, useEffect } from "react";
import "./Auth.css";

const SplineBackground = ({ splineUrl = "https://prod.spline.design/wLq2AzPmv7lPGIQ1/scene.splinecode" }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   https://prod.spline.design/KU37PhsRODUvqucG/scene.splinecode
// https://prod.spline.design/9vMg2B2AO98B1VFC/scene.splinecode
// https://prod.spline.design/3agEMM1C3XkCrJE6/scene.splinecode
// https://prod.spline.design/N03R9tNtD7ui0V3h/scene.splinecode
// https://prod.spline.design/K-Et5DPGXvSxrOfE/scene.splinecode
// https://prod.spline.design/RYO-H5qtcOHqxQda/scene.splinecode
// https://prod.spline.design/wLq2AzPmv7lPGIQ1/scene.splinecode
// https://prod.spline.design/Ak4C7q1f0xPiwunw/scene.splinecode




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
import React, { useEffect } from "react";
import "./Auth.css";

const SplineBackground = ({ splineUrl = "https://prod.spline.design/FjphM-yLZVWFULOQ/scene.splinecode" }) => {
  useEffect(() => {
    // Load Spline viewer script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.9.89/build/spline-viewer.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up script when component unmounts
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="spline-background">
      <spline-viewer 
        url={splineUrl}
        events-target="global"
      />
    </div>
  );
};

export default SplineBackground;
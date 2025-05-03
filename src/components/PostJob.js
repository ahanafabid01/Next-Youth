import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ...existing code...

const renderFormStep = () => {
  switch (formStep) {
    case 1:
      return renderBasicDetails();
    case 2:
      return renderJobDetails();
    case 3:
      return renderRequirements();
    case 4:
      return renderReview();
    default:
      return renderBasicDetails(); // Default case added
  }
};

// ...existing code...
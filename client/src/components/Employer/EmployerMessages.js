import React from 'react';
import Messages from '../shared/Messages';
import './EmployerMessages.css'; // Create this CSS file if needed

const EmployerMessages = () => {
  return (
    <div className="employer-messages">
      <Messages userType="employer" />
    </div>
  );
};

export default EmployerMessages;
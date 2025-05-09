import React from 'react';
import Messages from '../shared/Messages';
import './EmployeeMessages.css';

const EmployeeMessages = () => {
  return (
    <div className="employee-messages">
      <Messages userType="employee" />
    </div>
  );
};

export default EmployeeMessages;
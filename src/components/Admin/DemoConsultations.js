import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DemoConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const response = await axios.get('/api/consultations');
      setConsultations(response.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await axios.patch(`/api/consultations/${id}/approve`);
      console.log('Consultation approved:', response.data);
      fetchConsultations(); // Refresh data after approval
    } catch (error) {
      console.error('Error approving consultation:', error);
    }
  };

  return (
    <div>
      <h1>Consultations</h1>
      <ul>
        {consultations.map((consultation) => (
          <li key={consultation.id}>
            {consultation.name} - {consultation.status}
            <button onClick={() => handleApprove(consultation.id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DemoConsultations;
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const JobApplication = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    resumeUrl: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axios.get(`/api/jobs/${jobId}`);
        setJob(response.data);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/jobs/${jobId}/apply`, formData);
      alert('Application submitted successfully!');
    } catch (err) {
      setError(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Apply for {job.title}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="phone">Phone:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="coverLetter">Cover Letter:</label>
          <textarea
            id="coverLetter"
            name="coverLetter"
            value={formData.coverLetter}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor="resumeUrl">Resume URL:</label>
          <input
            type="url"
            id="resumeUrl"
            name="resumeUrl"
            value={formData.resumeUrl}
            onChange={handleChange}
          />
        </div>
        <button type="submit">Submit Application</button>
      </form>
    </div>
  );
};

export default JobApplication;
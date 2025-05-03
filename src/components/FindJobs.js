import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaSearch, FaFilter, FaMapMarkerAlt, FaSortAmountDown, FaBookmark, FaRegBookmark, 
} from 'react-icons/fa';

const FindJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.search) {
      const params = new URLSearchParams(location.search);
      setSearchTerm(params.get('search') || '');
      setLocationFilter(params.get('location') || '');
      setCategoryFilter(params.get('category') || '');
    }
    fetchJobs();
  }, [location.search]);

  useEffect(() => {
    getFilteredJobs();
  }, [jobs, searchTerm, locationFilter, categoryFilter, experienceFilter, jobTypeFilter, salaryRange, datePosted, remoteOnly]);

  useEffect(() => {
    updateUrlParams();
  }, [searchTerm, locationFilter, categoryFilter, getFilteredJobs]);

  // ...existing code...
}
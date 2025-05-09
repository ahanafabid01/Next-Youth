import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FaCreditCard, 
  FaMobileAlt, 
  FaPlus, 
  FaTrash, 
  FaStar, 
  FaRegStar, 
  FaSpinner, 
  FaExclamationTriangle,
  FaCheck,
  FaHistory,
  FaWallet,
  FaInfoCircle,
  FaTimes
} from 'react-icons/fa';

// Add these imports specifically for card logos
import { 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex 
} from 'react-icons/fa';

import './EmployeePayment.css';

// Update the MobileBankingLogo component with more accurate logos

// Mobile banking logo components
const MobileBankingLogo = ({ provider }) => {
  switch(provider.toLowerCase()) {
    case 'bkash':
      return (
        <div className="mobile-banking-logo bkash">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#E2136E" />
            <path d="M64 34.6665C64 43.8406 56.5491 51.3333 47.3333 51.3333H35.3333V46H47.3333C53.5999 46 58.6667 40.9332 58.6667 34.6665C58.6667 28.3999 53.5999 23.3332 47.3333 23.3332H32L34.6667 19.3332H47.3333C56.5491 19.3332 64 26.8259 64 35.9999V34.6665Z" fill="white"/>
            <path d="M16 45.3333C16 36.1592 23.4508 28.6666 32.6666 28.6666H44.6666V33.9999H32.6666C26.4 33.9999 21.3333 39.0666 21.3333 45.3333C21.3333 51.5999 26.4 56.6666 32.6666 56.6666H48L45.3333 60.6666H32.6666C23.4508 60.6666 16 53.1738 16 44.0057V45.3333Z" fill="white"/>
          </svg>
        </div>
      );
    case 'nagad':
      return (
        <div className="mobile-banking-logo nagad">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#F6F6F6" />
            <path d="M59.9999 20.0001H20C14.4772 20.0001 10 24.4773 10 30.0001V50.0001C10 55.5229 14.4772 60.0001 20 60.0001H59.9999V30.0001C59.9999 24.4773 55.5227 20.0001 49.9999 20.0001H59.9999Z" fill="#F3722C"/>
            <path d="M31.1828 39.3041C31.1828 40.4544 31.7615 41.4749 32.671 42.0518V36.5564C31.7615 37.1333 31.1828 38.1538 31.1828 39.3041Z" fill="white"/>
            <path d="M35.3257 36.5564V42.0518C36.2352 41.4749 36.8139 40.4544 36.8139 39.3041C36.8139 38.1538 36.2352 37.1333 35.3257 36.5564Z" fill="white"/>
            <path d="M36.548 32.8533H31.4473C31.9053 32.8533 32.2769 33.225 32.2769 33.6829V35.5252C33.0752 34.9891 34.039 34.6588 35.0772 34.6588C35.7258 34.6588 36.3469 34.7906 36.919 35.0273V33.6829C36.919 33.225 37.2906 32.8533 37.7485 32.8533H36.548Z" fill="white"/>
            <path d="M42.4052 32.8533H37.7319C38.1899 32.8533 38.5615 33.225 38.5615 33.6829V36.2249C40.1492 38.242 39.8615 41.1666 37.8443 42.7544C37.4527 43.0458 37.013 43.2707 36.5479 43.4207V45.7532C36.5479 46.2112 36.1763 46.5828 35.7183 46.5828H36.5454C36.9783 46.5828 37.3687 46.4422 37.6693 46.2017C37.9698 46.4422 38.3603 46.5828 38.7932 46.5828H42.4052C42.8631 46.5828 43.2348 46.2112 43.2348 45.7532V33.6829C43.2348 33.225 42.8631 32.8533 42.4052 32.8533Z" fill="white"/>
            <path d="M32.2769 46.5828H35.7183C35.2603 46.5828 34.8887 46.2112 34.8887 45.7532V43.4207C34.4236 43.2707 33.9839 43.0458 33.5922 42.7544C31.5751 41.1666 31.2874 38.242 32.8751 36.2249V33.6829C32.8751 33.225 32.5034 32.8533 32.0455 32.8533H31.447C31.0141 32.8533 30.6237 32.9939 30.3231 33.2343C30.0226 32.9939 29.6321 32.8533 29.1992 32.8533H28.0001C27.5421 32.8533 27.1705 33.225 27.1705 33.6829V45.7532C27.1705 46.2112 27.5421 46.5828 28.0001 46.5828H31.6121C32.045 46.5828 32.4354 46.4422 32.736 46.2017C33.0365 46.4422 33.427 46.5828 33.8599 46.5828H32.2769Z" fill="white"/>
            <path d="M37.7993 32.8533H36.5454C37.0034 32.8533 37.375 33.225 37.375 33.6829V35.0273C37.947 34.7906 38.5681 34.6588 39.2168 34.6588C40.255 34.6588 41.2188 34.9891 42.017 35.5252V33.6829C42.017 33.225 42.3887 32.8533 42.8466 32.8533H41.6461C41.213 32.8533 40.8226 32.9938 40.522 33.2343C40.2214 32.9938 39.831 32.8533 39.3981 32.8533H37.7993Z" fill="white"/>
            <path d="M52.9232 38.4738C51.7994 37.351 50.1619 36.9407 48.4326 36.774V34.1014C48.4326 33.0109 47.5496 32.1279 46.4591 32.1279H45.9232C45.9232 32.1279 45.9232 32.1279 45.9232 32.128C44.8326 32.128 43.9497 33.0109 43.9497 34.1015V34.8244V38.1292C43.9497 38.5758 44.0621 38.9968 44.2566 39.3613C44.9558 40.6169 46.4149 41.1425 46.4149 41.1425C49.1785 42.0957 49.6769 42.3254 49.6769 43.3209C49.6769 44.3163 48.6836 44.6941 47.6904 44.6941C46.2602 44.6941 45.3891 44.0674 44.5635 43.1382C44.5635 43.1382 44.3936 42.9501 44.0179 42.5273C43.8704 42.3622 43.6211 42.3445 43.456 42.492C43.291 42.6396 43.2733 42.8889 43.4208 43.054L43.92 43.6166C44.9762 44.8079 46.2013 46.228 48.3535 46.228C50.4613 46.228 52.1838 44.7956 52.1838 42.9771C52.1838 40.6986 54.0471 39.5967 52.9232 38.4738Z" fill="white"/>
          </svg>
        </div>
      );
    case 'rocket':
      return (
        <div className="mobile-banking-logo rocket">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#8A3989" />
            <path d="M59 40C59 50.4934 50.4934 59 40 59C29.5066 59 21 50.4934 21 40C21 29.5066 29.5066 21 40 21C50.4934 21 59 29.5066 59 40Z" fill="white"/>
            <path d="M49.6665 30.3334C49.6665 30.3334 41.1249 29.6667 40.7082 41.0834C40.2499 41.0834 39.6665 41.0834 39.6665 41.0834C39.6665 41.0834 39.0832 29.6667 30.3332 30.3334C30.3332 30.3334 22.9582 44.4167 40.0415 49.6667C40.0415 49.6667 57.0415 44.4167 49.6665 30.3334Z" fill="#8A3989"/>
            <path d="M39.9999 42.5834L35.0832 37.6667H44.9165L39.9999 42.5834Z" fill="#8A3989"/>
          </svg>
        </div>
      );
    case 'upay':
      return (
        <div className="mobile-banking-logo upay">
          <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="80" height="80" rx="16" fill="#EC3D24" />
            <path d="M26.6667 24H53.3334C57.0153 24 60 26.9847 60 30.6666V46.6666C60 50.3485 57.0153 53.3333 53.3334 53.3333H26.6667C22.9848 53.3333 20 50.3485 20 46.6666V30.6666C20 26.9847 22.9848 24 26.6667 24Z" fill="white"/>
            <path d="M40 30L30 42H40L50 30H40Z" fill="#EC3D24"/>
            <path d="M35 44.0001L40 48.0001L45 44.0001H35Z" fill="#EC3D24"/>
          </svg>
        </div>
      );
    default:
      return <FaMobileAlt className="mobile-banking-logo default" />;
  }
};

const EmployeePayment = () => {
  const API_BASE_URL = 'http://localhost:4000/api';
  
  // State for payment methods
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // State for payment history
  const [paymentHistory, setPaymentHistory] = useState([]);
  
  // State for adding new payment methods
  const [showCardForm, setShowCardForm] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  
  // State for new payment method forms
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '01',
    expiryYear: '25', // Change this default value to match our new range
    cardType: 'visa'
  });
  
  const [mobileData, setMobileData] = useState({
    provider: 'bkash',
    mobileNumber: '',
    accountType: 'personal'
  });
  
  // State for loading, errors, and success messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // UI State
  const [activeSection, setActiveSection] = useState('methods');
  
  // Fetch payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
    fetchPaymentHistory();
  }, []);
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/employee-payment/methods`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setPaymentMethods(response.data.methods);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch payment methods'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employee-payment/history`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setPaymentHistory(response.data.transactions);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
      // Don't show error for this as it's not critical
    }
  };
  
  // Add this function to format the card number into groups of 4
  const formatCardNumber = (value) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    // Limit to 16 digits
    const limitedDigits = digits.slice(0, 16);
    // Format into groups of 4
    const groups = [];
    for (let i = 0; i < limitedDigits.length; i += 4) {
      groups.push(limitedDigits.slice(i, i + 4));
    }
    return groups.join(' ');
  };

  // Handle card form input changes
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'cardNumber') {
      setCardData(prev => ({
        ...prev,
        [name]: formatCardNumber(value)
      }));
    } else if (name === 'expiryMonth' || name === 'expiryYear') {
      setCardData(prev => ({
        ...prev,
        [name]: value,
        // Combine month/year for backend compatibility
        expiryDate: `${name === 'expiryMonth' ? value : prev.expiryMonth}/${name === 'expiryYear' ? value : prev.expiryYear}`
      }));
    } else {
      setCardData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Update the mobile banking form input handling

// Add this function to format and validate mobile numbers
const formatMobileNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  // Limit to 11 digits
  return digits.slice(0, 11);
};

// Update the handleMobileInputChange function
const handleMobileInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'mobileNumber') {
    setMobileData(prev => ({
      ...prev,
      [name]: formatMobileNumber(value)
    }));
  } else {
    setMobileData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};

  // Update the addCardPaymentMethod function

const addCardPaymentMethod = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // Prepare data for submission with proper formatting
    const formattedData = {
      ...cardData,
      cardNumber: cardData.cardNumber.replace(/\s/g, ''), // Remove spaces
      expiryDate: `${cardData.expiryMonth}/${cardData.expiryYear}`
    };
    
    const response = await axios.post(
      `${API_BASE_URL}/employee-payment/methods/card`,
      formattedData,
      { withCredentials: true }
    );
    
    if (response.data.success) {
      // Reset form and hide it
      setCardData({
        cardNumber: '',
        cardHolderName: '',
        expiryMonth: '01',
        expiryYear: '25', // Update this as well
        cardType: 'visa'
      });
      setShowCardForm(false);
      
      // Refresh payment methods list
      fetchPaymentMethods();
      
      setMessage({
        type: 'success',
        text: 'Card payment method added successfully'
      });
    }
  } catch (error) {
    console.error("Error adding card payment method:", error);
    setMessage({
      type: 'error',
      text: error.response?.data?.message || 'Failed to add card payment method'
    });
  } finally {
    setLoading(false);
  }
};
  
  // Update the addMobilePaymentMethod function to validate before submission

const addMobilePaymentMethod = async (e) => {
  e.preventDefault();
  
  // Validate mobile number
  if (mobileData.mobileNumber.length !== 11) {
    setMessage({
      type: 'error',
      text: 'Mobile number must be exactly 11 digits'
    });
    return;
  }
  
  setLoading(true);
  try {
    const response = await axios.post(
      `${API_BASE_URL}/employee-payment/methods/mobile`,
      mobileData,
      { withCredentials: true }
    );
    
    if (response.data.success) {
      // Reset form and hide it
      setMobileData({
        provider: 'bkash',
        mobileNumber: '',
        accountType: 'personal'
      });
      setShowMobileForm(false);
      
      // Refresh payment methods list
      fetchPaymentMethods();
      
      setMessage({
        type: 'success',
        text: 'Mobile payment method added successfully'
      });
    }
  } catch (error) {
    console.error("Error adding mobile payment method:", error);
    setMessage({
      type: 'error',
      text: error.response?.data?.message || 'Failed to add mobile payment method'
    });
  } finally {
    setLoading(false);
  }
};
  
  // Delete payment method
  const deletePaymentMethod = async (methodId) => {
    if (!window.confirm("Are you sure you want to delete this payment method?")) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/employee-payment/methods/${methodId}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Refresh payment methods list
        fetchPaymentMethods();
        
        setMessage({
          type: 'success',
          text: 'Payment method deleted successfully'
        });
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to delete payment method'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Set a payment method as default
  const setDefaultPaymentMethod = async (methodId) => {
    setLoading(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/employee-payment/methods/${methodId}/default`,
        {},
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Refresh payment methods list
        fetchPaymentMethods();
        
        setMessage({
          type: 'success',
          text: 'Default payment method updated'
        });
      }
    } catch (error) {
      console.error("Error setting default payment method:", error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to set default payment method'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Replace the getCardTypeIcon function with this enhanced version
const getCardTypeIcon = (type) => {
  switch(type.toLowerCase()) {
    case 'visa': return <FaCcVisa className="employee-payment-card-logo visa" />;
    case 'mastercard': return <FaCcMastercard className="employee-payment-card-logo mastercard" />;
    case 'amex': return <FaCcAmex className="employee-payment-card-logo amex" />;
    default: return <FaCreditCard className="employee-payment-card-logo" />;
  }
};

// Replace the getProviderLogo function
const getProviderLogo = (provider) => {
  return <MobileBankingLogo provider={provider} />;
};

  // Get provider display name
  const getProviderName = (provider) => {
    switch(provider) {
      case 'bkash': return 'bKash';
      case 'nagad': return 'Nagad';
      case 'rocket': return 'Rocket';
      case 'upay': return 'Upay';
      default: return provider;
    }
  };
  
  // Format status for display
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Message component for displaying success/error messages
  const MessageComponent = ({ message }) => {
    if (!message.text) return null;
    
    return (
      <div className={`employee-payment-message ${message.type === 'error' ? 'employee-payment-error' : 'employee-payment-success'}`}>
        {message.type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
        <p>{message.text}</p>
        <button 
          className="employee-payment-message-close"
          onClick={() => setMessage({ type: '', text: '' })}
        >
          <FaTimes />
        </button>
      </div>
    );
  };

  return (
    <div className="employee-payment-container">
      <MessageComponent message={message} />
      
      <div className="employee-payment-nav">
        <button 
          className={`employee-payment-nav-item ${activeSection === 'methods' ? 'active' : ''}`}
          onClick={() => setActiveSection('methods')}
        >
          <FaWallet /> Payment Methods
        </button>
        <button 
          className={`employee-payment-nav-item ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => setActiveSection('history')}
        >
          <FaHistory /> Payment History
        </button>
      </div>
      
      {activeSection === 'methods' && (
        <div className="employee-payment-section">
          <div className="employee-payment-info-card">
            <FaInfoCircle className="employee-payment-info-icon" />
            <p>Add your preferred payment methods to receive payments from clients and employers.</p>
          </div>
          
          <div className="employee-payment-methods-header">
            <h3>Your Payment Methods</h3>
            <div className="employee-payment-actions">
              <button 
                className={`employee-payment-add-button ${showCardForm ? 'active' : ''}`}
                onClick={() => {
                  setShowCardForm(!showCardForm);
                  setShowMobileForm(false);
                }}
                disabled={loading}
              >
                <FaCreditCard /> {showCardForm ? 'Cancel' : 'Add Card'}
              </button>
              <button 
                className={`employee-payment-add-button ${showMobileForm ? 'active' : ''}`}
                onClick={() => {
                  setShowMobileForm(!showMobileForm);
                  setShowCardForm(false);
                }}
                disabled={loading}
              >
                <FaMobileAlt /> {showMobileForm ? 'Cancel' : 'Add Mobile Banking'}
              </button>
            </div>
          </div>
          
          {/* Card Form */}
          {showCardForm && (
            <div className="employee-payment-form-container">
              <form className="employee-payment-form" onSubmit={addCardPaymentMethod}>
                <div className="employee-payment-form-group">
                  <label htmlFor="cardNumber">Card Number</label>
                  <input 
                    type="text" 
                    id="cardNumber" 
                    name="cardNumber" 
                    value={cardData.cardNumber}
                    onChange={handleCardInputChange}
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                
                <div className="employee-payment-form-group">
                  <label htmlFor="cardHolderName">Cardholder Name</label>
                  <input 
                    type="text" 
                    id="cardHolderName" 
                    name="cardHolderName" 
                    value={cardData.cardHolderName}
                    onChange={handleCardInputChange}
                    placeholder="John Smith"
                    required
                  />
                </div>
                
                <div className="employee-payment-form-row">
                  <div className="employee-payment-form-group">
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <div className="employee-payment-expiry-inputs">
                      <select 
                        id="expiryMonth" 
                        name="expiryMonth" 
                        value={cardData.expiryMonth}
                        onChange={handleCardInputChange}
                        required
                      >
                        <option value="01">01</option>
                        <option value="02">02</option>
                        <option value="03">03</option>
                        <option value="04">04</option>
                        <option value="05">05</option>
                        <option value="06">06</option>
                        <option value="07">07</option>
                        <option value="08">08</option>
                        <option value="09">09</option>
                        <option value="10">10</option>
                        <option value="11">11</option>
                        <option value="12">12</option>
                      </select>
                      <span className="employee-payment-expiry-separator">/</span>
                      <select 
                        id="expiryYear" 
                        name="expiryYear" 
                        value={cardData.expiryYear}
                        onChange={handleCardInputChange}
                        required
                      >
                        <option value="25">25</option>
                        <option value="26">26</option>
                        <option value="27">27</option>
                        <option value="28">28</option>
                        <option value="29">29</option>
                        <option value="30">30</option>
                        <option value="31">31</option>
                        <option value="32">32</option>
                        <option value="33">33</option>
                        <option value="34">34</option>
                        <option value="35">35</option>
                        <option value="36">36</option>
                        <option value="37">37</option>
                        <option value="38">38</option>
                        <option value="39">39</option>
                        <option value="40">40</option>
                        <option value="41">41</option>
                        <option value="42">42</option>
                        <option value="43">43</option>
                        <option value="44">44</option>
                        <option value="45">45</option>
                        <option value="46">46</option>
                        <option value="47">47</option>
                        <option value="48">48</option>
                        <option value="49">49</option>
                        <option value="50">50</option>
                        <option value="51">51</option>
                        <option value="52">52</option>
                        <option value="53">53</option>
                        <option value="54">54</option>
                        <option value="55">55</option>
                        <option value="56">56</option>
                        <option value="57">57</option>
                        <option value="58">58</option>
                        <option value="59">59</option>
                        <option value="60">60</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="employee-payment-form-group">
                    <label htmlFor="cardType">Card Type</label>
                    <div className="employee-payment-card-type-select">
                      <select 
                        id="cardType" 
                        name="cardType" 
                        value={cardData.cardType}
                        onChange={handleCardInputChange}
                        required
                      >
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">American Express</option>
                      </select>
                      <div className="employee-payment-card-logo-display">
                        {getCardTypeIcon(cardData.cardType)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="employee-payment-form-actions">
                  <button 
                    type="submit" 
                    className="employee-payment-submit-button"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="employee-payment-spinner" /> : "Save Card"}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Mobile Banking Form */}
          {showMobileForm && (
            <div className="employee-payment-form-container">
              <form className="employee-payment-form" onSubmit={addMobilePaymentMethod}>
                <div className="employee-payment-form-group">
                  <label htmlFor="provider">Provider</label>
                  <select 
                    id="provider" 
                    name="provider" 
                    value={mobileData.provider}
                    onChange={handleMobileInputChange}
                    required
                  >
                    <option value="bkash">bKash</option>
                    <option value="nagad">Nagad</option>
                    <option value="rocket">Rocket</option>
                    <option value="upay">Upay</option>
                  </select>
                </div>
                
                <div className="employee-payment-form-group">
                  <label htmlFor="mobileNumber">Mobile Number</label>
                  <input 
                    type="text" 
                    id="mobileNumber" 
                    name="mobileNumber" 
                    value={mobileData.mobileNumber}
                    onChange={handleMobileInputChange}
                    placeholder="01XXXXXXXXX"
                    pattern="[0-9]{11}"
                    title="Mobile number must be exactly 11 digits"
                    required
                  />
                  <small className="employee-payment-form-hint">
                    {mobileData.mobileNumber.length < 11 ? 
                      `Must be 11 digits (${mobileData.mobileNumber.length}/11)` : 
                      '✓ Valid number format'}
                  </small>
                </div>
                
                <div className="employee-payment-form-group">
                  <label htmlFor="accountType">Account Type</label>
                  <select 
                    id="accountType" 
                    name="accountType" 
                    value={mobileData.accountType}
                    onChange={handleMobileInputChange}
                    required
                  >
                    <option value="personal">Personal</option>
                    <option value="merchant">Merchant</option>
                  </select>
                </div>
                
                <div className="employee-payment-form-actions">
                  <button 
                    type="submit" 
                    className="employee-payment-submit-button"
                    disabled={loading}
                  >
                    {loading ? <FaSpinner className="employee-payment-spinner" /> : "Save Mobile Banking"}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Payment Methods List */}
          <div className="employee-payment-methods-list">
            {loading && paymentMethods.length === 0 ? (
              <div className="employee-payment-loading">
                <FaSpinner className="employee-payment-spinner" />
                <p>Loading payment methods...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="employee-payment-empty">
                <FaWallet className="employee-payment-empty-icon" />
                <h4>No payment methods added yet</h4>
                <p>Add a card or mobile banking account to receive payments</p>
              </div>
            ) : (
              <div className="employee-payment-methods-grid">
                {paymentMethods.map(method => (
                  <div 
                    key={method._id} 
                    className="employee-payment-method-card" 
                    data-provider={method.type === "mobile" ? method.provider : method.cardType}
                  >
                    <div className="employee-payment-method-header">
                      {method.isDefault && (
                        <span className="employee-payment-default-badge">
                          <FaStar /> Default
                        </span>
                      )}
                      <div className="employee-payment-method-actions">
                        {!method.isDefault && (
                          <button 
                            className="employee-payment-action-button"
                            onClick={() => setDefaultPaymentMethod(method._id)}
                            disabled={loading}
                            title="Set as default"
                          >
                            <FaRegStar />
                          </button>
                        )}
                        
                        <button 
                          className="employee-payment-action-button delete"
                          onClick={() => deletePaymentMethod(method._id)}
                          disabled={loading}
                          title="Delete payment method"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    {method.type === "card" ? (
                      <div className="employee-payment-method-content">
                        <div className="employee-payment-method-type card">
                          {getCardTypeIcon(method.cardType)}
                        </div>
                        <div className="employee-payment-method-details">
                          <div className="employee-payment-method-card-title">
                            <h4>{method.cardType.toUpperCase()}</h4>
                            <div className="employee-payment-card-logo-large">
                              {getCardTypeIcon(method.cardType)}
                            </div>
                          </div>
                          <div className="employee-payment-method-card-number">
                            •••• •••• •••• {method.cardNumber.slice(-4)}
                          </div>
                          <div className="employee-payment-method-info-row">
                            <span>{method.cardHolderName}</span>
                            <span>Exp: {method.expiryDate}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="employee-payment-method-content">
                        <div className="employee-payment-method-type mobile">
                          {getProviderLogo(method.provider)}
                        </div>
                        <div className="employee-payment-method-details">
                          <div className="employee-payment-method-mobile-title">
                            <h4>{getProviderName(method.provider)}</h4>
                            <div className="employee-payment-mobile-logo-large">
                              {getProviderLogo(method.provider)}
                            </div>
                          </div>
                          <div className="employee-payment-method-mobile-number">
                            {method.mobileNumber}
                          </div>
                          <div className="employee-payment-method-info-row">
                            <span>{method.accountType.charAt(0).toUpperCase() + method.accountType.slice(1)} Account</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Payment History Section */}
      {activeSection === 'history' && (
        <div className="employee-payment-section">
          <div className="employee-payment-history-header">
            <h3>Payment History</h3>
          </div>
          
          {paymentHistory.length === 0 ? (
            <div className="employee-payment-empty">
              <FaHistory className="employee-payment-empty-icon" />
              <h4>No payment history available</h4>
              <p>Your completed transactions will appear here</p>
            </div>
          ) : (
            <div className="employee-payment-history">
              <table className="employee-payment-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map(transaction => (
                    <tr key={transaction._id}>
                      <td>{new Date(transaction.date).toLocaleDateString()}</td>
                      <td>{transaction.description}</td>
                      <td>
                        {transaction.paymentMethod?.type === "card" ? (
                          <span className="employee-payment-history-method">
                            {getCardTypeIcon(transaction.paymentMethod.cardType)}
                            <span>•••• {transaction.paymentMethod.cardNumber?.slice(-4) || "****"}</span>
                          </span>
                        ) : transaction.paymentMethod?.type === "mobile" ? (
                          <span className="employee-payment-history-method">
                            {getProviderLogo(transaction.paymentMethod.provider)}
                            <span>{getProviderName(transaction.paymentMethod.provider)} ({transaction.paymentMethod.mobileNumber})</span>
                          </span>
                        ) : (
                          <span>Unknown method</span>
                        )}
                      </td>
                      <td className="employee-payment-amount">{transaction.amount} {transaction.currency}</td>
                      <td>
                        <span className={`employee-payment-status employee-payment-status-${transaction.status.toLowerCase()}`}>
                          {formatStatus(transaction.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeePayment;
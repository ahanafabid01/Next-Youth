import API_BASE_URL from '../../utils/apiConfig';
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

// Replace the MobileBankingLogo component with this image-based version using local assets
const MobileBankingLogo = ({ provider }) => {
  switch(provider.toLowerCase()) {
    case 'bkash':
      return (
        <div className="mobile-banking-logo bkash">
          <img 
            src={require('../../assets/images/bkash.png')}
            alt="bKash" 
            className="mobile-banking-logo-image" 
          />
        </div>
      );
    case 'nagad':
      return (
        <div className="mobile-banking-logo nagad">
          <img 
            src={require('../../assets/images/nogod.jpg')}
            alt="Nagad" 
            className="mobile-banking-logo-image" 
          />
        </div>
      );
    case 'rocket':
      return (
        <div className="mobile-banking-logo rocket">
          <img 
            src={require('../../assets/images/rocket.png')}
            alt="Rocket" 
            className="mobile-banking-logo-image" 
          />
        </div>
      );
    case 'upay':
      return (
        <div className="mobile-banking-logo upay">
          <img 
            src={require('../../assets/images/upay.png')}
            alt="Upay" 
            className="mobile-banking-logo-image" 
          />
        </div>
      );
    default:
      return <FaMobileAlt className="mobile-banking-logo default" />;
  }
};

const EmployeePayment = () => {
  
  
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
    cvv: '',     // Add CVV field
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

const resetCardForm = () => {
  setCardData({
    cardNumber: '',
    cardHolderName: '',
    expiryMonth: '01',
    expiryYear: '25',
    cvv: '',     // Clear CVV
    cardType: 'visa'
  });
  setShowCardForm(false);
};

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
      resetCardForm(); // Use the new reset function
      
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
  
  // Add this function to display card logos using local images
const getCardTypeIcon = (type) => {
  switch(type.toLowerCase()) {
    case 'visa':
      return (
        <div className="card-logo-container">
          <img 
            src={require('../../assets/images/visa card.jpg')}
            alt="Visa" 
            className="employee-payment-card-logo visa" 
          />
        </div>
      );
    case 'mastercard':
      return (
        <div className="card-logo-container">
          <img 
            src={require('../../assets/images/mastercard.png')}
            alt="Mastercard" 
            className="employee-payment-card-logo mastercard" 
          />
        </div>
      );
    case 'amex':
      return (
        <div className="card-logo-container">
          <img 
            src={require('../../assets/images/AmericanExpress.png')}
            alt="American Express" 
            className="employee-payment-card-logo amex" 
          />
        </div>
      );
    default:
      return <FaCreditCard className="employee-payment-card-logo" />;
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
                        className="employee-payment-input"
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

                <div className="employee-payment-form-group">
                  <label htmlFor="cvv">CVV/CVC</label>
                  <input
                    type="password"
                    id="cvv"
                    name="cvv"
                    value={cardData.cvv}
                    onChange={handleCardInputChange}
                    placeholder="•••"
                    maxLength="4"
                    pattern="[0-9]{3,4}"
                    title="3-4 digits security code"
                    required
                  />
                  <small className="employee-payment-form-hint">
                    3-4 digit security code on the back of your card
                  </small>
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_BASE_URL from '../../utils/apiConfig';
import paymentService from "../../services/paymentService";
import { 
  FaCreditCard, 
  FaMobile, 
  FaHistory, 
  FaPlus, 
  FaTrash, 
  FaCheck,
  FaEdit,
  FaSpinner,
  FaInfoCircle,
  FaShieldAlt,
  FaLock
} from "react-icons/fa";
import "./EmployerPayment.css";

const EmployerPayment = () => {
  const [activeTab, setActiveTab] = useState("methods");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState("card"); // card or mobile
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();

  // Check user theme preference
  useEffect(() => {
    const isDarkMode = document.body.classList.contains("dark-mode") || 
                      localStorage.getItem("theme") === "dark";
    setDarkMode(isDarkMode);
  }, []);

  // Form state for card payment
  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardHolderName: "",
    expiryDate: "",
    cvv: "",
    cardType: "visa", // default selection
    saveCard: true,
  });

  // Form state for mobile banking
  const [mobileForm, setMobileForm] = useState({
    provider: "bkash",
    mobileNumber: "",
    accountType: "personal",
  });

  useEffect(() => {
    fetchPaymentMethods();
    fetchPaymentHistory();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentMethods();
      
      if (response.success) {
        setPaymentMethods(response.methods);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPaymentHistory();
      
      if (response.success) {
        setPaymentHistory(response.transactions);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCardForm({
      ...cardForm,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleMobileInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "mobileNumber") {
      // Only allow digits and limit to proper Bangladesh mobile number format
      const onlyNums = value.replace(/[^\d]/g, '').slice(0, 11);
      setMobileForm({
        ...mobileForm,
        [name]: onlyNums
      });
    } else {
      setMobileForm({
        ...mobileForm,
        [name]: value
      });
    }
  };

  const handleAddCardSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await paymentService.addCardPaymentMethod(cardForm);

      if (response.success) {
        setShowAddForm(false);
        fetchPaymentMethods();
        // Reset form
        setCardForm({
          cardNumber: "",
          cardHolderName: "",
          expiryDate: "",
          cvv: "",
          cardType: "visa",
          saveCard: true,
        });
      }
    } catch (error) {
      console.error("Error adding card:", error);
      alert(error.response?.data?.message || "Failed to add card");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMobileSubmit = async (e) => {
    e.preventDefault();
    
    // Validate mobile number format before submission
    if (mobileForm.mobileNumber.length !== 11 || !mobileForm.mobileNumber.startsWith('01')) {
      alert("Please enter a valid 11-digit Bangladesh mobile number starting with '01'");
      return;
    }
    
    try {
      setLoading(true); // Set loading state while submitting
      
      console.log("Submitting mobile banking data:", {
        provider: mobileForm.provider,
        mobileNumber: mobileForm.mobileNumber,
        accountType: mobileForm.accountType
      });
      
      // Direct API call to add mobile payment method
      const response = await paymentService.addMobilePaymentMethod({
        provider: mobileForm.provider,
        mobileNumber: mobileForm.mobileNumber,
        accountType: mobileForm.accountType
      });
      
      console.log("Response from server:", response);
      
      if (response.success) {
        setShowAddForm(false);
        fetchPaymentMethods();
        // Reset form
        setMobileForm({
          provider: "bkash",
          mobileNumber: "",
          accountType: "personal",
        });
        alert(`${mobileForm.provider.toUpperCase()} mobile payment method added successfully!`);
      }
    } catch (error) {
      console.error("Error adding mobile banking:", error);
      console.error("Error details:", error.response?.data || "No response data available");
      alert(error.response?.data?.message || "Failed to add mobile banking method");
    } finally {
      setLoading(false); // Reset loading state regardless of outcome
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (window.confirm("Are you sure you want to remove this payment method?")) {
      try {
        setLoading(true);
        const response = await paymentService.deletePaymentMethod(methodId);
        
        if (response.success) {
          fetchPaymentMethods();
        }
      } catch (error) {
        console.error("Error deleting payment method:", error);
        alert(error.response?.data?.message || "Failed to delete payment method");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefaultMethod = async (methodId) => {
    try {
      setLoading(true);
      const response = await paymentService.setDefaultPaymentMethod(methodId);
      
      if (response.success) {
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error("Error setting default payment method:", error);
      alert(error.response?.data?.message || "Failed to set default payment method");
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async (methodId) => {
    try {
      setLoading(true);
      
      // Example payment data - in a real app, this would come from a checkout form
      const paymentData = {
        paymentMethodId: methodId,
        amount: 1500, // Example amount in BDT
        description: "Job posting fee",
        metadata: {
          serviceType: "premium-job-posting"
        }
      };
      
      const response = await paymentService.createTransaction(paymentData);
      
      if (response.success) {
        alert("Payment successful!");
        fetchPaymentHistory(); // Refresh the payment history
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert(error.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format card number with spaces
  const formatCardNumber = (number) => {
    return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  // Get last 4 digits of card
  const getLastFourDigits = (cardNumber) => {
    const normalizedNumber = cardNumber.replace(/\s/g, '');
    return normalizedNumber.slice(-4);
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get logo based on card type or mobile provider
  const getPaymentLogo = (type, provider) => {
    if (type === "card") {
      switch (provider.toLowerCase()) {
        case 'visa':
          return "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";
        case 'mastercard':
          return "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg";
        case 'amex':
          return "https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg";
        default:
          return "https://cdn-icons-png.flaticon.com/512/179/179457.png";
      }
    } else if (type === "mobile") {
      switch (provider.toLowerCase()) {
        case 'bkash':
          return "https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg";
        case 'nagad':
          return "https://upload.wikimedia.org/wikipedia/en/0/0f/Nagad_logo.png";
        case 'rocket':
          return "https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png";
        case 'upay':
          return "https://play-lh.googleusercontent.com/oZOeDbZmOXTVdVyFtgGAZC5WJwDZPjCBbieGGuKQqIBbW_SDfiBHgLNRMUWDRaORkA";
        default:
          return "https://cdn-icons-png.flaticon.com/512/1019/1019607.png";
      }
    }
    return "https://cdn-icons-png.flaticon.com/512/5370/5370339.png";
  };

  const renderPaymentMethodsTab = () => {
    return (
      <div className="payment-methods-container">
        <div className="payment-header">
          <h2>Your Payment Methods</h2>
          <button 
            className="add-method-btn" 
            onClick={() => {
              setShowAddForm(true);
              setFormType("card");
            }}
          >
            <FaPlus /> Add Payment Method
          </button>
        </div>

        {loading && paymentMethods.length === 0 ? (
          <div className="loading-container">
            <FaSpinner className="loading-spinner" />
            <p>Loading payment methods...</p>
          </div>
        ) : paymentMethods.length === 0 ? (
          <div className="empty-state">
            <FaCreditCard className="empty-icon" />
            <h3>No Payment Methods</h3>
            <p>You haven't added any payment methods yet.</p>
            <button 
              className="add-first-method-btn" 
              onClick={() => {
                setShowAddForm(true);
                setFormType("card");
              }}
            >
              Add Your First Payment Method
            </button>
          </div>
        ) : (
          <div className="payment-methods-list">
            {paymentMethods.map(method => (
              <div 
                key={method._id} 
                className={`payment-method-card ${method.isDefault ? 'default-method' : ''}`}
              >
                <div className="method-card-content">
                  <div className="method-logo">
                    <img 
                      src={getPaymentLogo(method.type, method.provider || method.cardType)} 
                      alt={method.provider || method.cardType} 
                    />
                  </div>
                  
                  <div className="method-details">
                    {method.type === "card" ? (
                      <>
                        <h3>{method.cardType.toUpperCase()} •••• {getLastFourDigits(method.cardNumber)}</h3>
                        <p>Expires: {method.expiryDate}</p>
                        <p>{method.cardHolderName}</p>
                      </>
                    ) : (
                      <>
                        <h3>{method.provider.toUpperCase()}</h3>
                        <p>{method.mobileNumber}</p>
                        <p>{method.accountType} account</p>
                      </>
                    )}
                    
                    {method.isDefault && (
                      <span className="default-badge">
                        <FaCheck /> Default
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="method-actions">
                  {!method.isDefault && (
                    <button 
                      className="set-default-btn" 
                      onClick={() => handleSetDefaultMethod(method._id)}
                      disabled={loading}
                    >
                      Set Default
                    </button>
                  )}
                  <button 
                    className="pay-now-btn"
                    onClick={() => handleMakePayment(method._id)}
                    disabled={loading}
                  >
                    Pay Now
                  </button>
                  <button 
                    className="delete-method-btn" 
                    onClick={() => handleDeleteMethod(method._id)}
                    disabled={loading}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPaymentHistoryTab = () => {
    return (
      <div className="payment-history-container">
        <div className="payment-header">
          <h2>Payment History</h2>
        </div>

        {loading && paymentHistory.length === 0 ? (
          <div className="loading-container">
            <FaSpinner className="loading-spinner" />
            <p>Loading payment history...</p>
          </div>
        ) : paymentHistory.length === 0 ? (
          <div className="empty-state">
            <FaHistory className="empty-icon" />
            <h3>No Payment History</h3>
            <p>Your payment transactions will appear here.</p>
          </div>
        ) : (
          <div className="payment-history-list">
            <table className="payment-history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map(transaction => (
                  <tr key={transaction._id}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>{transaction.description}</td>
                    <td>
                      <div className="payment-method-cell">
                        <img 
                          src={getPaymentLogo(
                            transaction.paymentMethod.type, 
                            transaction.paymentMethod.provider || transaction.paymentMethod.cardType
                          )} 
                          alt={transaction.paymentMethod.provider || transaction.paymentMethod.cardType} 
                          className="method-mini-logo"
                        />
                        {transaction.paymentMethod.type === "card" 
                          ? `${transaction.paymentMethod.cardType.toUpperCase()} •••• ${getLastFourDigits(transaction.paymentMethod.cardNumber)}`
                          : `${transaction.paymentMethod.provider.toUpperCase()} (${transaction.paymentMethod.mobileNumber.substring(transaction.paymentMethod.mobileNumber.length - 4)})`
                        }
                      </div>
                    </td>
                    <td className="amount-cell">${transaction.amount.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${transaction.status.toLowerCase()}`}>
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAddPaymentMethodForm = () => {
    return (
      <div className="add-payment-form-overlay">
        <div className="add-payment-form-container">
          <div className="form-header">
            <h2>Add Payment Method</h2>
            <button 
              className="close-form-btn"
              onClick={() => setShowAddForm(false)}
            >
              &times;
            </button>
          </div>

          <div className="payment-type-tabs">
            <button 
              className={`payment-type-tab ${formType === "card" ? "active" : ""}`}
              onClick={() => setFormType("card")}
            >
              <FaCreditCard /> Credit/Debit Card
            </button>
            <button 
              className={`payment-type-tab ${formType === "mobile" ? "active" : ""}`}
              onClick={() => setFormType("mobile")}
            >
              <FaMobile /> Mobile Banking
            </button>
          </div>

          {formType === "card" ? (
            <form onSubmit={handleAddCardSubmit} className="payment-form">
              <div className="form-group">
                <label htmlFor="cardType">Card Type</label>
                <div className="card-type-selector">
                  <div className={`card-type-option ${cardForm.cardType === "visa" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="visa"
                      name="cardType"
                      value="visa"
                      checked={cardForm.cardType === "visa"}
                      onChange={handleCardInputChange}
                    />
                    <label htmlFor="visa">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
                        alt="Visa" 
                      />
                    </label>
                  </div>
                  
                  <div className={`card-type-option ${cardForm.cardType === "mastercard" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="mastercard"
                      name="cardType"
                      value="mastercard"
                      checked={cardForm.cardType === "mastercard"}
                      onChange={handleCardInputChange}
                    />
                    <label htmlFor="mastercard">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
                        alt="Mastercard" 
                      />
                    </label>
                  </div>
                  
                  <div className={`card-type-option ${cardForm.cardType === "amex" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="amex"
                      name="cardType"
                      value="amex"
                      checked={cardForm.cardType === "amex"}
                      onChange={handleCardInputChange}
                    />
                    <label htmlFor="amex">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" 
                        alt="American Express" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cardNumber">Card Number</label>
                <div className="secure-input-wrapper">
                  <input
                    type="text"
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formatCardNumber(cardForm.cardNumber)}
                    onChange={handleCardInputChange}
                    maxLength="19" // 16 digits + 3 spaces
                    required
                  />
                  <FaLock className="secure-input-icon" />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="cardHolderName">Cardholder Name</label>
                <input
                  type="text"
                  id="cardHolderName"
                  name="cardHolderName"
                  placeholder="John Doe"
                  value={cardForm.cardHolderName}
                  onChange={handleCardInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group half-width">
                  <label htmlFor="expiryDate">Expiry Date</label>
                  <input
                    type="text"
                    id="expiryDate"
                    name="expiryDate"
                    placeholder="MM/YY"
                    value={cardForm.expiryDate}
                    onChange={handleCardInputChange}
                    maxLength="5"
                    required
                  />
                </div>

                <div className="form-group half-width">
                  <label htmlFor="cvv">CVV</label>
                  <div className="secure-input-wrapper">
                    <input
                      type="password"
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={cardForm.cvv}
                      onChange={handleCardInputChange}
                      maxLength="4"
                      required
                    />
                    <FaLock className="secure-input-icon" />
                  </div>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <input
                  type="checkbox"
                  id="saveCard"
                  name="saveCard"
                  checked={cardForm.saveCard}
                  onChange={handleCardInputChange}
                />
                <label htmlFor="saveCard">Save this card for future payments</label>
              </div>

              <div className="security-info">
                <FaShieldAlt /> Your payment information is encrypted and secure.
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="loading-spinner" /> : "Add Card"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddMobileSubmit} className="payment-form">
              <div className="form-group">
                <label htmlFor="provider">Mobile Banking Provider</label>
                <div className="mobile-provider-selector">
                  <div className={`mobile-provider-option ${mobileForm.provider === "bkash" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="bkash"
                      name="provider"
                      value="bkash"
                      checked={mobileForm.provider === "bkash"}
                      onChange={handleMobileInputChange}
                    />
                    <label htmlFor="bkash">
                      <img 
                        src="https://www.logo.wine/a/logo/BKash/BKash-Logo.wine.svg" 
                        alt="bKash" 
                      />
                    </label>
                  </div>
                  
                  <div className={`mobile-provider-option ${mobileForm.provider === "nagad" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="nagad"
                      name="provider"
                      value="nagad"
                      checked={mobileForm.provider === "nagad"}
                      onChange={handleMobileInputChange}
                    />
                    <label htmlFor="nagad">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/en/0/0f/Nagad_logo.png" 
                        alt="Nagad" 
                      />
                    </label>
                  </div>
                  
                  <div className={`mobile-provider-option ${mobileForm.provider === "rocket" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="rocket"
                      name="provider"
                      value="rocket"
                      checked={mobileForm.provider === "rocket"}
                      onChange={handleMobileInputChange}
                    />
                    <label htmlFor="rocket">
                      <img 
                        src="https://seeklogo.com/images/D/dutch-bangla-rocket-logo-B4D1CC458D-seeklogo.com.png" 
                        alt="Rocket" 
                      />
                    </label>
                  </div>
                  
                  <div className={`mobile-provider-option ${mobileForm.provider === "upay" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      id="upay"
                      name="provider"
                      value="upay"
                      checked={mobileForm.provider === "upay"}
                      onChange={handleMobileInputChange}
                    />
                    <label htmlFor="upay">
                      <img 
                        src="https://play-lh.googleusercontent.com/oZOeDbZmOXTVdVyFtgGAZC5WJwDZPjCBbieGGuKQqIBbW_SDfiBHgLNRMUWDRaORkA" 
                        alt="Upay" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="mobileNumber">Mobile Number</label>
                <div className={`input-with-feedback ${
                  mobileForm.mobileNumber && 
                  (mobileForm.mobileNumber.length !== 11 || !mobileForm.mobileNumber.startsWith('01')) 
                    ? 'input-error' 
                    : mobileForm.mobileNumber.length === 11 
                      ? 'input-valid' 
                      : ''
                }`}>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    placeholder="01XXXXXXXXX"
                    value={mobileForm.mobileNumber}
                    onChange={handleMobileInputChange}
                    required
                  />
                  {mobileForm.mobileNumber && 
                    (mobileForm.mobileNumber.length !== 11 || !mobileForm.mobileNumber.startsWith('01')) && (
                    <small className="error-text">Number must be 11 digits starting with 01</small>
                  )}
                </div>
                <small>Please enter your {mobileForm.provider} registered number</small>
              </div>

              <div className="form-group">
                <label htmlFor="accountType">Account Type</label>
                <div className="radio-group">
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="personal"
                      name="accountType"
                      value="personal"
                      checked={mobileForm.accountType === "personal"}
                      onChange={handleMobileInputChange}
                    />
                    <label htmlFor="personal">Personal</label>
                  </div>
                  
                  <div className="radio-option">
                    <input
                      type="radio"
                      id="merchant"
                      name="accountType"
                      value="merchant"
                      checked={mobileForm.accountType === "merchant"}
                      onChange={handleMobileInputChange}
                    />
                    <label htmlFor="merchant">Merchant</label>
                  </div>
                </div>
              </div>

              <div className="security-info">
                <FaInfoCircle /> Your mobile banking information will be securely stored.
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={loading || mobileForm.mobileNumber.length !== 11 || 
                           !mobileForm.mobileNumber.startsWith('01')}
                >
                  {loading ? "Processing..." : "Add Mobile Banking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`employer-payment-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="payment-tabs">
        <button 
          className={`payment-tab ${activeTab === "methods" ? "active" : ""}`}
          onClick={() => setActiveTab("methods")}
        >
          <FaCreditCard /> Payment Methods
        </button>
        <button 
          className={`payment-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <FaHistory /> Payment History
        </button>
      </div>

      <div className="payment-content">
        {activeTab === "methods" ? renderPaymentMethodsTab() : renderPaymentHistoryTab()}
      </div>

      {showAddForm && renderAddPaymentMethodForm()}
    </div>
  );
};

export default EmployerPayment;
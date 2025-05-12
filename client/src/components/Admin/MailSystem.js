import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FaPaperPlane, 
  FaSpinner, 
  FaEye,
  FaEdit,
  FaPaperclip,
  FaTimes,
  FaImage,
  FaHistory,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaRegEnvelope,
  FaEnvelopeOpenText
} from "react-icons/fa";
import "./MailSystem.css";
import Sidebar from "./Sidebar";
import EmojiPicker from 'emoji-picker-react';

const MailSystem = () => {
  // State management
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("adminTheme") === "dark");
  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState("all");
  const [attachments, setAttachments] = useState([]);
  const [photoAttachments, setPhotoAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");
  const [emailHistory, setEmailHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  
  
  // Theme monitoring
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem("adminTheme") === "dark");
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Fetch email history when tab changes or page changes
  useEffect(() => {
    if (activeTab === "history") {
      fetchEmailHistory();
    }
  }, [activeTab, currentPage, filter]);
  
  const fetchEmailHistory = async () => {
    try {
      setLoading(true);
      // Sample response - replace with actual API call when available
      // const response = await axios.get(`${API_BASE_URL}/admin/email-history?page=${currentPage}&filter=${filter}`, { withCredentials: true });
      
      // Simulated response for now
      setTimeout(() => {
        const mockEmails = Array(10).fill(null).map((_, i) => ({
          id: `email-${currentPage}-${i}`,
          subject: `Monthly newsletter ${currentPage}.${i+1}`,
          sentAt: new Date(Date.now() - (i * 86400000)).toISOString(),
          recipientCount: Math.floor(Math.random() * 500) + 50,
          recipientType: ['all', 'active', 'inactive'][Math.floor(Math.random() * 3)],
          attachmentCount: Math.floor(Math.random() * 3)
        }));
        
        setEmailHistory(mockEmails);
        setTotalPages(5); // Mock 5 pages total
        setLoading(false);
      }, 800);
      
      // When API is ready, use this:
      // if (response.data.success) {
      //   setEmailHistory(response.data.emails);
      //   setTotalPages(response.data.totalPages);
      // }
    } catch (error) {
      console.error("Failed to fetch email history:", error);
      setError("Failed to load email history. Please try again.");
      setLoading(false);
    }
  };
  
  const handleAttachmentChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
    // Reset file input
    e.target.value = "";
  };
  
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      setPhotoAttachments(prev => [...prev, ...files]);
    }
    
    // Reset file input
    e.target.value = "";
  };
  
  const removeAttachment = (indexToRemove) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const removePhotoAttachment = (indexToRemove) => {
    setPhotoAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    
    if (!subject || !emailContent) {
      setError("Subject and email content are required");
      return;
    }
    
    try {
      setSending(true);
      setError("");
      setSuccess("");
      
      // Create form data
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("textContent", emailContent);
      formData.append("recipientType", selectedRecipients);
      
      // Add file attachments if any
      attachments.forEach(file => {
        formData.append("attachments", file);
      });
      
      // Add photo attachments if any
      photoAttachments.forEach(photo => {
        formData.append("photos", photo);
      });
      
      // Send the request
      const response = await fetch(`${API_BASE_URL}/admin/send-mass-email`, {
        method: "POST",
        body: formData,
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(`Email sent successfully to ${data.recipientCount} recipients`);
        // Clear form after successful send
        setSubject("");
        setEmailContent("");
        setAttachments([]);
        setPhotoAttachments([]);
        // Refresh email history if we're viewing that
        if (activeTab === "history") {
          fetchEmailHistory();
        }
      } else {
        throw new Error(data.message || "Failed to send email");
      }
    } catch (error) {
      console.error("Email sending error:", error);
      setError(error.message || "Failed to send email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const formatEmailPreview = (content) => {
    // Convert plain text to display with line breaks
    return content.split('\n').map((line, i) => (
      <p key={i} style={{ margin: '0 0 10px 0' }}>{line || <br />}</p>
    ));
  };

  const handleEmojiSelect = (emojiData) => {
    // Get current cursor position
    const cursorPosition = document.getElementById('emailContent').selectionStart;
    const textBeforeCursor = emailContent.substring(0, cursorPosition);
    const textAfterCursor = emailContent.substring(cursorPosition);
    
    // Insert emoji at cursor position
    setEmailContent(textBeforeCursor + emojiData.emoji + textAfterCursor);
    
    // Close emoji picker after selection
    setShowEmojiPicker(false);
  };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const getRecipientTypeName = (type) => {
    switch(type) {
      case 'all': return 'All Users';
      case 'active': return 'Verified Users';
      case 'inactive': return 'Unverified Users';
      default: return type;
    }
  };

  return (
    <div className={`mail-system-container ${darkMode ? 'mail-system-dark-mode' : ''}`}>
      <Sidebar />
      
      <div className="mail-system-main">
        <div className="mail-system-header-area">
          <div className="mail-system-title">
            <h1>Central Mailing System</h1>
            <p>Communicate with your users via email broadcasts</p>
          </div>
        </div>

        <div className="mail-system-tabs">
          <button 
            className={`mail-system-tab ${activeTab === 'compose' ? 'active' : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            <FaPaperPlane /> Compose Email
          </button>
          <button 
            className={`mail-system-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory /> Email History
          </button>
        </div>

        {error && <div className="mail-system-error">{error}</div>}
        {success && <div className="mail-system-success">{success}</div>}

        {activeTab === 'compose' ? (
          <div className="mail-system-content-area">
            {previewMode ? (
              <div className="mail-system-preview-container">
                <div className="mail-system-preview-header">
                  <h2><FaEnvelopeOpenText /> Email Preview</h2>
                  <button onClick={handlePreview} className="mail-system-btn-secondary">
                    <FaEdit /> Back to Edit
                  </button>
                </div>
                <div className="mail-system-preview">
                  <div className="mail-system-preview-section">
                    <div className="mail-system-preview-label">Recipient Group:</div>
                    <div className="mail-system-preview-value">{getRecipientTypeName(selectedRecipients)}</div>
                  </div>
                  
                  <div className="mail-system-preview-section">
                    <div className="mail-system-preview-label">Subject:</div>
                    <div className="mail-system-preview-value mail-system-preview-subject">{subject}</div>
                  </div>
                  
                  <div className="mail-system-preview-section">
                    <div className="mail-system-preview-label">Message:</div>
                    <div className="mail-system-preview-value mail-system-preview-body">
                      {formatEmailPreview(emailContent)}
                    </div>
                  </div>
                  
                  {photoAttachments.length > 0 && (
                    <div className="mail-system-preview-section">
                      <div className="mail-system-preview-label">Images ({photoAttachments.length}):</div>
                      <div className="mail-system-preview-photos">
                        {photoAttachments.map((photo, index) => (
                          <div key={index} className="mail-system-photo-preview-item">
                            <img 
                              src={URL.createObjectURL(photo)} 
                              alt={`Preview ${index+1}`} 
                              className="mail-system-photo-preview" 
                            />
                            <span className="mail-system-photo-name">{photo.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {attachments.length > 0 && (
                    <div className="mail-system-preview-section">
                      <div className="mail-system-preview-label">Attachments ({attachments.length}):</div>
                      <ul className="mail-system-preview-attachments">
                        {attachments.map((file, index) => (
                          <li key={index} className="mail-system-preview-attachment">
                            {file.name} ({Math.round(file.size / 1024)} KB)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mail-system-preview-actions">
                    <button onClick={handlePreview} className="mail-system-btn-secondary">
                      <FaEdit /> Edit Email
                    </button>
                    <button 
                      onClick={handleSendMail} 
                      className="mail-system-btn-primary"
                      disabled={sending}
                    >
                      {sending ? (
                        <>
                          <FaSpinner className="mail-system-spinner" /> Sending...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane /> Send Email
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMail} className="mail-system-form">
                <div className="mail-system-form-group">
                  <label htmlFor="recipients" className="mail-system-label">Recipients:</label>
                  <select 
                    id="recipients" 
                    value={selectedRecipients} 
                    onChange={(e) => setSelectedRecipients(e.target.value)}
                    className="mail-system-select"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Verified Users Only</option>
                    <option value="inactive">Unverified Users Only</option>
                  </select>
                </div>

                <div className="mail-system-form-group">
                  <label htmlFor="subject" className="mail-system-label">Subject:</label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                    required
                    className="mail-system-input"
                  />
                </div>

                <div className="mail-system-form-group">
                  <label htmlFor="emailContent" className="mail-system-label">Email Body:</label>
                  <div className="mail-system-textarea-container">
                    <textarea
                      id="emailContent"
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      placeholder="Type your message here..."
                      required
                      className="mail-system-textarea"
                      rows="12"
                    />
                    
                    <button 
                      type="button" 
                      className="mail-system-emoji-button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                      😊
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="mail-system-emoji-picker-container">
                        <div 
                          className="mail-system-emoji-picker-backdrop" 
                          onClick={() => setShowEmojiPicker(false)}
                        ></div>
                        <EmojiPicker
                          onEmojiClick={handleEmojiSelect}
                          disableAutoFocus={true}
                          native={true}
                          className="mail-system-emoji-picker"
                        />
                      </div>
                    )}
                  </div>
                  <p className="mail-system-helper-text">
                    Use line breaks for new paragraphs. Click the emoji button to add emojis.
                  </p>
                </div>

                <div className="mail-system-form-group">
                  <label className="mail-system-label">Photos & Attachments:</label>
                  <div className="mail-system-file-upload-container">
                    <button 
                      type="button" 
                      className="mail-system-file-button"
                      onClick={() => photoInputRef.current.click()}
                    >
                      <FaImage /> Add Photos
                    </button>
                    <input
                      type="file"
                      ref={photoInputRef}
                      onChange={handlePhotoChange}
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    
                    <button 
                      type="button" 
                      className="mail-system-file-button"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <FaPaperclip /> Add Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachmentChange}
                      multiple
                      style={{ display: 'none' }}
                    />
                    <span className="mail-system-helper-text">
                      Maximum total size: 10MB
                    </span>
                  </div>
                  
                  {photoAttachments.length > 0 && (
                    <div className="mail-system-photo-gallery">
                      <h4>Selected Photos ({photoAttachments.length})</h4>
                      <div className="mail-system-photo-grid">
                        {photoAttachments.map((photo, index) => (
                          <div key={index} className="mail-system-photo-item">
                            <img 
                              src={URL.createObjectURL(photo)} 
                              alt={`Photo ${index+1}`}
                              className="mail-system-photo-thumbnail" 
                            />
                            <button 
                              type="button"
                              className="mail-system-remove-photo"
                              onClick={() => removePhotoAttachment(index)}
                              title="Remove photo"
                            >
                              <FaTimes />
                            </button>
                            <span className="mail-system-photo-size">
                              {Math.round(photo.size / 1024)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {attachments.length > 0 && (
                    <div className="mail-system-attachment-list">
                      <h4>Selected Files ({attachments.length})</h4>
                      <ul>
                        {attachments.map((file, index) => (
                          <li key={index} className="mail-system-attachment-item">
                            <span className="mail-system-attachment-name">{file.name}</span>
                            <span className="mail-system-attachment-size">({Math.round(file.size / 1024)} KB)</span>
                            <button 
                              type="button"
                              className="mail-system-remove-attachment"
                              onClick={() => removeAttachment(index)}
                            >
                              <FaTimes />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mail-system-button-group">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="mail-system-btn-secondary"
                    disabled={sending || !subject || !emailContent}
                  >
                    <FaEye /> Preview Email
                  </button>
                  <button
                    type="submit"
                    className="mail-system-btn-primary"
                    disabled={sending || !subject || !emailContent}
                  >
                    {sending ? (
                      <>
                        <FaSpinner className="mail-system-spinner" /> Sending...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane /> Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="mail-system-content-area">
            <div className="mail-system-history-header">
              <h2><FaHistory /> Email History</h2>
              <div className="mail-system-filter-container">
                <label htmlFor="historyFilter" className="mail-system-filter-label">
                  <FaFilter /> Filter:
                </label>
                <select 
                  id="historyFilter"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="mail-system-filter-select"
                >
                  <option value="all">All Emails</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="mail-system-loading">
                <FaSpinner className="mail-system-spinner" /> Loading email history...
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="mail-system-no-data">
                <FaRegEnvelope size={40} />
                <p>No email history found</p>
              </div>
            ) : (
              <>
                <div className="mail-system-history-table-container">
                  <table className="mail-system-history-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Sent Date</th>
                        <th>Recipients</th>
                        <th>Type</th>
                        <th>Attachments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emailHistory.map((email) => (
                        <tr key={email.id}>
                          <td>{email.subject}</td>
                          <td>{formatDate(email.sentAt)}</td>
                          <td>{email.recipientCount}</td>
                          <td>{getRecipientTypeName(email.recipientType)}</td>
                          <td>{email.attachmentCount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mail-system-pagination">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="mail-system-pagination-button"
                  >
                    <FaChevronLeft />
                  </button>
                  
                  <div className="mail-system-pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="mail-system-pagination-button"
                  >
                    <FaChevronRight />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MailSystem;
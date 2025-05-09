import React, { useState, useRef, useEffect } from "react";
import { 
  FaPaperPlane, 
  FaSpinner, 
  FaEye,
  FaEdit,
  FaPaperclip,
  FaTimes,
  FaImage,
  FaInfoCircle,
  FaUsers,
  FaUserCheck,
  FaUserTimes
} from "react-icons/fa";
import "./MailSystem.css";
import Sidebar from "./Sidebar";
import EmojiPicker from 'emoji-picker-react';
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

const MailSystem = () => {
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
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [emailsSent, setEmailsSent] = useState([]);
  const [totalSentEmails, setTotalSentEmails] = useState(0);
  
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const API_BASE_URL = 'http://localhost:4000/api';
  
  // Check for theme when component mounts
  useEffect(() => {
    const checkTheme = () => {
      setDarkMode(localStorage.getItem("adminTheme") === "dark");
    };
    
    checkTheme();
    window.addEventListener('storage', checkTheme);
    
    return () => {
      window.removeEventListener('storage', checkTheme);
    };
  }, []);
  
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
      formData.append("textContent", emailContent); // Make sure this matches what server expects
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
        
        // Add to sent emails list (for display purposes only)
        const newEmail = {
          id: Date.now(),
          subject,
          recipientType: selectedRecipients,
          sentAt: new Date().toISOString(),
          recipientCount: data.recipientCount
        };
        
        setEmailsSent(prev => [newEmail, ...prev]);
        setTotalSentEmails(prev => prev + 1);
        
        // Clear form after successful send
        setSubject("");
        setEmailContent("");
        setAttachments([]);
        setPhotoAttachments([]);
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
  
  const getRecipientTypeLabel = (type) => {
    switch(type) {
      case 'all': return 'All Users';
      case 'active': return 'Verified Users';
      case 'inactive': return 'Unverified Users';
      default: return type;
    }
  };
  
  const getRecipientTypeIcon = (type) => {
    switch(type) {
      case 'all': return <FaUsers />;
      case 'active': return <FaUserCheck />;
      case 'inactive': return <FaUserTimes />;
      default: return <FaUsers />;
    }
  };

  return (
    <div className={`admin-dashboard ${darkMode ? 'admin-dash-dark-mode' : ''}`}>
      <Sidebar />
      
      <div className="admin-dash-mail-system">
        <div className="admin-dash-mail-header">
          <div className="admin-dash-mail-header-content">
            <h1>Central Mailing System</h1>
            <p>Communicate with your users via email broadcasts</p>
          </div>
          <img 
            src={darkMode ? logoDark : logoLight} 
            alt="NextYouth Admin" 
            className="admin-dash-mail-logo" 
          />
        </div>

        {error && <div className="admin-dash-mail-alert admin-dash-mail-error">{error}</div>}
        {success && <div className="admin-dash-mail-alert admin-dash-mail-success">{success}</div>}

        <div className="admin-dash-mail-content">
          {previewMode ? (
            <div className="admin-dash-mail-preview">
              <div className="admin-dash-mail-preview-header">
                <h2>Email Preview</h2>
                <button onClick={handlePreview} className="admin-dash-mail-btn admin-dash-mail-btn-secondary">
                  <FaEdit /> Back to Edit
                </button>
              </div>
              <div className="admin-dash-mail-preview-subject">
                <strong>Subject:</strong> {subject}
              </div>
              <div className="admin-dash-mail-preview-body">
                {formatEmailPreview(emailContent)}
                
                {photoAttachments.length > 0 && (
                  <div className="admin-dash-mail-preview-photos">
                    <h4>Images ({photoAttachments.length}):</h4>
                    <div className="admin-dash-mail-photo-grid">
                      {photoAttachments.map((photo, index) => (
                        <div key={index} className="admin-dash-mail-photo-item">
                          <img 
                            src={URL.createObjectURL(photo)} 
                            alt={`Preview ${index+1}`} 
                            className="admin-dash-mail-photo-img" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {attachments.length > 0 && (
                  <div className="admin-dash-mail-preview-attachments">
                    <h4>Attachments ({attachments.length}):</h4>
                    <ul className="admin-dash-mail-file-list">
                      {attachments.map((file, index) => (
                        <li key={index} className="admin-dash-mail-file-item">
                          <span className="admin-dash-mail-file-name">{file.name}</span>
                          <span className="admin-dash-mail-file-size">({Math.round(file.size / 1024)} KB)</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendMail} className="admin-dash-mail-form">
              <div className="admin-dash-mail-form-group">
                <label htmlFor="recipients">
                  <FaUsers /> Recipients:
                </label>
                <select 
                  id="recipients" 
                  value={selectedRecipients} 
                  onChange={(e) => setSelectedRecipients(e.target.value)}
                  className="admin-dash-mail-select"
                >
                  <option value="all">All Users</option>
                  <option value="active">Verified Users Only</option>
                  <option value="inactive">Unverified Users Only</option>
                </select>
              </div>

              <div className="admin-dash-mail-form-group">
                <label htmlFor="subject">
                  <FaPaperPlane /> Subject:
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  required
                  className="admin-dash-mail-input"
                />
              </div>

              <div className="admin-dash-mail-form-group">
                <label htmlFor="emailContent">
                  <FaEdit /> Email Body:
                </label>
                <div className="admin-dash-mail-textarea-container">
                  <textarea
                    id="emailContent"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Enter your email content here..."
                    required
                    className="admin-dash-mail-textarea"
                    rows="12"
                  />
                  
                  <button 
                    type="button" 
                    className="admin-dash-mail-emoji-btn"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    😊
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="admin-dash-mail-emoji-picker">
                      <div className="admin-dash-mail-emoji-backdrop" onClick={() => setShowEmojiPicker(false)}></div>
                      <EmojiPicker
                        onEmojiClick={handleEmojiSelect}
                        disableAutoFocus={true}
                        native={true}
                      />
                    </div>
                  )}
                </div>
                <p className="admin-dash-mail-helper">
                  Type your message using regular text format. Use line breaks for new paragraphs.
                </p>
              </div>

              <div className="admin-dash-mail-form-group">
                <label>
                  <FaPaperclip /> Photos & Attachments:
                </label>
                <div className="admin-dash-mail-upload">
                  <button 
                    type="button" 
                    className="admin-dash-mail-btn admin-dash-mail-upload-btn"
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
                    className="admin-dash-mail-btn admin-dash-mail-upload-btn"
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
                </div>
                <p className="admin-dash-mail-helper">
                  <FaInfoCircle /> Maximum total size: 10MB
                </p>
                
                {photoAttachments.length > 0 && (
                  <div className="admin-dash-mail-photos">
                    <h4>Selected Photos ({photoAttachments.length})</h4>
                    <div className="admin-dash-mail-photo-grid">
                      {photoAttachments.map((photo, index) => (
                        <div key={index} className="admin-dash-mail-photo-item">
                          <img 
                            src={URL.createObjectURL(photo)} 
                            alt={`Photo ${index+1}`}
                            className="admin-dash-mail-photo-img" 
                          />
                          <button 
                            type="button"
                            className="admin-dash-mail-photo-remove"
                            onClick={() => removePhotoAttachment(index)}
                            title="Remove photo"
                          >
                            <FaTimes />
                          </button>
                          <span className="admin-dash-mail-photo-size">
                            {Math.round(photo.size / 1024)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {attachments.length > 0 && (
                  <div className="admin-dash-mail-files">
                    <h4>Selected Files ({attachments.length})</h4>
                    <ul className="admin-dash-mail-file-list">
                      {attachments.map((file, index) => (
                        <li key={index} className="admin-dash-mail-file-item">
                          <span className="admin-dash-mail-file-name">{file.name}</span>
                          <span className="admin-dash-mail-file-size">({Math.round(file.size / 1024)} KB)</span>
                          <button 
                            type="button"
                            className="admin-dash-mail-file-remove"
                            onClick={() => removeAttachment(index)}
                            title="Remove file"
                          >
                            <FaTimes />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="admin-dash-mail-buttons">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="admin-dash-mail-btn admin-dash-mail-btn-secondary"
                  disabled={sending || !subject || !emailContent}
                >
                  <FaEye /> Preview Email
                </button>
                <button
                  type="submit"
                  className="admin-dash-mail-btn admin-dash-mail-btn-primary"
                  disabled={sending || !subject || !emailContent}
                >
                  {sending ? (
                    <>
                      <FaSpinner className="admin-dash-mail-spinner" /> Sending...
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
          
          {/* Email sending history - visible only when there are sent emails */}
          {emailsSent.length > 0 && (
            <div className="admin-dash-mail-history">
              <h3>Recent Email Campaigns</h3>
              <div className="admin-dash-mail-table">
                <div className="admin-dash-mail-table-header">
                  <div className="admin-dash-mail-table-cell">Subject</div>
                  <div className="admin-dash-mail-table-cell">Recipients</div>
                  <div className="admin-dash-mail-table-cell">Sent</div>
                  <div className="admin-dash-mail-table-cell">Count</div>
                </div>
                
                {emailsSent.slice((currentPage-1)*5, currentPage*5).map(email => (
                  <div key={email.id} className="admin-dash-mail-table-row">
                    <div className="admin-dash-mail-table-cell">{email.subject}</div>
                    <div className="admin-dash-mail-table-cell">
                      {getRecipientTypeIcon(email.recipientType)}
                      {getRecipientTypeLabel(email.recipientType)}
                    </div>
                    <div className="admin-dash-mail-table-cell">
                      {new Date(email.sentAt).toLocaleString()}
                    </div>
                    <div className="admin-dash-mail-table-cell">
                      {email.recipientCount} recipients
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {Math.ceil(emailsSent.length / 5) > 1 && (
                <div className="admin-dash-mail-pagination">
                  <button 
                    className="admin-dash-mail-page-button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ←
                  </button>
                  
                  {Array.from(
                    { length: Math.ceil(emailsSent.length / 5) },
                    (_, i) => i + 1
                  ).map(page => (
                    <button
                      key={page}
                      className={`admin-dash-mail-page-button ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    className="admin-dash-mail-page-button"
                    onClick={() => setCurrentPage(prev => 
                      Math.min(prev + 1, Math.ceil(emailsSent.length / 5))
                    )}
                    disabled={currentPage === Math.ceil(emailsSent.length / 5)}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailSystem;
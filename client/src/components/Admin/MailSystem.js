import React, { useState, useRef } from "react";
import axios from "axios";
import { 
  FaPaperPlane, 
  FaSpinner, 
  FaEye,
  FaEdit,
  FaPaperclip,
  FaTimes,
  FaImage
} from "react-icons/fa";
import "./MailSystem.css";
import Sidebar from "./Sidebar";

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
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const API_BASE_URL = 'http://localhost:4000/api';
  
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
      
      // Log the request (for debugging)
      console.log("Sending email with:", {
        subject,
        recipientType: selectedRecipients,
        attachmentsCount: attachments.length,
        photosCount: photoAttachments.length
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

  return (
    <div className="admin-dashboard">
      <Sidebar />
      
      <div className="main-content">
        <div className="mail-system-container">
          <div className="mail-system-header">
            <h1>Central Mailing System</h1>
            <p>Communicate with your users via email broadcasts</p>
          </div>

          {error && <div className="mail-system-error">{error}</div>}
          {success && <div className="mail-system-success">{success}</div>}

          <div className="mail-content-area">
            {previewMode ? (
              <div className="email-preview-container">
                <div className="preview-header">
                  <h2>Email Preview</h2>
                  <button onClick={handlePreview} className="btn-secondary">
                    <FaEdit /> Back to Edit
                  </button>
                </div>
                <div className="email-preview">
                  <div className="preview-subject">
                    <strong>Subject:</strong> {subject}
                  </div>
                  <div className="preview-body">
                    {formatEmailPreview(emailContent)}
                    
                    {photoAttachments.length > 0 && (
                      <div className="preview-photos">
                        <h4>Images ({photoAttachments.length}):</h4>
                        <div className="photo-preview-grid">
                          {photoAttachments.map((photo, index) => (
                            <div key={index} className="photo-preview-item">
                              <img 
                                src={URL.createObjectURL(photo)} 
                                alt={`Preview ${index+1}`} 
                                className="photo-preview" 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {attachments.length > 0 && (
                      <div className="preview-attachments">
                        <h4>Attachments ({attachments.length}):</h4>
                        <ul>
                          {attachments.map((file, index) => (
                            <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMail} className="mail-form">
                <div className="form-group">
                  <label htmlFor="recipients">Recipients:</label>
                  <select 
                    id="recipients" 
                    value={selectedRecipients} 
                    onChange={(e) => setSelectedRecipients(e.target.value)}
                    className="select-recipients"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Verified Users Only</option>
                    <option value="inactive">Unverified Users Only</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject:</label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    required
                    className="subject-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailContent">Email Body:</label>
                  <textarea
                    id="emailContent"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Enter your email content here..."
                    required
                    className="email-content-textarea"
                    rows="12"
                  />
                  <p className="helper-text">
                    Type your message using regular text format. Use line breaks for new paragraphs.
                  </p>
                </div>

                <div className="form-group">
                  <label>Photos & Attachments:</label>
                  <div className="file-upload-container">
                    <button 
                      type="button" 
                      className="photo-button"
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
                      className="file-input"
                      style={{ display: 'none' }}
                    />
                    
                    <button 
                      type="button" 
                      className="attachment-button"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <FaPaperclip /> Add Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAttachmentChange}
                      multiple
                      className="file-input"
                      style={{ display: 'none' }}
                    />
                    <span className="helper-text">
                      Maximum total size: 10MB
                    </span>
                  </div>
                  
                  {photoAttachments.length > 0 && (
                    <div className="photo-gallery">
                      <h4>Selected Photos ({photoAttachments.length})</h4>
                      <div className="photo-grid">
                        {photoAttachments.map((photo, index) => (
                          <div key={index} className="photo-item">
                            <img 
                              src={URL.createObjectURL(photo)} 
                              alt={`Photo ${index+1}`}
                              className="photo-thumbnail" 
                            />
                            <button 
                              type="button"
                              className="remove-photo"
                              onClick={() => removePhotoAttachment(index)}
                              title="Remove photo"
                            >
                              <FaTimes />
                            </button>
                            <span className="photo-size">
                              {Math.round(photo.size / 1024)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {attachments.length > 0 && (
                    <div className="attachment-list">
                      <h4>Selected Files ({attachments.length})</h4>
                      <ul>
                        {attachments.map((file, index) => (
                          <li key={index} className="attachment-item">
                            <span className="attachment-name">{file.name}</span>
                            <span className="attachment-size">({Math.round(file.size / 1024)} KB)</span>
                            <button 
                              type="button"
                              className="remove-attachment"
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

                <div className="button-group">
                  <button
                    type="button"
                    onClick={handlePreview}
                    className="btn-secondary"
                    disabled={sending || !subject || !emailContent}
                  >
                    <FaEye /> Preview Email
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={sending || !subject || !emailContent}
                  >
                    {sending ? (
                      <>
                        <FaSpinner className="spinner" /> Sending...
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
        </div>
      </div>
    </div>
  );
};

export default MailSystem;
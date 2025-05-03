import React, { useState } from "react";
import axios from "axios";
import { FaPaperPlane, FaSpinner } from "react-icons/fa";
import "./MailSystem.css";

const MailSystem = () => {
  const [subject, setSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState("all"); // "all", "active", "inactive"
  
  const handleSendMail = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError("Subject cannot be empty");
      return;
    }

    if (!emailContent.trim()) {
      setError("Email body cannot be empty");
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccess("");

      // Send to backend endpoint
      const response = await axios.post(
        "http://localhost:4000/api/admin/send-mass-email", // Make sure this URL matches your server
        {
          subject,
          htmlContent: emailContent,
          recipientType: selectedRecipients
        }, 
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
          },
          withCredentials: true // Important for cookies if you use them
        }
      );

      setSending(false);
      setSuccess(`Email successfully sent to ${response.data.recipientCount} recipients!`);
      
      // Clear form
      setSubject("");
      setEmailContent("");
      
    } catch (err) {
      setSending(false);
      setError(err.response?.data?.message || "Failed to send email. Please try again.");
      console.error("Error sending email:", err);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="mail-system-container">
      <div className="mail-system-header">
        <h1>Central Mailing System</h1>
        <p>Compose and send emails to all registered users</p>
      </div>

      {error && <div className="mail-system-error">{error}</div>}
      {success && <div className="mail-system-success">{success}</div>}

      {previewMode ? (
        <div className="email-preview">
          <div className="preview-header">
            <h2>Email Preview</h2>
            <button onClick={handlePreview} className="btn-secondary">
              Back to Edit
            </button>
          </div>
          <div className="preview-subject">
            <strong>Subject:</strong> {subject}
          </div>
          <div className="preview-body">
            <div dangerouslySetInnerHTML={{ __html: emailContent }} />
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
              <option value="active">Active Users Only</option>
              <option value="inactive">Inactive Users Only</option>
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
              placeholder="Enter your email content here... (HTML is supported)"
              required
              className="email-content-textarea"
              rows="12"
            />
            <p className="helper-text">You can use HTML tags for formatting.</p>
          </div>

          <div className="button-group">
            <button
              type="button"
              onClick={handlePreview}
              className="btn-secondary"
              disabled={sending}
            >
              Preview Email
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={sending}
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
  );
};

export default MailSystem;
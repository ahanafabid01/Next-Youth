import React, { useState } from "react";
import axios from "axios";
import { 
  FaPaperPlane, 
  FaSpinner, 
  FaEye,
  FaEdit 
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
  const API_BASE_URL = 'http://localhost:4000/api';
  
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
        `${API_BASE_URL}/admin/send-mass-email`, 
        {
          subject,
          htmlContent: emailContent,
          recipientType: selectedRecipients
        }, 
        {
          headers: {
            "Content-Type": "application/json"
          },
          withCredentials: true
        }
      );

      // Add more detailed logging
      console.log("Email sending successful:", response.data);

      setSending(false);
      setSuccess(`Email successfully sent to ${response.data.recipientCount || 'multiple'} recipients!`);
      
      // Clear form
      setSubject("");
      setEmailContent("");
      
    } catch (err) {
      setSending(false);
      // Improved error handling
      console.error("Email sending error details:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to send email. Please try again.");
      console.error("Error sending email:", err);
    }
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  const getEmailPreview = (content) => {
    // Add your default header/footer to match what the backend will render
    return `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e0e0e0;">
          <h1 style="color: #3b82f6; margin-bottom: 5px;">Next Youth</h1>
        </div>
        
        <div style="padding: 20px 0;">
          ${content}
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #6c757d; font-size: 14px;">© ${new Date().getFullYear()} Next Youth. All rights reserved.</p>
        </div>
      </div>
    `;
  };

  return (
    <div className="admin-page">
      <Sidebar />
      
      <div className="admin-content">
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
                    <div dangerouslySetInnerHTML={{ __html: getEmailPreview(emailContent) }} />
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
                    placeholder="Enter your email content here... (HTML is supported)"
                    required
                    className="email-content-textarea"
                    rows="12"
                  />
                  <p className="helper-text">
                    You can use HTML tags for formatting: &lt;h1&gt; for headers, &lt;p&gt; for paragraphs, 
                    &lt;a href="..."&gt; for links, &lt;strong&gt; for bold text
                  </p>
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
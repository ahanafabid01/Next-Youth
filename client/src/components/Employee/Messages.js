import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaUserCircle,
  FaPaperPlane,
  FaRegClock,
  FaTimes,
  FaArrowLeft,
  FaPaperclip,
  FaSpinner,
  FaExclamationCircle,
  FaSearch,
} from "react-icons/fa";
import "./Messages.css";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const API_BASE_URL = "http://localhost:4000/api";
  const messageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
        withCredentials: true,
      });

      if (response.data.success) {
        setConversations(response.data.conversations);
      } else {
        setError("Failed to load conversations");
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
      setError("Error loading conversations. Please try again.");
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, navigate]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    try {
      setLoadingMessages(true);
      const response = await axios.get(
        `${API_BASE_URL}/messages/conversations/${conversationId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessages(response.data.messages);
      } else {
        setError("Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Error loading messages. Please try again.");
    } finally {
      setLoadingMessages(false);
    }
  }, [API_BASE_URL]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        alert(`File type not allowed: ${file.name}`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`File too large (max 5MB): ${file.name}`);
        return false;
      }
      return true;
    });

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  // Remove attachment
  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Select conversation
  const selectConversation = (conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
  };

  // Send a new message
  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !activeConversation) return;

    try {
      setSendingMessage(true);
      
      // Handle file uploads if any
      let uploadedAttachments = [];
      if (attachments.length > 0) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append('file', file);
          
          const uploadResponse = await axios.post(
            `${API_BASE_URL}/auth/upload-file`,
            formData,
            { withCredentials: true }
          );
          
          if (uploadResponse.data.success) {
            uploadedAttachments.push({
              filename: file.name,
              path: uploadResponse.data.url,
              mimetype: file.type
            });
          }
        }
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/messages/send`,
        {
          conversationId: activeConversation._id,
          content: newMessage.trim(),
          attachments: uploadedAttachments,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setMessages((prev) => [...prev, response.data.message]);
        setNewMessage("");
        setAttachments([]);
      } else {
        setError("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Error sending message. Please try again.");
    } finally {
      setSendingMessage(false);
    }
  };

  // Format date for display
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If today, return only time
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    // If yesterday, return "Yesterday" and time
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    // Otherwise, return full date
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for conversation list
  const formatConversationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // If today, return only time
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    // If yesterday, return "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    // If within the past week, return day name
    if (now - date < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    // Otherwise, return date
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
    
    // Set up periodic refresh of conversations
    const intervalId = setInterval(fetchConversations, 30000); // every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchConversations]);

  // Scroll to bottom of messages when they change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conversation) =>
    conversation.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="messages-container">
      <div className="messages-header">
        <h1>Messages</h1>
        <p>Communicate with employers about your accepted applications</p>
      </div>

      <div className="messages-content">
        <div className={`conversations-panel ${activeConversation ? "hidden-mobile" : ""}`}>
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-spinner">
              <FaSpinner className="spinning" />
              <p>Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <FaExclamationCircle />
              <p>{error}</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
              <p className="hint-text">
                When employers accept your job applications, you can start conversations here.
              </p>
            </div>
          ) : (
            <div className="conversations-list">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`conversation-item ${
                    activeConversation && activeConversation._id === conversation._id ? "active" : ""
                  } ${conversation.unreadCount > 0 ? "unread" : ""}`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.participant.profilePicture ? (
                      <img
                        src={conversation.participant.profilePicture}
                        alt={conversation.participant.name}
                      />
                    ) : (
                      <FaUserCircle />
                    )}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h3>{conversation.participant.name}</h3>
                      <span className="conversation-time">
                        {conversation.lastMessage
                          ? formatConversationDate(conversation.lastMessage.createdAt)
                          : formatConversationDate(conversation.updatedAt)}
                      </span>
                    </div>
                    <p className="conversation-job">
                      {conversation.jobId ? conversation.jobId.title : "Job"}
                    </p>
                    {conversation.lastMessage && (
                      <p className="conversation-preview">
                        {conversation.lastMessage.content.length > 30
                          ? `${conversation.lastMessage.content.substring(0, 30)}...`
                          : conversation.lastMessage.content}
                      </p>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="unread-badge">{conversation.unreadCount}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`message-panel ${!activeConversation ? "hidden-mobile" : ""}`}>
          {!activeConversation ? (
            <div className="no-conversation-selected">
              <p>Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <div className="message-header">
                <button
                  className="back-button mobile-only"
                  onClick={() => setActiveConversation(null)}
                >
                  <FaArrowLeft />
                </button>
                <div className="conversation-avatar">
                  {activeConversation.participant.profilePicture ? (
                    <img
                      src={activeConversation.participant.profilePicture}
                      alt={activeConversation.participant.name}
                    />
                  ) : (
                    <FaUserCircle />
                  )}
                </div>
                <div>
                  <h3>{activeConversation.participant.name}</h3>
                  <p>{activeConversation.jobId && activeConversation.jobId.title}</p>
                </div>
              </div>

              <div className="messages-list" ref={messageContainerRef}>
                {loadingMessages ? (
                  <div className="loading-messages">
                    <FaSpinner className="spinning" />
                    <p>Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="no-messages">
                    <p>No messages yet</p>
                    <p className="hint-text">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <div
                        key={message._id}
                        className={`message-item ${
                          message.sender._id === activeConversation.participant._id
                            ? "received"
                            : "sent"
                        }`}
                      >
                        <div className="message-content">
                          <p>{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="message-attachments">
                              {message.attachments.map((attachment, i) => (
                                <a
                                  key={i}
                                  href={attachment.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="attachment-link"
                                >
                                  <FaPaperclip />
                                  {attachment.filename}
                                </a>
                              ))}
                            </div>
                          )}
                          <span className="message-time">
                            <FaRegClock /> {formatMessageDate(message.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="message-compose">
                {attachments.length > 0 && (
                  <div className="attachments-preview">
                    {attachments.map((file, index) => (
                      <div key={index} className="attachment-item">
                        <span className="attachment-name">{file.name}</span>
                        <button
                          className="remove-attachment"
                          onClick={() => removeAttachment(index)}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="compose-input-container">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  <button
                    className="attachment-button"
                    onClick={() => fileInputRef.current.click()}
                    disabled={sendingMessage}
                  >
                    <FaPaperclip />
                  </button>

                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={sendingMessage}
                  />

                  <button
                    className="send-button"
                    onClick={sendMessage}
                    disabled={(!newMessage.trim() && attachments.length === 0) || sendingMessage}
                  >
                    {sendingMessage ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
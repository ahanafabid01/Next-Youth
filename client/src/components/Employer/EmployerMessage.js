import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { 
  FaSearch, 
  FaPaperPlane, 
  FaEllipsisV, 
  FaUser, 
  FaCheck, 
  FaCheckDouble, 
  FaFile, 
  FaPaperclip,
  FaSmile,
  FaSpinner,
  FaArrowLeft,
  FaDownload,
  FaImage,
  FaCircle
} from "react-icons/fa";
import "./EmployerMessage.css";
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

// Socket connection
const ENDPOINT = "http://localhost:4000";
let socket;

const EmployerMessage = ({ darkMode }) => {
  // State for conversations and messages
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  
  // Initialize socket connection
  useEffect(() => {
    socket = io(ENDPOINT);
    
    socket.on("connect", () => {
      console.log("Socket connected");
    });
    
    socket.on("new_message", (message) => {
      // Handle new incoming message
      if (activeConversation && message.conversationId === activeConversation._id) {
        setMessages(prev => [...prev, message]);
        // Mark message as read if from the active conversation
        markMessageAsRead(message._id);
      } else {
        // Update unread count for other conversations
        setUnreadCounts(prev => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1
        }));
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [activeConversation]);
  
  // Add to useEffect that handles active conversation changes
  useEffect(() => {
    if (activeConversation && socket.connected) {
      // Join the conversation room for real-time updates
      socket.emit('join_conversation', activeConversation._id);
      console.log(`Joined conversation: ${activeConversation._id}`);
    }
  }, [activeConversation]);
  
  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
    
    // Check for mobile view
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/api/messages/conversations", {
        withCredentials: true
      });
      
      if (response.data.success) {
        setConversations(response.data.conversations);
        
        // Get unread counts for each conversation
        const counts = {};
        for (const conv of response.data.conversations) {
          const countResponse = await axios.get(`http://localhost:4000/api/messages/unread-count/${conv._id}`, {
            withCredentials: true
          });
          if (countResponse.data.success) {
            counts[conv._id] = countResponse.data.count;
          }
        }
        setUnreadCounts(counts);
        
        // Set active conversation if none is selected
        if (!activeConversation && response.data.conversations.length > 0) {
          setActiveConversation(response.data.conversations[0]);
          fetchMessages(response.data.conversations[0]._id, 1);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
    }
  };
  
  // Fetch messages for a conversation
  const fetchMessages = async (conversationId, page = 1, append = false) => {
    try {
      setLoadingMore(true);
      const response = await axios.get(`http://localhost:4000/api/messages/${conversationId}`, {
        params: { page, limit: 20 },
        withCredentials: true
      });
      
      if (response.data.success) {
        if (append) {
          setMessages(prev => [...response.data.messages.reverse(), ...prev]);
        } else {
          setMessages(response.data.messages.reverse());
        }
        setHasMore(response.data.hasMore);
        setPage(page);
        
        // Mark messages as read
        markConversationAsRead(conversationId);
      }
      setLoadingMore(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoadingMore(false);
    }
  };
  
  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    setShowConversations(false); // Hide sidebar on mobile
    setPage(1);
    fetchMessages(conversation._id, 1);
    setUnreadCounts(prev => ({
      ...prev,
      [conversation._id]: 0
    }));
  };
  
  // Load more messages (pagination)
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchMessages(activeConversation._id, page + 1, true);
  };
  
  // Send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      const response = await axios.post(
        "http://localhost:4000/api/messages",
        {
          conversationId: activeConversation._id,
          content: newMessage,
          receiverId: activeConversation.participants.find(
            p => p._id !== localStorage.getItem("userId")
          )._id
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Add the new message to the state
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage("");
        
        // Focus back on input
        messageInputRef.current.focus();
        
        // Emit message through socket
        socket.emit("send_message", response.data.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  // Handle file uploads
  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (!file || !activeConversation) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', activeConversation._id);
    formData.append('receiverId', activeConversation.participants.find(
      p => p._id !== localStorage.getItem("userId")
    )._id);

    try {
      const response = await axios.post(
        "http://localhost:4000/api/messages/attachment",
        formData,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        socket.emit("send_message", response.data.message);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setShowUploadOptions(false);
    }
  };
  
  // Mark a message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/messages/mark-read/${messageId}`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };
  
  // Mark all messages in a conversation as read
  const markConversationAsRead = async (conversationId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/messages/mark-conversation-read/${conversationId}`,
        {},
        { withCredentials: true }
      );
      
      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(
      p => p._id !== localStorage.getItem("userId")
    );
    
    return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Get other participant in conversation
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return { name: "Loading..." };
    return conversation.participants.find(p => p._id !== localStorage.getItem("userId")) || { name: "Unknown" };
  };
  
  // Render messages
  const renderMessages = () => {
    const userId = localStorage.getItem("userId");
    let lastSenderId = null;
    
    return messages.map((message, index) => {
      const isOwn = message.sender === userId;
      const showHeader = index === 0 || messages[index - 1].sender !== message.sender;
      const showAvatar = showHeader;
      lastSenderId = message.sender;
      
      // Get sender name
      const senderName = isOwn ? 'You' : getOtherParticipant(activeConversation).name;
      
      return (
        <div 
          key={message._id}
          className={`employer-message-bubble ${isOwn ? "employer-message-own" : "employer-message-other"}`}
        >
          {showHeader && !isOwn && (
            <div className="employer-message-sender-name">
              {senderName}
            </div>
          )}
          
          {!isOwn && showAvatar && (
            <div className="employer-message-avatar">
              {activeConversation && getOtherParticipant(activeConversation).profilePicture ? (
                <img src={getOtherParticipant(activeConversation).profilePicture} alt="User" />
              ) : (
                <FaUser />
              )}
            </div>
          )}
          
          <div className="employer-message-content-wrapper">
            <div className="employer-message-content">
              {message.content}
              
              {message.attachment && (
                <div className="employer-message-attachment">
                  {message.attachment.type && message.attachment.type.startsWith("image") ? (
                    <div className="employer-message-image-attachment">
                      <img src={message.attachment.url} alt="Attachment" />
                      <a href={message.attachment.url} download target="_blank" rel="noreferrer">
                        <FaDownload />
                      </a>
                    </div>
                  ) : (
                    <div className="employer-message-file-attachment">
                      <FaFile />
                      <span>{message.attachment.filename || "File"}</span>
                      <a href={message.attachment.url} download target="_blank" rel="noreferrer">
                        <FaDownload />
                      </a>
                    </div>
                  )}
                </div>
              )}
              
              <div className="employer-message-timestamp">
                {formatTimestamp(message.createdAt)}
                {isOwn && (
                  <span className="employer-message-status">
                    {message.read ? <FaCheckDouble /> : <FaCheck />}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={`employer-message-container ${darkMode ? "employer-message-dark" : ""}`}>
      <div 
        className={`
          employer-message-sidebar 
          ${mobileView && !showConversations ? "employer-message-sidebar-hidden" : ""}
        `}
      >
        <div className="employer-message-header">
          <div className="employer-message-logo">
            <img src={darkMode ? logoDark : logoLight} alt="Next Youth" />
          </div>
          <h2>Messages</h2>
        </div>
        
        <div className="employer-message-search">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        
        <div className="employer-message-conversations-list">
          {loading ? (
            <div className="employer-message-loading">
              <FaSpinner className="employer-message-spin" />
              <p>Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              const isActive = activeConversation && conversation._id === activeConversation._id;
              const unreadCount = unreadCounts[conversation._id] || 0;
              
              return (
                <div 
                  key={conversation._id}
                  className={`employer-message-conversation-item ${isActive ? "employer-message-active" : ""}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="employer-message-conversation-avatar">
                    {otherParticipant.profilePicture ? (
                      <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
                    ) : (
                      <FaUser />
                    )}
                    
                    {otherParticipant.isOnline && (
                      <div className="employer-message-online-status"></div>
                    )}
                  </div>
                  
                  <div className="employer-message-conversation-info">
                    <div className="employer-message-conversation-top">
                      <h4>{otherParticipant.name}</h4>
                      <span className="employer-message-time">
                        {conversation.lastMessage ? formatTimestamp(conversation.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    
                    <div className="employer-message-conversation-bottom">
                      <p>
                        {conversation.lastMessage ? (
                          conversation.lastMessage.content 
                            ? (conversation.lastMessage.content.length > 28
                              ? conversation.lastMessage.content.substring(0, 28) + "..."
                              : conversation.lastMessage.content)
                            : (conversation.lastMessage.attachment 
                              ? (conversation.lastMessage.attachment.type.startsWith("image") 
                                ? "📷 Image" 
                                : "📎 File") 
                              : "No message")
                        ) : "Start a conversation"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="employer-message-empty-state">
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>
      
      <div 
        className={`
          employer-message-chat-container 
          ${mobileView && showConversations ? "employer-message-chat-hidden" : ""}
        `}
      >
        {activeConversation ? (
          <>
            <div className="employer-message-chat-header">
              {mobileView && (
                <button 
                  className="employer-message-back-btn" 
                  onClick={() => setShowConversations(true)}
                >
                  <FaArrowLeft />
                </button>
              )}
              
              <div className="employer-message-chat-user">
                <div className="employer-message-chat-avatar">
                  {getOtherParticipant(activeConversation).profilePicture ? (
                    <img 
                      src={getOtherParticipant(activeConversation).profilePicture} 
                      alt={getOtherParticipant(activeConversation).name} 
                    />
                  ) : (
                    <FaUser />
                  )}
                  
                  {getOtherParticipant(activeConversation).isOnline && (
                    <div className="employer-message-online-status"></div>
                  )}
                </div>
                
                <div className="employer-message-chat-user-info">
                  <h3>{getOtherParticipant(activeConversation).name}</h3>
                  <span>
                    {getOtherParticipant(activeConversation).isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              
              <div className="employer-message-chat-actions">
                <button className="employer-message-more-btn">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            
            <div className="employer-message-chat-body" ref={messagesContainerRef}>
              {hasMore && (
                <div className="employer-message-load-more">
                  <button onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <FaSpinner className="employer-message-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load older messages"
                    )}
                  </button>
                </div>
              )}
              
              {messages.length > 0 ? (
                <div className="employer-message-messages-container">
                  {renderMessages()}
                  <div ref={messagesEndRef} />
                </div>
              ) : loading ? (
                <div className="employer-message-loading">
                  <FaSpinner className="employer-message-spin" />
                  <p>Loading messages...</p>
                </div>
              ) : (
                <div className="employer-message-empty-chat">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>
            
            <div className="employer-message-chat-footer">
              <div className="employer-message-input-actions">
                <div className="employer-message-attachment-wrapper">
                  <button 
                    className="employer-message-attach-btn"
                    onClick={() => setShowUploadOptions(!showUploadOptions)}
                  >
                    <FaPaperclip />
                  </button>
                  
                  {showUploadOptions && (
                    <div className="employer-message-upload-options">
                      <button 
                        className="employer-message-upload-option"
                        onClick={() => imageInputRef.current.click()}
                      >
                        <FaImage /> Image
                      </button>
                      <button 
                        className="employer-message-upload-option"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FaFile /> File
                      </button>
                    </div>
                  )}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => handleFileUpload(e, 'file')}
                    style={{ display: 'none' }}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                  />
                  
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    onChange={(e) => handleFileUpload(e, 'image')}
                    style={{ display: 'none' }}
                    accept="image/*"
                  />
                </div>
              </div>
              
              <div className="employer-message-input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  ref={messageInputRef}
                />
                
                <button className="employer-message-emoji-btn">
                  <FaSmile />
                </button>
              </div>
              
              <button 
                className={`employer-message-send-btn ${!newMessage.trim() ? "employer-message-disabled" : ""}`}
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className="employer-message-no-chat-selected">
            <div className="employer-message-no-chat-content">
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerMessage;
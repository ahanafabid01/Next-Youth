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
  FaCircle,
  FaMicrophone
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
  const [currentUser, setCurrentUser] = useState(null);
  
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

    // Get current user information
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/auth/profile", { 
          withCredentials: true 
        });
        if (response.data.success) {
          const user = response.data.user;
          setCurrentUser(user);
          
          // Store user ID in localStorage for convenience
          localStorage.setItem("userId", user._id);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
    
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
  
  // Get other participant in conversation - FIXED FUNCTION
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return { name: "Loading..." };
    
    // Use currentUser._id directly instead of relying on localStorage
    const myId = currentUser?._id;
    if (!myId) return { name: "Loading..." };
    
    // Find the participant that isn't the current user
    return conversation.participants.find(p => p._id !== myId) || { name: "Unknown" };
  };
  
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
          receiverId: getOtherParticipant(activeConversation)._id
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
    formData.append('receiverId', getOtherParticipant(activeConversation)._id);

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
    // Only run this if we have the currentUser properly loaded
    if (!currentUser) return true;
    
    const otherParticipant = getOtherParticipant(conv);
    
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
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
  
  // Check if a message is from the current user
  const isOwnMessage = (message) => {
    if (!currentUser || !message.sender) return false;
    return message.sender._id === currentUser._id;
  };
  
  // Render messages
  const renderMessages = () => {
    let lastDate = null;
    let lastSenderId = null;
    
    return messages.map((message, index) => {
      // Check if this is the user's own message
      const isOwn = isOwnMessage(message);
      
      // Determine if we should show the date header
      const messageDate = new Date(message.createdAt).toDateString();
      const showDate = lastDate !== messageDate;
      if (showDate) lastDate = messageDate;
      
      // Track sender for grouping (still needed for sender name display)
      const showSenderInfo = lastSenderId !== message.sender?._id;
      lastSenderId = message.sender?._id;
      
      // Get sender name (for non-own messages)
      const senderName = isOwn ? 'You' : (message.sender ? message.sender.name : 'Unknown');
      
      return (
        <React.Fragment key={message._id}>
          {showDate && (
            <div className="whatsapp-date-divider">
              <span>{new Date(message.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          
          <div className={`whatsapp-message ${isOwn ? "whatsapp-message-own" : "whatsapp-message-other"}`}>
            <div className={`whatsapp-bubble ${isOwn ? "whatsapp-bubble-own" : "whatsapp-bubble-other"}`}>
              {!isOwn && showSenderInfo && (
                <div className="whatsapp-sender-name">
                  {senderName}
                </div>
              )}
              
              <div className="whatsapp-message-content">
                {message.content}
                
                {message.attachment && (
                  <div className="whatsapp-attachment">
                    {message.attachment.type && message.attachment.type.startsWith("image") ? (
                      <div className="whatsapp-image-attachment">
                        <img src={message.attachment.url} alt="Attachment" />
                        <a href={message.attachment.url} download target="_blank" rel="noreferrer" 
                           className="whatsapp-download-btn">
                          <FaDownload />
                        </a>
                      </div>
                    ) : (
                      <div className="whatsapp-file-attachment">
                        <FaFile />
                        <span>{message.attachment.filename || "File"}</span>
                        <a href={message.attachment.url} download target="_blank" rel="noreferrer">
                          <FaDownload />
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="whatsapp-message-meta">
                  <span className="whatsapp-message-time">{formatTimestamp(message.createdAt)}</span>
                  {isOwn && (
                    <span className="whatsapp-message-status">
                      {message.read ? <FaCheckDouble /> : <FaCheck />}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className={`whatsapp-container ${darkMode ? "whatsapp-dark" : ""}`}>
      <div className={`whatsapp-sidebar ${mobileView && !showConversations ? "whatsapp-sidebar-hidden" : ""}`}>
        <div className="whatsapp-header">
          <div className="whatsapp-user-info">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt="Profile" className="whatsapp-profile-image" />
            ) : (
              <div className="whatsapp-default-avatar whatsapp-header-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <h2>Messages</h2>
          </div>
          <div className="whatsapp-header-actions">
            <button className="whatsapp-icon-button">
              <FaEllipsisV />
            </button>
          </div>
        </div>
        
        <div className="whatsapp-search">
          <div className="whatsapp-search-container">
            <FaSearch className="whatsapp-search-icon" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="whatsapp-chats">
          {loading ? (
            <div className="whatsapp-loading">
              <FaSpinner className="whatsapp-spinner" />
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
                  className={`whatsapp-chat-item ${isActive ? "whatsapp-active-chat" : ""}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="whatsapp-chat-avatar">
                    {otherParticipant.profilePicture ? (
                      <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
                    ) : (
                      <div className="whatsapp-default-avatar">
                        {otherParticipant.name ? otherParticipant.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </div>
                  
                  <div className="whatsapp-chat-details">
                    <div className="whatsapp-chat-header">
                      <h4>{otherParticipant.name}</h4>
                      <span className="whatsapp-chat-time">
                        {conversation.lastMessage ? formatTimestamp(conversation.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    
                    <div className="whatsapp-chat-message">
                      <p>
                        {conversation.lastMessage ? (
                          conversation.lastMessage.content 
                            ? (conversation.lastMessage.content.length > 40
                              ? conversation.lastMessage.content.substring(0, 40) + "..."
                              : conversation.lastMessage.content)
                            : (conversation.lastMessage.attachment 
                              ? (conversation.lastMessage.attachment.type && conversation.lastMessage.attachment.type.startsWith("image") 
                                ? "📷 Photo" 
                                : "📎 Document") 
                              : "No message")
                        ) : "Start a conversation"}
                      </p>
                      
                      {unreadCount > 0 && (
                        <div className="whatsapp-unread-count">{unreadCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="whatsapp-empty">
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>
      
      <div className={`whatsapp-chat ${mobileView && showConversations ? "whatsapp-chat-hidden" : ""}`}>
        {activeConversation ? (
          <>
            <div className="whatsapp-chat-header">
              {mobileView && (
                <button 
                  className="whatsapp-back-button"
                  onClick={() => setShowConversations(true)}
                >
                  <FaArrowLeft />
                </button>
              )}
              
              <div className="whatsapp-chat-user" onClick={() => {}}>
                <div className="whatsapp-chat-avatar">
                  {getOtherParticipant(activeConversation).profilePicture ? (
                    <img 
                      src={getOtherParticipant(activeConversation).profilePicture} 
                      alt={getOtherParticipant(activeConversation).name} 
                    />
                  ) : (
                    <div className="whatsapp-default-avatar">
                      {getOtherParticipant(activeConversation).name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="whatsapp-chat-user-info">
                  <h3>{getOtherParticipant(activeConversation).name}</h3>
                  <span className="whatsapp-user-status">
                    {getOtherParticipant(activeConversation).isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              
              <div className="whatsapp-chat-actions">
                <button className="whatsapp-icon-button">
                  <FaSearch />
                </button>
                <button className="whatsapp-icon-button">
                  <FaEllipsisV />
                </button>
              </div>
            </div>
            
            <div className="whatsapp-chat-body" ref={messagesContainerRef}>
              {hasMore && (
                <div className="whatsapp-load-more">
                  <button onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <FaSpinner className="whatsapp-spinner" />
                        Loading...
                      </>
                    ) : (
                      "Load older messages"
                    )}
                  </button>
                </div>
              )}
              
              <div className="whatsapp-messages">
                {messages.length > 0 ? renderMessages() : (
                  <div className="whatsapp-no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            <div className="whatsapp-chat-footer">
              <button 
                className="whatsapp-icon-button whatsapp-emoji"
                onClick={() => {}}
              >
                <FaSmile />
              </button>
              
              <button 
                className="whatsapp-icon-button whatsapp-attach"
                onClick={() => setShowUploadOptions(!showUploadOptions)}
              >
                <FaPaperclip />
              </button>
              
              {showUploadOptions && (
                <div className="whatsapp-upload-options">
                  <button 
                    className="whatsapp-upload-option"
                    onClick={() => imageInputRef.current.click()}
                  >
                    <div className="whatsapp-upload-icon whatsapp-photo-icon">
                      <FaImage />
                    </div>
                    <span>Photo</span>
                  </button>
                  <button 
                    className="whatsapp-upload-option"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className="whatsapp-upload-icon whatsapp-doc-icon">
                      <FaFile />
                    </div>
                    <span>Document</span>
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
              
              <div className="whatsapp-input-container">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  ref={messageInputRef}
                />
              </div>
              
              <button 
                className="whatsapp-icon-button whatsapp-send"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                {newMessage.trim() ? <FaPaperPlane /> : <FaMicrophone />}
              </button>
            </div>
          </>
        ) : (
          <div className="whatsapp-welcome">
            <div className="whatsapp-welcome-container">
              <div className="whatsapp-welcome-image"></div>
              <h1>Keep your phone connected</h1>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerMessage;
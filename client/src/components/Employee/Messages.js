import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBell, 
  FaUserCircle,
  FaChevronDown,
  FaEnvelope,
  FaPaperPlane,
  FaEllipsisV,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaSun,
  FaMoon,
  FaCircle,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram
} from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import './EmployeeDashboard.css';
import './Messages.css';

const Messages = () => {
  const navigate = useNavigate();
  const { socket, isUserOnline } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState({ name: '', profilePicture: '', isVerified: false });
  const [typingUsers, setTypingUsers] = useState({});
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("dashboard-theme") === "dark");
  const [unreadNotifications, setUnreadNotifications] = useState(() => parseInt(localStorage.getItem("unread-notifications") || "2"));
  
  const messageListRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const [userResponse, verificationResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/me`, { withCredentials: true }),
        axios.get(`${API_BASE_URL}/auth/verification-status`, { withCredentials: true })
      ]);
      
      if (userResponse.data.success) {
        const userData = userResponse.data.user;
        
        let verificationData = null;
        let verificationStatus = null;
        
        if (verificationResponse.data.success) {
          if (verificationResponse.data.verification) {
            verificationData = verificationResponse.data.verification;
            verificationStatus = verificationData.status;
          }
        }
        
        setUser({
          ...userData,
          idVerification: verificationData,
          isVerified: verificationStatus === 'verified'
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    }
  }, [API_BASE_URL, navigate]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/messages/conversations`, { 
        withCredentials: true 
      });
      
      if (response.data.success) {
        setConversations(response.data.conversations);
        
        // If there are conversations and none selected, select the first one
        if (response.data.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(response.data.conversations[0]);
          fetchMessages(response.data.conversations[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, selectedConversation]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/${conversationId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setMessages(response.data.messages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    }
  };

  // Send a new message using Socket.IO
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation || !socket) return;
    
    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', {
        conversationId: selectedConversation.id,
        isTyping: false
      });
    }
    
    // Emit the sendMessage event
    socket.emit('sendMessage', {
      conversationId: selectedConversation.id,
      text: newMessage.trim(),
      receiverId: selectedConversation.employer._id
    });
    
    // Optimistically add the message to UI
    const optimisticMessage = {
      _id: Date.now().toString(),
      conversationId: selectedConversation.id,
      senderId: {
        _id: user._id,
        name: user.name,
        profilePicture: user.profilePicture
      },
      text: newMessage.trim(),
      timestamp: new Date(),
      pending: true // Mark as pending until server confirms
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    }, 100);
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    
    // Join the conversation room
    if (socket) {
      socket.emit('joinConversation', conversation.id);
      // Mark messages as read when selecting a conversation
      socket.emit('markAsRead', {
        conversationId: conversation.id,
        senderId: conversation.employer._id
      });
    }
    
    fetchMessages(conversation.id);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !selectedConversation) return;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      // Only emit if we weren't already typing
      socket.emit('typing', {
        conversationId: selectedConversation.id,
        isTyping: true
      });
    }
    
    // Set a new timeout
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        conversationId: selectedConversation.id,
        isTyping: false
      });
      typingTimeoutRef.current = null;
    }, 2000);
  };

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return;

    // Handle receiving messages
    const handleReceiveMessage = (message) => {
      setMessages(prev => {
        // Check if this is a message we already have (from optimistic update)
        const messageExists = prev.some(m => 
          (!m._id.toString().includes('temp-') && m._id === message._id) || 
          (m.timestamp === message.timestamp && m.text === message.text)
        );
        
        if (messageExists) return prev;
        
        // If this is a new message, add it
        return [...prev, message];
      });
      
      // Update conversation list to show most recent message
      setConversations(prev => {
        return prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: {
                text: message.text,
                timestamp: message.timestamp
              },
              unreadCount: message.senderId._id !== user._id ? conv.unreadCount + 1 : conv.unreadCount
            };
          }
          return conv;
        }).sort((a, b) => {
          // Sort by most recent message
          return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
        });
      });
      
      // If message is in current conversation, mark as read
      if (selectedConversation?.id === message.conversationId && 
          message.senderId._id !== user._id) {
        socket.emit('markAsRead', {
          conversationId: message.conversationId,
          senderId: message.senderId._id
        });
      }
      
      scrollToBottom();
    };

    // Handle typing indicators
    const handleUserTyping = ({ userId, conversationId, isTyping }) => {
      if (selectedConversation?.id === conversationId) {
        setTypingUsers(prev => ({
          ...prev,
          [userId]: isTyping
        }));
      }
    };

    // Handle messages being read
    const handleMessagesRead = ({ conversationId, readBy }) => {
      if (readBy !== user._id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.senderId._id === user._id && !msg.read ? { ...msg, read: true } : msg
          )
        );
        
        // Update unread count in conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          )
        );
      }
    };

    // Handle new message notifications
    const handleNewMessageNotification = ({ message }) => {
      // Play notification sound
      const notificationSound = new Audio('/message-notification.mp3');
      notificationSound.play().catch(err => console.log('Error playing sound:', err));
      
      // Update unread counts if not in the conversation
      if (!selectedConversation || selectedConversation.id !== message.conversationId) {
        setConversations(prev => 
          prev.map(conv => 
            conv.id === message.conversationId ? 
              { ...conv, unreadCount: conv.unreadCount + 1 } : conv
          )
        );
      }
    };

    // Register event listeners
    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userTyping', handleUserTyping);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('newMessageNotification', handleNewMessageNotification);

    // Clean up
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('newMessageNotification', handleNewMessageNotification);
    };
  }, [socket, selectedConversation, user._id]);

  // Update dark mode
  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem("dashboard-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  // Handle outside clicks for dropdowns
  const handleOutsideClick = useCallback((event) => {
    if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
      setShowNotifications(false);
    }
    if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
      setShowProfileDropdown(false);
    }
    if (!event.target.closest('.dashboard-nav')) {
      setShowMobileNav(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [handleOutsideClick]);

  useEffect(() => {
    fetchUserData();
    fetchConversations();
  }, [fetchUserData, fetchConversations]);

  // Toggle functions
  const toggleMobileNav = useCallback((e) => {
    e.stopPropagation();
    setShowMobileNav(prev => !prev);
  }, []);

  const toggleProfileDropdown = useCallback((e) => {
    e.stopPropagation();
    setShowProfileDropdown(prev => !prev);
  }, []);

  const toggleNotifications = useCallback((e) => {
    e.stopPropagation();
    setShowNotifications(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const handleMarkAllAsRead = useCallback((e) => {
    e.stopPropagation();
    setUnreadNotifications(0);
    localStorage.setItem("unread-notifications", "0");
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
      if (response.data.success) navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }, [API_BASE_URL, navigate]);

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const isEmployerTyping = selectedConversation && 
    Object.entries(typingUsers).some(([id, isTyping]) => 
      id === selectedConversation.employer._id && isTyping
    );

  const currentYear = new Date().getFullYear();

  return (
    <div className={`employee-dashboard messages-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <header className="dashboard-header">
        <div className="dashboard-header-container">
          <div className="dashboard-header-left">
            <button 
              className="dashboard-nav-toggle"
              onClick={toggleMobileNav}
              aria-label="Toggle navigation"
            >
              ☰
            </button>
            <Link to="/" className="dashboard-logo">Next Youth</Link>
            
            <nav className={`dashboard-nav ${showMobileNav ? 'active' : ''}`}>
              <Link to="/find-jobs" className="nav-link">Find Work</Link>
              <Link to="/find-jobs/saved" className="nav-link">Saved Jobs</Link>
              <Link to="/find-jobs/proposals" className="nav-link">Proposals</Link>
              <Link to="/messages" className="nav-link active">Messages</Link>
              <Link to="/help" className="nav-link">Help</Link>
            </nav>
          </div>
          
          <div className="dashboard-header-right">
            <div className="message-container">
              <Link to="/messages" className="message-button" aria-label="Messages">
                <FaEnvelope />
              </Link>
            </div>
            
            <div className="notification-container" ref={notificationsRef}>
              <button 
                className="notification-button"
                onClick={toggleNotifications}
                aria-label="Notifications"
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    <button className="mark-all-read" onClick={handleMarkAllAsRead}>Mark all as read</button>
                  </div>
                  <div className="notification-list">
                    <div className="notification-item unread">
                      <div className="notification-icon">
                        {(!user.idVerification || 
                          !user.idVerification.frontImage || 
                          !user.idVerification.backImage || 
                          user.idVerification.status === 'rejected') ? (
                          <FaUserCircle />
                        ) : user.idVerification.status === 'verified' ? (
                          <FaCheckCircle />
                        ) : (
                          <FaClock />
                        )}
                      </div>
                      <div className="notification-content">
                        <p>
                          {(!user.idVerification || 
                            !user.idVerification.frontImage || 
                            !user.idVerification.backImage || 
                            user.idVerification.status === 'rejected') ? (
                            "Please verify your account"
                          ) : user.idVerification.status === 'verified' ? (
                            "Your profile has been verified!"
                          ) : (
                            "Your verification is pending approval"
                          )}
                        </p>
                        <span className="notification-time">2 hours ago</span>
                      </div>
                    </div>
                    <div className="notification-item unread">
                      <div className="notification-icon">
                        <FaEnvelope />
                      </div>
                      <div className="notification-content">
                        <p>New job matching your skills is available</p>
                        <span className="notification-time">1 day ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="notification-footer">
                    <Link to="/notifications">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="theme-toggle-button"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <FaSun /> : <FaMoon />}
            </button>

            <div className="profile-dropdown-container" ref={profileDropdownRef}>
              <button 
                className="profile-button" 
                onClick={toggleProfileDropdown}
                aria-label="User profile"
              >
                {user.profilePicture ? (
                  <img 
                    src={user.profilePicture}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <FaUserCircle className="profile-avatar-icon" />
                )}
                <FaChevronDown className={`dropdown-icon ${showProfileDropdown ? 'rotate' : ''}`} />
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <div className="profile-dropdown-header">
                    <div className="profile-dropdown-avatar">
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture}
                          alt={`${user.name}'s profile`}
                        />
                      ) : (
                        <FaUserCircle />
                      )}
                    </div>
                    <div className="profile-dropdown-info">
                      <h4>{user.name || 'User'}</h4>
                      <span className="profile-status">
                        {!user.idVerification ? (
                          'Not Verified'
                        ) : user.idVerification.status === 'verified' ? (
                          <><FaCheckCircle className="verified-icon" /> Verified</>
                        ) : user.idVerification.status === 'pending' && user.idVerification.frontImage && user.idVerification.backImage ? (
                          <><FaClock className="pending-icon" /> Verification Pending</>
                        ) : user.idVerification.status === 'rejected' ? (
                          <>Verification Rejected</>
                        ) : (
                          'Not Verified'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="profile-dropdown-links">
                    <button 
                      className="profile-dropdown-link"
                      onClick={() => navigate('/my-profile')}
                    >
                      <FaUserCircle /> View Profile
                    </button>
                    
                    {(!user.idVerification || 
                      !user.idVerification.frontImage || 
                      !user.idVerification.backImage || 
                      user.idVerification.status === 'rejected') && (
                      <button 
                        className="profile-dropdown-link"
                        onClick={() => navigate('/verify-account')}
                      >
                        Verify Account
                      </button>
                    )}
                    
                    <button 
                      className="profile-dropdown-link"
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </button>
                    <button 
                      className="profile-dropdown-link"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="messages-container">
        <div className="messages-sidebar">
          <div className="messages-sidebar-header">
            <h2>Messages</h2>
            <div className="messages-search-container">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search messages" 
                className="messages-search" 
              />
            </div>
          </div>

          <div className="conversations-list">
            {loading && conversations.length === 0 ? (
              <div className="loading-state">Loading conversations...</div>
            ) : error ? (
              <div className="error-state">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">
                <FaEnvelope className="empty-icon" />
                <p>No conversations yet</p>
                <p className="empty-hint">Your message threads with employers will appear here after your job applications are accepted</p>
              </div>
            ) : (
              conversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                  onClick={() => selectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.employer.profilePicture ? (
                      <img 
                        src={conversation.employer.profilePicture} 
                        alt={conversation.employer.name} 
                      />
                    ) : (
                      <FaUserCircle />
                    )}
                    {isUserOnline(conversation.employer._id) && (
                      <span className="online-indicator"></span>
                    )}
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <h3 className="conversation-name">
                        {conversation.employer.name}
                      </h3>
                      <span className="conversation-time">{formatLastMessageTime(conversation.lastMessage.timestamp)}</span>
                    </div>
                    <div className="conversation-preview">
                      <p>{conversation.lastMessage.text.length > 35 ? 
                        `${conversation.lastMessage.text.substring(0, 35)}...` : 
                        conversation.lastMessage.text}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="unread-count">{conversation.unreadCount}</span>
                      )}
                    </div>
                    <div className="conversation-job">
                      <span>Re: {conversation.job.title}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="messages-content">
          {!selectedConversation ? (
            <div className="no-conversation-selected">
              <FaEnvelope className="no-conversation-icon" />
              <h3>Select a conversation to start messaging</h3>
              <p>Messages are available for jobs where your application has been accepted</p>
            </div>
          ) : (
            <>
              <div className="messages-header">
                <div className="messages-header-info">
                  <div className="conversation-avatar large">
                    {selectedConversation.employer.profilePicture ? (
                      <img 
                        src={selectedConversation.employer.profilePicture} 
                        alt={selectedConversation.employer.name} 
                      />
                    ) : (
                      <FaUserCircle />
                    )}
                    {isUserOnline(selectedConversation.employer._id) && (
                      <span className="online-indicator"></span>
                    )}
                  </div>
                  <div className="messages-header-details">
                    <h2>{selectedConversation.employer.name}</h2>
                    <p>
                      {isUserOnline(selectedConversation.employer._id) ? (
                        <span className="online-status">
                          <FaCircle className="online-dot" /> Online
                        </span>
                      ) : (
                        "Re: " + selectedConversation.job.title
                      )}
                    </p>
                  </div>
                </div>
                <button className="messages-menu-button">
                  <FaEllipsisV />
                </button>
              </div>

              <div className="messages-list" ref={messageListRef}>
                {loading ? (
                  <div className="loading-state">Loading messages...</div>
                ) : error ? (
                  <div className="error-state">{error}</div>
                ) : messages.length === 0 ? (
                  <div className="empty-messages">
                    <p>No messages yet</p>
                    <p className="empty-hint">Send a message to start the conversation</p>
                  </div>
                ) : (
                  <>
                    {messages.map(message => (
                      <div 
                        key={message._id}
                        className={`message-item ${message.senderId._id === user._id ? 'outgoing' : 'incoming'}`}
                      >
                        {message.senderId._id !== user._id && (
                          <div className="message-avatar">
                            {selectedConversation.employer.profilePicture ? (
                              <img 
                                src={selectedConversation.employer.profilePicture} 
                                alt={selectedConversation.employer.name} 
                              />
                            ) : (
                              <FaUserCircle />
                            )}
                          </div>
                        )}
                        <div className={`message-bubble ${message.pending ? 'pending' : ''}`}>
                          <div className="message-text">{message.text}</div>
                          <div className="message-time">
                            {formatMessageTime(message.timestamp)}
                            {message.senderId._id === user._id && (
                              <span className="message-status">
                                {message.pending ? "• Sending" : message.read ? "• Read" : "• Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isEmployerTyping && (
                      <div className="message-item incoming">
                        <div className="message-avatar">
                          {selectedConversation.employer.profilePicture ? (
                            <img 
                              src={selectedConversation.employer.profilePicture} 
                              alt={selectedConversation.employer.name} 
                            />
                          ) : (
                            <FaUserCircle />
                          )}
                        </div>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <form className="message-input-container" onSubmit={sendMessage}>
                <input 
                  type="text"
                  className="message-input"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleTyping}
                  disabled={!socket}
                />
                <button 
                  type="submit" 
                  className="send-button"
                  disabled={!newMessage.trim() || !socket}
                >
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>For Freelancers</h3>
            <ul>
              <li><Link to="/find-jobs">Find Work</Link></li>
              <li><Link to="/resources">Resources</Link></li>
              <li><Link to="/freelancer-tips">Tips & Guides</Link></li>
              <li><Link to="/freelancer-forum">Community Forum</Link></li>
              <li><Link to="/freelancer-stories">Success Stories</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Resources</h3>
            <ul>
              <li><Link to="/help-center">Help Center</Link></li>
              <li><Link to="/webinars">Webinars</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/api-docs">Developer API</Link></li>
              <li><Link to="/partner-program">Partner Program</Link></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/leadership">Leadership</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-container">
            <div className="footer-logo">
              <Link to="/">Next Youth</Link>
            </div>
            
            <div className="footer-legal-links">
              <Link to="/terms">Terms of Service</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/accessibility">Accessibility</Link>
              <Link to="/sitemap">Site Map</Link>
            </div>
            
            <div className="footer-social">
              <a href="https://facebook.com" aria-label="Facebook">
                <FaFacebook />
              </a>
              <a href="https://twitter.com" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com" aria-label="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://instagram.com" aria-label="Instagram">
                <FaInstagram />
              </a>
            </div>
          </div>
          
          <div className="footer-copyright">
            <p>&copy; {currentYear} Next Youth. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Messages;
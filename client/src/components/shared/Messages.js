import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaPaperPlane, FaPlus, FaCommentAlt, FaArrowLeft, FaSpinner, FaBriefcase } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import NewConversation from './NewConversation';
import './Messages.css';

const Messages = ({ userType }) => {
  const { userId: urlUserId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(urlUserId || null);
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const [showConversation, setShowConversation] = useState(!!urlUserId);
  
  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch conversations (chat list)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        // Get conversations
        const endpoint = `${API_BASE_URL}/messages/conversations`;
        
        const response = await axios.get(endpoint, { withCredentials: true });
        
        if (response.data.success && response.data.conversations) {
          setConversations(response.data.conversations);
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
    
    // Set up socket event listeners for new messages
    if (socket) {
      socket.on('new-message', handleNewMessage);
      
      // Join user room to receive messages
      socket.emit('join-user-room');
    }
    
    return () => {
      if (socket) {
        socket.off('new-message', handleNewMessage);
      }
    };
  }, [socket, API_BASE_URL]);

  // Fetch additional user details when a conversation is selected
  useEffect(() => {
    if (!selectedConversationId) return;

    const fetchUserDetails = async () => {
      try {
        // Determine which endpoint to use based on user type
        let endpoint;
        if (userType === 'employer') {
          endpoint = `${API_BASE_URL}/messages/applicant-details/${selectedConversationId}`;
        } else {
          endpoint = `${API_BASE_URL}/messages/employer-details/${selectedConversationId}`;
        }
        
        const response = await axios.get(endpoint, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setSelectedUserDetails(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    // Find user details in conversations first
    const conversationUser = conversations.find(c => c.participant._id === selectedConversationId);
    if (conversationUser) {
      setSelectedUserDetails({
        ...conversationUser.participant,
        jobTitle: conversationUser.jobTitle || null,
        companyName: conversationUser.companyName || null
      });
    } else {
      fetchUserDetails();
    }
  }, [selectedConversationId, userType, conversations, API_BASE_URL]);

  // Handle new incoming message
  const handleNewMessage = (message) => {
    if (!message) return;
    
    // Update messages if in current conversation
    if (selectedConversationId === message.sender._id || selectedConversationId === message.receiver._id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update conversation list to show latest message
    setConversations(prevConversations => {
      const updatedConversations = [...prevConversations];
      const conversationIndex = updatedConversations.findIndex(
        c => c.participant._id === message.sender._id || c.participant._id === message.receiver._id
      );
      
      if (conversationIndex !== -1) {
        // Update existing conversation
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            read: message.read
          },
          unreadCount: selectedConversationId === message.sender._id ? 0 : 
            (updatedConversations[conversationIndex].unreadCount || 0) + 1
        };
      } else {
        // Add new conversation
        const isIncoming = message.sender._id !== selectedConversationId;
        const otherUser = isIncoming ? message.sender : message.receiver;
        
        updatedConversations.push({
          participant: {
            _id: otherUser._id,
            name: otherUser.name,
            profilePicture: otherUser.profilePicture
          },
          lastMessage: {
            content: message.content,
            createdAt: message.createdAt,
            read: !isIncoming
          },
          unreadCount: isIncoming ? 1 : 0
        });
      }
      
      // Sort by most recent message
      updatedConversations.sort((a, b) => {
        return new Date(b.lastMessage?.createdAt || 0) - new Date(a.lastMessage?.createdAt || 0);
      });
      
      return updatedConversations;
    });
  };

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversationId) return;

    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);
        const response = await axios.get(`${API_BASE_URL}/messages/${selectedConversationId}`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          setMessages(response.data.messages || []);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    fetchMessages();
    setShowConversation(true);
  }, [selectedConversationId, API_BASE_URL]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/messages/`, 
        { 
          recipientId: selectedConversationId, 
          content: newMessage.trim() 
        },
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.message) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show user-friendly error
      alert("Failed to send message. Please try again.");
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId);
  };

  // Back button handler for mobile view
  const handleBackToList = () => {
    setShowConversation(false);
    setSelectedConversationId(null);
  };

  // Get selected conversation details
  const selectedConversation = conversations.find(c => 
    c.participant && c.participant._id === selectedConversationId
  );

  return (
    <div className={`messages-container ${showConversation ? 'show-conversation' : ''}`}>
      {showNewConversation ? (
        <div className="new-conversation-container">
          <NewConversation 
            userType={userType}
            onConversationStart={(userId) => {
              setSelectedConversationId(userId);
              setShowNewConversation(false);
            }}
            onBack={() => setShowNewConversation(false)}
          />
        </div>
      ) : (
        <>
          <div className="messages-sidebar">
            <div className="messages-sidebar-header">
              <h2>Messages</h2>
              <button 
                className="new-conversation-button" 
                onClick={() => setShowNewConversation(true)}
              >
                <FaPlus />
              </button>
            </div>
            
            <div className="conversations-list">
              {loading ? (
                <div className="loading-conversations">
                  <FaSpinner className="spinning" />
                  <p>Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="no-conversations">
                  <FaCommentAlt style={{ fontSize: '24px', marginBottom: '12px', opacity: 0.6 }} />
                  <p>No conversations yet</p>
                  <button 
                    className="start-conversation-button"
                    onClick={() => setShowNewConversation(true)}
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                conversations.map(conversation => (
                  <div 
                    key={conversation.participant._id}
                    className={`conversation-item ${selectedConversationId === conversation.participant._id ? 'active' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => handleConversationSelect(conversation.participant._id)}
                  >
                    <div className="conversation-avatar">
                      {conversation.participant.profilePicture ? (
                        <img src={conversation.participant.profilePicture} alt={conversation.participant.name} />
                      ) : (
                        <div className="default-avatar">
                          {conversation.participant.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-header">
                        <h4>{conversation.participant.name || 'Unknown User'}</h4>
                        {conversation.lastMessage?.createdAt && (
                          <span className="conversation-time">
                            {new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      
                      {conversation.jobTitle && (
                        <p className="conversation-job-title">
                          <FaBriefcase className="job-icon" /> {conversation.jobTitle}
                        </p>
                      )}
                      
                      {conversation.lastMessage && (
                        <p className="conversation-last-message">
                          {conversation.lastMessage.content.length > 25
                            ? `${conversation.lastMessage.content.substring(0, 25)}...`
                            : conversation.lastMessage.content}
                        </p>
                      )}
                      
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="messages-content">
            {selectedConversationId ? (
              <>
                <div className="messages-header">
                  <button className="back-button" onClick={handleBackToList}>
                    <FaArrowLeft />
                  </button>
                  
                  {selectedUserDetails ? (
                    <div className="recipient-info">
                      <div className="recipient-avatar">
                        {selectedUserDetails.profilePicture ? (
                          <img src={selectedUserDetails.profilePicture} alt={selectedUserDetails.name} />
                        ) : (
                          <div className="default-avatar">
                            {selectedUserDetails.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="recipient-details">
                        <h3>{selectedUserDetails.name}</h3>
                        {userType === 'employee' && selectedUserDetails.companyName && (
                          <p className="recipient-company">{selectedUserDetails.companyName}</p>
                        )}
                        {selectedUserDetails.jobTitle && (
                          <p className="recipient-job">
                            <FaBriefcase className="job-icon" /> 
                            {userType === 'employer' ? 'Applied for: ' : 'Your application: '}
                            {selectedUserDetails.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="recipient-loading">
                      <FaSpinner className="spinning" />
                      <span>Loading...</span>
                    </div>
                  )}
                </div>
                
                <div className="messages-body">
                  {messagesLoading ? (
                    <div className="messages-loading">
                      <FaSpinner className="spinning" />
                      <p>Loading messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="no-messages-yet">
                      <FaCommentAlt className="no-messages-icon" />
                      <p>No messages yet</p>
                      <p className="no-messages-subtext">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <div className="message-list">
                      {messages.map((message, index) => {
                        const isSentByMe = message.sender._id !== selectedConversationId;
                        return (
                          <div 
                            key={message._id || index}
                            className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}
                          >
                            <p className="message-content">{message.content}</p>
                            <span className="message-time">
                              {new Date(message.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                <form className="message-input-form" onSubmit={sendMessage}>
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className={!newMessage.trim() ? "disabled" : ""}
                  >
                    <FaPaperPlane />
                  </button>
                </form>
              </>
            ) : (
              <div className="select-conversation">
                <FaCommentAlt className="select-conversation-icon" />
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the sidebar or start a new one</p>
                <button 
                  className="start-conversation-button"
                  onClick={() => setShowNewConversation(true)}
                >
                  Start a new conversation
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Messages;
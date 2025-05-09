import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUser, FaPaperPlane, FaPlus, FaCommentAlt, FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { useSocket } from '../../context/SocketContext';
import NewConversation from './NewConversation';
import './Messages.css';

const Messages = ({ userType }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const [showConversation, setShowConversation] = useState(false);
  
  const API_BASE_URL = 'http://localhost:4000/api';

  // Fetch conversations (chat list)
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        // Get conversations based on user type
        const endpoint = `${API_BASE_URL}/messages/conversations`;
        
        const response = await axios.get(endpoint, { withCredentials: true });
        
        if (response.data.success && response.data.conversations) {
          setConversations(response.data.conversations);
        } else {
          // Initialize with empty array if no conversations returned
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // Initialize with empty array on error
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
  }, [socket, userType, API_BASE_URL]);

  // Handle new incoming message
  const handleNewMessage = (message) => {
    if (!message) return;
    
    // Update messages if in current conversation
    if (selectedConversationId === message.sender || selectedConversationId === message.receiver) {
      setMessages(prev => [...(prev || []), message]);
    }
    
    // Update conversation list to show latest message
    setConversations(prevConversations => {
      if (!prevConversations) return [];
      
      return prevConversations.map(conv => {
        if (conv && (conv.userId === message.sender || conv.userId === message.receiver)) {
          return {
            ...conv,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: selectedConversationId === message.sender ? 0 : (conv.unreadCount || 0) + 1
          };
        }
        return conv;
      });
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
          content: newMessage.trim(), 
          receiver: selectedConversationId 
        },
        { withCredentials: true }
      );
      
      if (response.data.success && response.data.message) {
        setMessages(prev => [...(prev || []), response.data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
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
  const selectedConversation = conversations?.find(c => c?.userId === selectedConversationId) || null;

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
              ) : conversations?.length === 0 ? (
                <div className="no-conversations">
                  <FaCommentAlt style={{ fontSize: '24px', marginBottom: '12px', opacity: 0.6 }} />
                  <p>No conversations yet</p>
                  <button 
                    style={{ 
                      marginTop: '12px', 
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowNewConversation(true)}
                  >
                    Start a conversation
                  </button>
                </div>
              ) : (
                conversations?.map(conversation => (
                  <div 
                    key={conversation?.userId}
                    className={`conversation-item ${selectedConversationId === conversation?.userId ? 'active' : ''} ${conversation?.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => handleConversationSelect(conversation?.userId)}
                  >
                    <div className="conversation-avatar">
                      {conversation?.profilePicture ? (
                        <img src={conversation.profilePicture} alt={conversation.name} />
                      ) : (
                        <div className="default-avatar">
                          {conversation?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="conversation-details">
                      <div className="conversation-header">
                        <h4>{conversation?.name || 'Unknown User'}</h4>
                        {conversation?.lastMessageTime && (
                          <span className="conversation-time">
                            {new Date(conversation.lastMessageTime).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      
                      {userType === 'employee' && conversation?.companyName && (
                        <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#666' }}>
                          {conversation.companyName}
                        </p>
                      )}
                      
                      {conversation?.lastMessage && (
                        <p className="conversation-last-message">
                          {conversation.lastMessage}
                        </p>
                      )}
                      
                      {conversation?.unreadCount > 0 && (
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
                  
                  {selectedConversation ? (
                    <div className="recipient-info">
                      <div className="recipient-avatar">
                        {selectedConversation.profilePicture ? (
                          <img src={selectedConversation.profilePicture} alt={selectedConversation.name} />
                        ) : (
                          <div className="default-avatar">
                            {selectedConversation?.name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="recipient-details">
                        <h3>{selectedConversation.name}</h3>
                        {userType === 'employee' && selectedConversation.companyName && (
                          <p className="recipient-type">{selectedConversation.companyName}</p>
                        )}
                        {userType === 'employer' && selectedConversation.jobTitle && (
                          <p className="recipient-type">{selectedConversation.jobTitle}</p>
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
                  ) : messages?.length === 0 ? (
                    <div className="no-messages-yet">
                      <FaCommentAlt className="no-messages-icon" />
                      <p>No messages yet</p>
                      <p className="no-messages-subtext">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <div className="message-list">
                      {messages?.map((message, index) => (
                        <div 
                          key={message._id || index}
                          className={`message-bubble ${message.receiver === selectedConversationId ? 'sent' : 'received'}`}
                        >
                          <p className="message-content">{message.content}</p>
                          <span className="message-time">
                            {new Date(message.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      ))}
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Messages;
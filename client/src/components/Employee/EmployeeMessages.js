import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { FaUser, FaPaperPlane, FaSearch, FaSpinner, FaCheckCircle, FaRegClock } from 'react-icons/fa';
import './EmployeeMessages.css';

const EmployeeMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [user, setUser] = useState({});
  const messagesEndRef = useRef(null);
  const { socket, joinRoom } = useSocket();

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:4000/api/auth/me', {
          withCredentials: true
        });
        
        if (response.data.success) {
          setUser(response.data.user);
          joinRoom(response.data.user._id);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    
    fetchUserData();
  }, [joinRoom]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:4000/api/messages/conversations', {
          withCredentials: true
        });
        
        if (response.data.success) {
          setConversations(response.data.conversations);
        }
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
    
    // Refresh conversations periodically
    const intervalId = setInterval(fetchConversations, 60000); // every minute
    
    return () => clearInterval(intervalId);
  }, []);

  // Socket event for new messages
  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-message', (newMsg) => {
      // If the message belongs to the active conversation, add it to messages
      if (activeConversation && 
         (newMsg.sender._id === activeConversation.otherUser._id || 
          newMsg.receiver._id === activeConversation.otherUser._id)) {
        setMessages(prev => [...prev, newMsg]);
      }
      
      // Update conversations list to show latest message
      setConversations(prev => {
        const updatedConversations = [...prev];
        const conversationIndex = updatedConversations.findIndex(
          c => c.conversationId === newMsg.conversationId
        );
        
        if (conversationIndex !== -1) {
          // Update existing conversation
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            latestMessage: newMsg,
            unreadCount: activeConversation && 
                        activeConversation.conversationId === updatedConversations[conversationIndex].conversationId ? 
                        0 : updatedConversations[conversationIndex].unreadCount + 1
          };
        } else {
          // This is a new conversation, fetch all conversations again
          fetchConversations();
        }
        
        return updatedConversations;
      });
    });
    
    return () => {
      socket.off('new-message');
    };
  }, [socket, activeConversation]);

  // Fetch conversations function for use within the component
  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/messages/conversations', {
        withCredentials: true
      });
      
      if (response.data.success) {
        setConversations(response.data.conversations);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // Load messages when active conversation changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;
      
      try {
        const response = await axios.get(
          `http://localhost:4000/api/messages/${activeConversation.otherUser._id}`,
          { withCredentials: true }
        );
        
        if (response.data.success) {
          setMessages(response.data.messages);
          
          // Update unread count for this conversation
          setConversations(prev => {
            const updatedConversations = [...prev];
            const conversationIndex = updatedConversations.findIndex(
              c => c.conversationId === activeConversation.conversationId
            );
            
            if (conversationIndex !== -1) {
              updatedConversations[conversationIndex] = {
                ...updatedConversations[conversationIndex],
                unreadCount: 0
              };
            }
            
            return updatedConversations;
          });
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load messages");
      }
    };
    
    fetchMessages();
  }, [activeConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      setSendingMessage(true);
      
      const response = await axios.post(
        'http://localhost:4000/api/messages',
        {
          receiverId: activeConversation.otherUser._id,
          content: newMessage
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.message]);
        setNewMessage('');
        
        // Update conversations to show latest message
        setConversations(prev => {
          const updatedConversations = [...prev];
          const conversationIndex = updatedConversations.findIndex(
            c => c.conversationId === activeConversation.conversationId
          );
          
          if (conversationIndex !== -1) {
            updatedConversations[conversationIndex] = {
              ...updatedConversations[conversationIndex],
              latestMessage: response.data.message
            };
            
            // Move this conversation to the top
            const [conversation] = updatedConversations.splice(conversationIndex, 1);
            updatedConversations.unshift(conversation);
          }
          
          return updatedConversations;
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="employee-messages">
      <div className="messages-container">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Conversations</h2>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search conversations"
                className="conversation-search"
              />
            </div>
          </div>
          
          <div className="conversations-list">
            {loading ? (
              <div className="loading-container">
                <FaSpinner className="spinning" />
                <p>Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
                <small>Start chatting with your employers</small>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.conversationId}
                  className={`conversation-item ${activeConversation?.conversationId === conversation.conversationId ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="conversation-avatar">
                    {conversation.otherUser.profilePicture ? (
                      <img 
                        src={conversation.otherUser.profilePicture} 
                        alt={conversation.otherUser.name} 
                        className="user-avatar"
                      />
                    ) : (
                      <div className="default-avatar">
                        <FaUser />
                      </div>
                    )}
                  </div>
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <h3 className="conversation-name">{conversation.otherUser.name}</h3>
                      <span className="conversation-time">
                        {formatTime(conversation.latestMessage.createdAt)}
                      </span>
                    </div>
                    <div className="conversation-preview">
                      <p className={`message-preview ${!conversation.latestMessage.read && conversation.latestMessage.receiver._id === user._id ? 'unread' : ''}`}>
                        {conversation.latestMessage.content.length > 30 
                          ? conversation.latestMessage.content.substring(0, 30) + '...' 
                          : conversation.latestMessage.content}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">{conversation.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="messages-content">
          {!activeConversation ? (
            <div className="no-conversation-selected">
              <div className="welcome-message">
                <h3>Welcome to your messages</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          ) : (
            <>
              <div className="messages-header">
                <div className="conversation-info">
                  {activeConversation.otherUser.profilePicture ? (
                    <img 
                      src={activeConversation.otherUser.profilePicture} 
                      alt={activeConversation.otherUser.name} 
                      className="user-avatar"
                    />
                  ) : (
                    <div className="default-avatar">
                      <FaUser />
                    </div>
                  )}
                  <h3>{activeConversation.otherUser.name}</h3>
                </div>
              </div>
              
              <div className="messages-list">
                {messages.map((message, index) => {
                  // Check if date has changed since previous message
                  const showDateSeparator = index === 0 || 
                    formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                  
                  return (
                    <React.Fragment key={message._id}>
                      {showDateSeparator && (
                        <div className="date-separator">
                          <span>{formatDate(message.createdAt)}</span>
                        </div>
                      )}
                      <div className={`message-item ${message.sender._id === user._id ? 'sent' : 'received'}`}>
                        <div className="message-bubble">
                          <p>{message.content}</p>
                          <div className="message-meta">
                            <span className="message-time">{formatTime(message.createdAt)}</span>
                            {message.sender._id === user._id && (
                              <span className="message-status">
                                {message.read ? <FaCheckCircle className="read-icon" /> : <FaRegClock className="sent-icon" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              <form className="message-compose" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="message-input"
                />
                <button 
                  type="submit" 
                  className="send-button"
                  disabled={sendingMessage || !newMessage.trim()}
                >
                  {sendingMessage ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeMessages;
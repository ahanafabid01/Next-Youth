import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaSpinner, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import './Messages.css';

const Messages = () => {
  const { userId } = useParams();
  const { socket, user: currentUser, sendMessage: socketSendMessage } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);
  
  // Set active conversation based on URL parameter
  useEffect(() => {
    if (userId) {
      setActiveConversation(userId);
      fetchUserDetails(userId);
      fetchMessages(userId);
    }
  }, [userId]);
  
  // Socket event listener for new messages
  useEffect(() => {
    if (socket) {
      const handleNewMessage = (data) => {
        if (activeConversation === data.sender._id) {
          setMessages(prev => [...prev, data.message]);
        }
        // Refresh conversations list to update latest message
        fetchConversations();
      };
      
      socket.on('new-message', handleNewMessage);
      
      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, activeConversation]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:4000/api/messages/conversations', {
        withCredentials: true
      });
      
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserDetails = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:4000/api/auth/profile/${userId}`, {
        withCredentials: true
      });
      
      if (res.data.success) {
        setRecipient(res.data.user);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };
  
  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:4000/api/messages/${userId}`, {
        withCredentials: true
      });
      
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      setSendingMessage(true);
      const result = await socketSendMessage(activeConversation, newMessage);
      
      if (result.success) {
        setMessages(prev => [...prev, result.message]);
        setNewMessage('');
        fetchConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleConversationClick = (userId) => {
    navigate(`/messages/${userId}`);
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="messages-container">
      <div className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
        </div>
        <div className="conversations-list">
          {loading && conversations.length === 0 ? (
            <div className="loading-conversations">
              <FaSpinner className="spinning" />
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map(convo => (
              <div 
                key={convo.user._id}
                className={`conversation-item ${activeConversation === convo.user._id ? 'active' : ''} ${convo.unreadCount > 0 ? 'unread' : ''}`}
                onClick={() => handleConversationClick(convo.user._id)}
              >
                <div className="conversation-avatar">
                  {convo.user.profilePicture ? (
                    <img src={convo.user.profilePicture} alt={`${convo.user.name}'s avatar`} />
                  ) : (
                    <div className="default-avatar">{convo.user.name.charAt(0)}</div>
                  )}
                </div>
                <div className="conversation-details">
                  <div className="conversation-header">
                    <h4>{convo.user.name}</h4>
                    <span className="conversation-time">
                      {formatTime(convo.latestMessage.createdAt)}
                    </span>
                  </div>
                  <p className="conversation-last-message">
                    {convo.latestMessage.content.length > 40
                      ? `${convo.latestMessage.content.substring(0, 40)}...`
                      : convo.latestMessage.content
                    }
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="unread-badge">{convo.unreadCount}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="messages-content">
        {!activeConversation ? (
          <div className="select-conversation">
            <div className="select-conversation-icon">
              <FaPaperPlane />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list or start a new one</p>
          </div>
        ) : (
          <>
            <div className="messages-header">
              <button 
                className="back-button"
                onClick={() => navigate('/messages')}
              >
                <FaArrowLeft />
              </button>
              
              {recipient ? (
                <div className="recipient-info">
                  <div className="recipient-avatar">
                    {recipient.profilePicture ? (
                      <img src={recipient.profilePicture} alt={`${recipient.name}'s avatar`} />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                  <div className="recipient-details">
                    <h3>{recipient.name}</h3>
                    <span className="recipient-type">{recipient.userType}</span>
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
              {loading ? (
                <div className="messages-loading">
                  <FaSpinner className="spinning" />
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="no-messages-yet">
                  <div className="no-messages-icon">
                    <FaPaperPlane />
                  </div>
                  <p>No messages yet</p>
                  <p className="no-messages-subtext">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => {
                    const isSentByMe = message.sender._id === currentUser?._id;
                    const showDate = index === 0 || 
                      formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                    
                    return (
                      <React.Fragment key={message._id}>
                        {showDate && (
                          <div className="message-date-divider">
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                        )}
                        <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                          <div className="message-content">
                            {message.content}
                          </div>
                          <div className="message-time">
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={sendingMessage}
              />
              <button 
                type="submit"
                disabled={!newMessage.trim() || sendingMessage}
              >
                {sendingMessage ? (
                  <FaSpinner className="spinning" />
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
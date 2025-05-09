import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaUser, FaPaperPlane, FaSpinner, FaComments, FaArrowLeft } from 'react-icons/fa';
import './Messages.css';

const Messages = ({ userType }) => {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const messagesEndRef = useRef(null);
  
  const API_BASE_URL = 'http://localhost:4000/api';
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/messages/conversations`, { 
          withCredentials: true 
        });
        
        if (response.data.success) {
          setConversations(response.data.conversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversations();
  }, []);
  
  // Fetch messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) return;
    
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await axios.get(`${API_BASE_URL}/messages/${selectedConversation._id}`, { 
          withCredentials: true 
        });
        
        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };
    
    fetchMessages();
    
    // Set up polling for new messages (every 10 seconds)
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [selectedConversation]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setShowConversation(true);
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setSending(true);
      
      const response = await axios.post(`${API_BASE_URL}/messages/send`, {
        recipient: selectedConversation.participantId,
        content: newMessage,
        conversationId: selectedConversation._id
      }, { 
        withCredentials: true 
      });
      
      if (response.data.success) {
        // Add new message to the list
        setMessages([...messages, response.data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Within a week
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if ((now - date) < oneWeek) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise
    return date.toLocaleDateString();
  };
  
  const getGroupedMessagesByDate = () => {
    const groupedMessages = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groupedMessages[date]) {
        groupedMessages[date] = [];
      }
      groupedMessages[date].push(message);
    });
    
    return groupedMessages;
  };
  
  const groupedMessages = getGroupedMessagesByDate();
  
  return (
    <div className={`messages-container ${showConversation ? 'show-conversation' : ''}`}>
      <div className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h2>Messages</h2>
        </div>
        <div className="conversations-list">
          {loading ? (
            <div className="loading-conversations">
              <FaSpinner className="spinning" />
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <FaComments style={{ fontSize: '2rem', marginBottom: '10px', opacity: 0.5 }} />
              <p>No conversations yet</p>
              <p className="no-messages-subtext">
                {userType === 'employer' 
                  ? 'Start messaging candidates to discuss job opportunities!' 
                  : 'Connect with employers about jobs you\'ve applied to!'}
              </p>
            </div>
          ) : (
            conversations.map(conversation => (
              <div 
                key={conversation._id} 
                className={`conversation-item ${conversation.unread ? 'unread' : ''} ${selectedConversation?._id === conversation._id ? 'active' : ''}`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="conversation-avatar">
                  {conversation.participant.profilePicture ? (
                    <img src={conversation.participant.profilePicture} alt={conversation.participant.name} />
                  ) : (
                    <div className="default-avatar">
                      {conversation.participant.name ? conversation.participant.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
                <div className="conversation-details">
                  <div className="conversation-header">
                    <h4>{conversation.participant.name}</h4>
                    <span className="conversation-time">
                      {conversation.lastMessage ? formatDate(conversation.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="conversation-last-message">
                    {conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}
                  </p>
                  {conversation.unreadCount > 0 && (
                    <span className="unread-badge">{conversation.unreadCount}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="messages-content">
        {selectedConversation ? (
          <>
            <div className="messages-header">
              <button 
                className="back-button" 
                onClick={() => {
                  setShowConversation(false);
                  setSelectedConversation(null);
                }}
              >
                <FaArrowLeft />
              </button>
              <div className="recipient-info">
                <div className="recipient-avatar">
                  {selectedConversation.participant.profilePicture ? (
                    <img src={selectedConversation.participant.profilePicture} alt={selectedConversation.participant.name} />
                  ) : (
                    <FaUser />
                  )}
                </div>
                <div className="recipient-details">
                  <h3>{selectedConversation.participant.name}</h3>
                  <div className="recipient-type">
                    {userType === 'employer' ? 'Candidate' : 'Employer'}
                  </div>
                </div>
              </div>
            </div>

            <div className="messages-body">
              {loadingMessages ? (
                <div className="messages-loading">
                  <FaSpinner className="spinning" />
                  <p>Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="no-messages-yet">
                  <div className="no-messages-icon">
                    <FaComments />
                  </div>
                  <h3>No messages yet</h3>
                  <p className="no-messages-subtext">Send a message to start the conversation!</p>
                </div>
              ) : (
                <div className="message-list">
                  {Object.entries(groupedMessages).map(([date, messages]) => (
                    <React.Fragment key={date}>
                      <div className="message-date-divider">
                        <span>{new Date(date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {messages.map(message => (
                        <div 
                          key={message._id} 
                          className={`message-bubble ${message.sender === selectedConversation.participantId ? 'received' : 'sent'}`}
                        >
                          <div className="message-content">{message.content}</div>
                          <div className="message-time">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <form className="message-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button type="submit" disabled={!newMessage.trim() || sending}>
                {sending ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
              </button>
            </form>
          </>
        ) : (
          <div className="select-conversation">
            <div className="select-conversation-icon">
              <FaComments />
            </div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
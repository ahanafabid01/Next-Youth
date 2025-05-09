import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState(null);

  // Initialize socket connection and set up user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user data first
        const response = await axios.get('http://localhost:4000/api/auth/me', {
          withCredentials: true
        });
        
        if (response.data.success) {
          const userData = response.data.user;
          setUser(userData);
          
          // Now initialize socket with user data
          const newSocket = io('http://localhost:4000', {
            withCredentials: true
          });
          
          newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            setIsConnected(true);
            
            // Join personal room for receiving messages
            newSocket.emit('join-user-room', userData._id);
            console.log('Joined room:', userData._id);
          });
          
          newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
          });
          
          newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            setError('Failed to connect to messaging service');
            setIsConnected(false);
          });
          
          setSocket(newSocket);
          
          // Fetch initial unread count
          fetchUnreadCount();
          
          return () => {
            newSocket.disconnect();
          };
        }
      } catch (error) {
        console.error('Error setting up socket:', error);
        setError('Failed to initialize messaging service');
      }
    };
    
    fetchUserData();
  }, []);
  
  // Setup new message listener when socket and user are available
  useEffect(() => {
    if (socket && user) {
      const handleNewMessage = (data) => {
        console.log('New message received via socket:', data);
        
        // If message is from someone else, increment unread count
        if (data.sender._id !== user._id) {
          setUnreadCount(prev => prev + 1);
        }
      };
      
      socket.on('new-message', handleNewMessage);
      
      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, user]);
  
  // Function to fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      console.log('Fetching unread count...');
      const response = await axios.get('http://localhost:4000/api/messages/unread/count', {
        withCredentials: true
      });
      
      console.log('Unread count response:', response.data);
      
      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  // Function to send a message
  const sendMessage = async (recipientId, content) => {
    try {
      console.log('Sending message to API:', { recipientId, content });
      const response = await axios.post('http://localhost:4000/api/messages', {
        recipientId,
        content
      }, {
        withCredentials: true
      });
      
      console.log('Message send response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // Context value
  const value = {
    socket,
    isConnected,
    user,
    unreadCount,
    error,
    sendMessage,
    refreshUnreadCount: fetchUnreadCount
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
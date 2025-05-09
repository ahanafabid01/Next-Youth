import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/auth/me', { 
          withCredentials: true 
        });
        
        if (res.data.success) {
          setUser(res.data.user);
          
          // Create socket connection
          const socketInstance = io('http://localhost:4000');
          setSocket(socketInstance);
          
          // Setup event listeners
          socketInstance.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected!');
            
            // Join user's room for private messages
            socketInstance.emit('join', res.data.user._id);
          });
          
          socketInstance.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected!');
          });
          
          // Get initial unread count
          fetchUnreadCount();
          
          return () => {
            socketInstance.off('connect');
            socketInstance.off('disconnect');
            socketInstance.off('new-message');
            socketInstance.disconnect();
          };
        }
      } catch (error) {
        console.error('Error fetching user data for socket:', error);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Setup new message listener when socket and user are available
  useEffect(() => {
    if (socket && user) {
      const handleNewMessage = (data) => {
        console.log('New message received:', data);
        // Increase unread count
        setUnreadCount(prev => prev + 1);
      };
      
      socket.on('new-message', handleNewMessage);
      
      return () => {
        socket.off('new-message', handleNewMessage);
      };
    }
  }, [socket, user]);
  
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/messages/unread/count', {
        withCredentials: true
      });
      
      if (res.data.success) {
        setUnreadCount(res.data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  // Function to send a message
  const sendMessage = async (recipientId, content) => {
    try {
      const res = await axios.post('http://localhost:4000/api/messages', {
        recipientId,
        content
      }, {
        withCredentials: true
      });
      
      return res.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };
  
  // Add function to join a room
  const joinRoom = (userId) => {
    if (socket && userId) {
      socket.emit('join', userId);
      console.log(`Joined room: ${userId}`);
    }
  };
  
  // Context value
  const value = {
    socket,
    isConnected,
    user,
    unreadCount,
    sendMessage,
    joinRoom,
    refreshUnreadCount: fetchUnreadCount
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
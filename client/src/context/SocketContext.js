import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
    const connectSocket = async () => {
      try {
        // Get the token from cookies or localStorage
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];
          
        if (!token) {
          console.log('No authentication token found, skipping socket connection');
          return;
        }
        
        // Connect to the socket server with the token
        const newSocket = io('http://localhost:4000', {
          auth: { token },
          withCredentials: true
        });

        // Set up event listeners
        newSocket.on('connect', () => {
          console.log('Connected to socket server');
        });

        newSocket.on('userOnlineStatus', ({ userId, online }) => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            if (online) {
              newSet.add(userId);
            } else {
              newSet.delete(userId);
            }
            return newSet;
          });
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          setSocket(null);
        });

        setSocket(newSocket);

        // Clean up on unmount
        return () => {
          if (newSocket) newSocket.disconnect();
        };
      } catch (error) {
        console.error('Error setting up socket connection:', error);
      }
    };

    connectSocket();
  }, []);

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  return (
    <SocketContext.Provider value={{ socket, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};
import { io } from "socket.io-client";
import API_BASE_URL from "./apiConfig";

// Get server URL from environment variables, properly removing '/api' suffix
const SOCKET_SERVER_URL = API_BASE_URL 
  ? API_BASE_URL.replace('/api', '') 
  : "http://localhost:4000";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const getSocket = () => {
  if (!socket) {
    console.log('Connecting to socket server at:', SOCKET_SERVER_URL);
    
    socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      forceNew: false,
      timeout: 10000
    });

    // Add reconnection handling
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      reconnectAttempts = 0;
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reconnectAttempts++;

      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnection attempts reached, giving up');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};
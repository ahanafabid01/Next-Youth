import { io } from "socket.io-client";
import API_BASE_URL from "./apiConfig";

// Get server URL from environment variables, properly removing '/api' suffix
const SOCKET_SERVER_URL = API_BASE_URL 
  ? API_BASE_URL.replace('/api', '') 
  : "http://localhost:4000";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECTION_DELAY = 2000;
const PING_INTERVAL = 10000;

export const getSocket = () => {
  if (!socket) {
    console.log('Connecting to socket server at:', SOCKET_SERVER_URL);
    
    socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: RECONNECTION_DELAY * 5,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      pingInterval: PING_INTERVAL, // Add consistent ping to keep connection alive
      pingTimeout: 5000,
      transports: ['websocket', 'polling'],
      forceNew: false,
      withCredentials: true
    });

    // Prevent disconnect/reconnect cycle causing UI flicker
    socket.io.on("reconnect_attempt", () => {
      console.log("Socket reconnecting...");
    });

    // More stable online status tracking
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      reconnectAttempts = 0;

      // Delay emitting user_connected to ensure connection is stable
      setTimeout(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
          socket.emit('user_connected', userId);
        }
      }, 500);
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
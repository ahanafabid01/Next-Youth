import { io } from "socket.io-client";
import API_BASE_URL from "./apiConfig";

// Get server URL from environment variables, properly removing '/api' suffix
const SOCKET_SERVER_URL = API_BASE_URL 
  ? API_BASE_URL.replace('/api', '') 
  : "http://localhost:4000";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10; // Adjusted reconnection attempts
const RECONNECTION_DELAY = 5000;  // Increase from 2000 to 5000
const PING_INTERVAL = 30000;      // Increase from 10000 to 30000
const STATUS_STABILITY_DELAY = 5000;  // New constant for status stability

// Add a stability buffer for online status
let statusStabilityBuffer = new Map();

export const getSocket = () => {
  if (!socket) {
    console.log('Connecting to socket server at:', SOCKET_SERVER_URL);
    
    socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: RECONNECTION_DELAY * 5,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS, // Limit reconnection attempts
      timeout: 20000,
      pingInterval: PING_INTERVAL,
      pingTimeout: 10000,  // Increase timeout
      transports: ['websocket', 'polling'],
      forceNew: false,
      withCredentials: true
    });

    // Prevent reconnect/disconnect cycle
    socket.io.on("reconnect_attempt", (attempt) => {
      console.log(`Socket reconnection attempt ${attempt}`);
    });

    socket.io.on("reconnect_error", (error) => {
      console.log("Socket reconnection error:", error);
    });

    socket.io.on("reconnect_failed", () => {
      console.log("Socket reconnection failed");
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully');
      reconnectAttempts = 0;

      // Delay to ensure connection is stable before emitting user_connected
      setTimeout(() => {
        const userId = localStorage.getItem('userId');
        if (userId) {
          socket.emit('user_connected', userId);
        }
      }, 1000);
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
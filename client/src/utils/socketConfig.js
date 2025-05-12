import { io } from "socket.io-client";

// Get server URL from environment variables
const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      transports: ['websocket', 'polling'] // Add polling as fallback
    });
    
    socket.on("connect", () => {
      console.log("Socket connected with ID:", socket.id);
      reconnectAttempts = 0;
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      reconnectAttempts++;
      
      if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
        console.error("Maximum reconnection attempts reached, giving up");
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      
      // If the server closed the connection, don't attempt to reconnect
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });
  }
  
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected by user");
  }
};
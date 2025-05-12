import { io } from "socket.io-client";

// Get server URL from environment variables, remove '/api' suffix if present
const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL.replace('/api', '') 
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
      transports: ['websocket', 'polling'], // Add polling as fallback
      withCredentials: true // Add this for cookie support
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
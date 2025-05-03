const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('./models/messageModel');
const Conversation = require('./models/conversationModel');
const User = require('./models/userModel');

function setupSocketIO(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error("User not found"));
      }
      
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    onlineUsers.set(socket.user._id.toString(), socket.id);
    
    // Join user to their own room
    socket.join(socket.user._id.toString());
    
    // Update online status
    io.emit('userOnlineStatus', {
      userId: socket.user._id.toString(),
      online: true
    });

    // Handle joining conversation rooms
    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Handle new message
    socket.on('sendMessage', async (messageData) => {
      try {
        const { conversationId, text, receiverId } = messageData;
        
        // Create and save the new message
        const newMessage = new Message({
          conversationId,
          senderId: socket.user._id,
          receiverId,
          text,
          read: false
        });
        
        await newMessage.save();
        
        // Update last message timestamp in conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: new Date()
        });

        // Get message with populated sender
        const populatedMessage = await Message.findById(newMessage._id)
          .populate('senderId', 'name profilePicture')
          .populate('receiverId', 'name profilePicture');

        // Send to everyone in the conversation room
        io.to(`conversation:${conversationId}`).emit('receiveMessage', populatedMessage);
        
        // Send notification if user is not in the conversation
        const receiverSocketId = onlineUsers.get(receiverId.toString());
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('newMessageNotification', {
            message: populatedMessage,
            sender: {
              _id: socket.user._id,
              name: socket.user.name
            }
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('messageError', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { conversationId, isTyping } = data;
      socket.to(`conversation:${conversationId}`).emit('userTyping', {
        userId: socket.user._id,
        conversationId,
        isTyping
      });
    });

    // Mark messages as read
    socket.on('markAsRead', async (data) => {
      try {
        const { conversationId, senderId } = data;
        
        await Message.updateMany(
          { 
            conversationId, 
            senderId, 
            read: false 
          },
          { read: true }
        );
        
        io.to(`conversation:${conversationId}`).emit('messagesRead', {
          conversationId,
          readBy: socket.user._id
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
      onlineUsers.delete(socket.user._id.toString());
      
      io.emit('userOnlineStatus', {
        userId: socket.user._id.toString(),
        online: false
      });
    });
  });

  return io;
}

module.exports = setupSocketIO;
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import axios from "axios";
import io from "socket.io-client";
import { 
  FaSearch, 
  FaPaperPlane, 
  FaEllipsisV, 
  FaUser, 
  FaCheck, 
  FaCheckDouble, 
  FaFile, 
  FaPaperclip,
  FaSmile,
  FaSpinner,
  FaArrowLeft,
  FaDownload,
  FaImage,
  FaCircle,
  FaMicrophone,
  FaTrashAlt,
  FaEllipsisH
} from "react-icons/fa";
import "./EmployerMessage.css";
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

// Socket connection
const ENDPOINT = "http://localhost:4000";
let socket;

// Create a memoized message component to prevent unnecessary re-renders
const MessageBubble = memo(({ message, isOwn, showSenderInfo, senderName, formatTimestamp, onContextMenu }) => {
  return (
    <div 
      className={`whatsapp-message ${isOwn ? "whatsapp-message-own" : "whatsapp-message-other"}`}
      onContextMenu={(e) => onContextMenu(e, message)}
    >
      <div className={`whatsapp-bubble ${isOwn ? "whatsapp-bubble-own" : "whatsapp-bubble-other"}`}>
        {!isOwn && showSenderInfo && (
          <div className="whatsapp-sender-name">
            {senderName}
          </div>
        )}
        
        <div className="whatsapp-message-content">
          {message.isDeleted ? (
            <span className="whatsapp-deleted-message">This message was deleted</span>
          ) : (
            <>
              {message.content}
              
              {message.attachment && (
                <div className="whatsapp-attachment">
                  {message.attachment.type && message.attachment.type.startsWith("image") ? (
                    <div className="whatsapp-image-attachment">
                      <img 
                        src={message.attachment.url} 
                        alt="Attachment" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                        }}
                      />
                      <div className="whatsapp-attachment-info">
                        <span>{message.attachment.filename || "Image"}</span>
                        <a 
                          href={message.attachment.url} 
                          download 
                          target="_blank" 
                          rel="noreferrer" 
                          className="whatsapp-download-btn"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaDownload />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="whatsapp-file-attachment">
                      <div className="whatsapp-file-icon">
                        <FaFile />
                      </div>
                      <div className="whatsapp-file-details">
                        <span className="whatsapp-file-name">{message.attachment.filename || "File"}</span>
                        <a 
                          href={message.attachment.url} 
                          download 
                          target="_blank" 
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FaDownload />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          
          <div className="whatsapp-message-meta">
            <span className="whatsapp-message-time">{formatTimestamp(message.createdAt)}</span>
            {isOwn && (
              <span className="whatsapp-message-status">
                {message.read ? <FaCheckDouble /> : <FaCheck />}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const EmployerMessage = ({ darkMode }) => {
  // State for conversations and messages
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  // New state variables for staged attachments
  const [stagedAttachment, setStagedAttachment] = useState(null);
  const [attachmentCaption, setAttachmentCaption] = useState("");
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  // State variables for message menu and deletion
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState(false);
  const [deleteOption, setDeleteOption] = useState(null); // "me" or "everyone"
  const [showDeleteConversationDialog, setShowDeleteConversationDialog] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const previousConversation = useRef(null);
  
  // Mark a message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/messages/mark-read/${messageId}`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };
  
  // Mark all messages in a conversation as read
  const markConversationAsRead = async (conversationId) => {
    try {
      await axios.put(
        `http://localhost:4000/api/messages/mark-conversation-read/${conversationId}`,
        {},
        { withCredentials: true }
      );
      
      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    } catch (error) {
      console.error("Error marking conversation as read:", error);
    }
  };
  
  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:4000/api/messages/conversations", {
        withCredentials: true
      });
      
      if (response.data.success) {
        setConversations(response.data.conversations);
        
        // Get unread counts for each conversation
        const counts = {};
        for (const conv of response.data.conversations) {
          const countResponse = await axios.get(`http://localhost:4000/api/messages/unread-count/${conv._id}`, {
            withCredentials: true
          });
          if (countResponse.data.success) {
            counts[conv._id] = countResponse.data.count;
          }
        }
        setUnreadCounts(counts);
        
        // Set active conversation if none is selected
        if (!activeConversation && response.data.conversations.length > 0) {
          setActiveConversation(response.data.conversations[0]);
          fetchMessages(response.data.conversations[0]._id, 1);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
    }
  }, [activeConversation]);
  
  // Helper function to update the conversation list
  const updateConversationList = useCallback((newMessage) => {
    setConversations(prev => {
      // Find if the conversation exists in the list
      const existingConversation = prev.find(conv => conv._id === newMessage.conversationId);
      
      if (!existingConversation) {
        // If this is a new conversation that's not in our list yet, we'll need to fetch conversations
        console.log("New conversation detected, refreshing conversation list");
        fetchConversations();
        return prev;
      }
      
      // Update the existing conversation with the latest message
      const updatedConversations = prev.map(conv => {
        if (conv._id === newMessage.conversationId) {
          return {
            ...conv,
            lastMessage: {
              _id: newMessage._id,
              content: newMessage.content,
              createdAt: newMessage.createdAt,
              attachment: newMessage.attachment,
              read: newMessage.read
            },
            updatedAt: new Date().toISOString() // Ensure this conversation sorts to the top
          };
        }
        return conv;
      });
      
      // Sort conversations to show the one with the new message at the top
      return [...updatedConversations].sort((a, b) => {
        // Use updatedAt or lastMessage.createdAt for sorting
        const aTime = a.updatedAt 
          ? new Date(a.updatedAt).getTime() 
          : (a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0);
        const bTime = b.updatedAt 
          ? new Date(b.updatedAt).getTime() 
          : (b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0);
        return bTime - aTime;
      });
    });
  }, [fetchConversations]);

  // Effect 1: Initialize socket only once when component mounts
  useEffect(() => {
    // Connect to socket server
    socket = io(ENDPOINT);
    
    socket.on("connect", () => {
      console.log("Socket connected");
    });
    
    // Get current user information
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get("http://localhost:4000/api/auth/profile", { 
          withCredentials: true 
        });
        if (response.data.success) {
          setCurrentUser(response.data.user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
    
    // Clean up socket connection when component unmounts
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []); // Empty dependency array - only runs once

  // Effect 2: Set up message event handlers separately
  useEffect(() => {
    if (!socket || !currentUser) return;
    
    // Handler for incoming messages
    const handleNewMessage = (message) => {
      console.log("Received new message event:", message);
      
      if (!message || !message.conversationId) {
        console.error("Invalid message received:", message);
        return;
      }
      
      // Check if this message was already deleted for the current user
      const isDeletedForCurrentUser = message.deletedFor && 
                                     Array.isArray(message.deletedFor) && 
                                     message.deletedFor.some(id => 
                                       (typeof id === 'string' && id === currentUser?._id) || 
                                       (id?._id && id._id === currentUser?._id)
                                     );
      
      // Skip processing if the message was deleted for this user
      if (isDeletedForCurrentUser) {
        console.log("Message was deleted for current user, ignoring:", message);
        return;
      }
      
      const isFromCurrentUser = message.sender && 
        ((message.sender._id && message.sender._id === currentUser?._id) || 
         (typeof message.sender === 'string' && message.sender === currentUser?._id));

      // For ALL messages - update the conversation list
      updateConversationList(message);
      
      // Handle messages for the active conversation
      if (activeConversation && message.conversationId === activeConversation._id) {
        setMessages(prev => {
          // Check for duplicates more thoroughly
          const isDuplicate = prev.some(m => 
            m._id === message._id || 
            (m.tempId && m.tempId === message._id) ||
            (m.tempId && message.tempId && m.tempId === message.tempId) ||
            (m.isTemp && m.content === message.content && 
             Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 60000)
          );
          
          if (isDuplicate) {
            console.log("Duplicate message detected, not adding:", message);
            return prev;
          }
          
          console.log("Adding new message to state:", message);
          const newMessage = {...message, isNew: true};
          return [...prev, newMessage];
        });

        if (!isFromCurrentUser) {
          markMessageAsRead(message._id);
        }
      } 
      // Handle messages for other conversations - update unread counts
      else if (!isFromCurrentUser) {
        console.log("Updating unread count for conversation:", message.conversationId);
        setUnreadCounts(prev => ({
          ...prev,
          [message.conversationId]: (prev[message.conversationId] || 0) + 1
        }));
      }
    };

    console.log("Setting up socket event handlers");
    socket.on("new_message", handleNewMessage);

    socket.on("message_deleted", ({ messageId, deleteFor }) => {
      console.log("Received message_deleted event:", { messageId, deleteFor });
      
      if (deleteFor === "everyone") {
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? 
              { ...msg, isDeleted: true, content: "This message was deleted", attachment: null } : 
              msg
          )
        );
      }
      // We don't need to handle "delete for me" here as that's a personal action
      // already handled in the handleDeleteMessage function
    });
    
    return () => {
      console.log("Cleaning up socket event handlers");
      socket.off("new_message", handleNewMessage);
      socket.off("message_deleted");
    };
  }, [activeConversation, currentUser, markMessageAsRead, updateConversationList]);

  // Ensure this useEffect runs properly to join conversation rooms
  useEffect(() => {
    if (activeConversation && socket && socket.connected) {
      // Leave any previously joined rooms
      if (previousConversation.current) {
        console.log(`Leaving conversation: ${previousConversation.current}`);
        socket.emit('leave_conversation', previousConversation.current);
      }
      
      // Join the new conversation room
      console.log(`Joining conversation: ${activeConversation._id}`);
      socket.emit('join_conversation', activeConversation._id);
      
      // Update the reference to the current conversation
      previousConversation.current = activeConversation._id;
    }
  }, [activeConversation]);
  
  // Fetch conversations on component mount
  useEffect(() => {
    fetchConversations();
    
    // Check for mobile view
    const handleResize = () => {
      setMobileView(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Add in the EmployerMessage component, in the useEffect section
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMessageMenu) {
        setShowMessageMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMessageMenu]);
  
  // Get other participant in conversation - FIXED FUNCTION
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) return { name: "Loading..." };
    
    // Use currentUser._id directly instead of relying on localStorage
    const myId = currentUser?._id;
    if (!myId) return { name: "Loading..." };
    
    // Find the participant that isn't the current user
    return conversation.participants.find(p => p._id !== myId) || { name: "Unknown" };
  };
  
  // Fetch messages
  const fetchMessages = async (conversationId, page = 1, append = false) => {
    try {
      setLoadingMore(true);
      const response = await axios.get(`http://localhost:4000/api/messages/${conversationId}`, {
        params: { page, limit: 20 },
        withCredentials: true
      });
      
      if (response.data.success) {
        // Process messages - add stable IDs and ensure deletedFor is properly handled
        const processedMessages = response.data.messages.map(msg => ({
          ...msg,
          isNew: false // Don't animate initial load
        }));
        
        if (append) {
          // Adding older messages, prepend them
          setMessages(prev => [...processedMessages.reverse(), ...prev]);
        } else {
          // New conversation, replace messages
          setMessages(processedMessages.reverse());
        }
        
        setHasMore(response.data.hasMore);
        setPage(page);
        
        // Mark messages as read
        markConversationAsRead(conversationId);
      }
      setLoadingMore(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setLoadingMore(false);
    }
  };
  
  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
    setShowConversations(false); // Hide sidebar on mobile
    setPage(1);
    fetchMessages(conversation._id, 1);
    setUnreadCounts(prev => ({
      ...prev,
      [conversation._id]: 0
    }));
  };
  
  // Load more messages (pagination)
  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    fetchMessages(activeConversation._id, page + 1, true);
  };
  
  // Update the handleSendMessage function:

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    
    // Generate a unique temp ID
    const tempId = `temp-${Date.now()}`;
    
    // Current timestamp for consistency
    const currentTimestamp = new Date().toISOString();
    
    // Create the message locally first for immediate display
    const tempMessage = {
      _id: tempId,
      tempId: tempId,
      content: newMessage,
      createdAt: currentTimestamp,
      sender: currentUser,
      read: false,
      isTemp: true,
      conversationId: activeConversation._id
    };
    
    // Clear input immediately for better UX
    setNewMessage("");
    
    // Add to messages for immediate display
    setMessages(prev => [...prev, tempMessage]);
    
    // Update the conversation list immediately to show the temp message
    updateConversationList(tempMessage);
    
    try {
      const response = await axios.post(
        "http://localhost:4000/api/messages",
        {
          conversationId: activeConversation._id,
          content: newMessage,
          receiverId: getOtherParticipant(activeConversation)._id
        },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        // Add the conversationId to the real message
        const realMessage = {
          ...response.data.message,
          conversationId: activeConversation._id
        };
        
        // Replace the temp message with the real one
        setMessages(prev => 
          prev.map(msg => (msg._id === tempId || msg.tempId === tempId) ? realMessage : msg)
        );
        
        // Update the conversation list with the real message
        updateConversationList(realMessage);
        
        // Focus back on input
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
        
        // Emit message through socket
        socket.emit("send_message", realMessage);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the temp message if there was an error
      setMessages(prev => prev.filter(msg => msg._id !== tempId && msg.tempId !== tempId));
      
      // Refresh conversation list to revert the temporary update
      fetchConversations();
    }
  };
  
  // Handle file selection (first step - just preview)
  const handleFileSelection = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File is too large. Maximum allowed size is 5MB.");
      return;
    }

    // Validate file type
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      alert("Only JPEG, PNG and GIF images are allowed.");
      return;
    } else if (type === 'file' && !allowedDocTypes.includes(file.type)) {
      alert("Only PDF, DOC, DOCX, and TXT files are allowed.");
      return;
    }

    // Create object URL for preview
    const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

    // Stage the attachment for preview
    setStagedAttachment({
      file,
      type: file.type,
      filename: file.name,
      previewUrl,
      fileType: type
    });
    
    setShowAttachmentPreview(true);
    setShowUploadOptions(false);
  };

  // Update the handleSendAttachment function:

  const handleSendAttachment = async () => {
    if (!stagedAttachment || !activeConversation) return;
    
    const file = stagedAttachment.file;
    const tempId = `temp-${Date.now()}`;
    const currentTimestamp = new Date().toISOString();
    
    setIsUploading(true);
    setUploadProgress(0);

    // Create temporary message for immediate display
    const tempAttachment = {
      type: file.type,
      filename: file.name,
      url: stagedAttachment.previewUrl
    };
    
    const tempMessage = {
      _id: tempId,
      tempId, 
      content: attachmentCaption || '',
      attachment: tempAttachment,
      createdAt: currentTimestamp,
      sender: currentUser,
      read: false,
      isTemp: true,
      conversationId: activeConversation._id
    };
    
    // Add to messages for immediate display
    setMessages(prev => [...prev, tempMessage]);
    
    // Update the conversation list immediately
    updateConversationList(tempMessage);
    
    // Hide attachment preview
    setShowAttachmentPreview(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', activeConversation._id);
    formData.append('receiverId', getOtherParticipant(activeConversation)._id);
    
    if (attachmentCaption) {
      formData.append('content', attachmentCaption);
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/messages/attachment",
        formData,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      if (response.data.success) {
        // Add conversationId to the real message
        const realMessage = {
          ...response.data.message,
          conversationId: activeConversation._id
        };
        
        // Replace the temp message with the real one
        setMessages(prev => 
          prev.map(msg => (msg._id === tempId || msg.tempId === tempId) ? realMessage : msg)
        );
        
        // Update the conversation list with the real message
        updateConversationList(realMessage);
        
        // Clean up any blob URLs
        if (stagedAttachment.previewUrl) {
          URL.revokeObjectURL(stagedAttachment.previewUrl);
        }
        
        socket.emit("send_message", realMessage);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      
      // Remove the temp message
      setMessages(prev => prev.filter(msg => msg._id !== tempId && msg.tempId !== tempId));
      
      // Refresh conversation list to revert the temporary update
      fetchConversations();
    } finally {
      setIsUploading(false);
      setStagedAttachment(null);
      setAttachmentCaption("");
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter conversations based on search term
  const filteredConversations = conversations.filter(conv => {
    // Only run this if we have the currentUser properly loaded
    if (!currentUser) return true;
    
    const otherParticipant = getOtherParticipant(conv);
    
    return otherParticipant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Check if a message is from the current user
  const isOwnMessage = (message) => {
    if (!currentUser || !message) return false;
    
    // Handle case where message is the temp message we created
    if (message.isTemp) return true;
    
    // Handle populated sender object case
    if (message.sender && message.sender._id) {
      return message.sender._id === currentUser._id;
    }
    
    // Handle string sender ID case
    if (typeof message.sender === 'string') {
      return message.sender === currentUser._id;
    }
    
    return false;
  };
  
  // Handle message context menu
  const handleMessageContextMenu = (e, message) => {
    e.preventDefault(); // Prevent the default context menu
    
    // Only allow context menu for our own messages or received messages
    if (!message.isDeleted) {
      setSelectedMessage(message);
      setShowMessageMenu(true);
      
      // Calculate position for the menu
      let x = e.clientX;
      let y = e.clientY;
      
      // Make sure menu doesn't go off-screen
      if (x + 200 > window.innerWidth) {
        x = window.innerWidth - 200;
      }
      
      if (y + 150 > window.innerHeight) {
        y = window.innerHeight - 150;
      }
      
      setMenuPosition({ x, y });
    }
  };
  
  // Update the handleDeleteMessage function for better handling

  const handleDeleteMessage = async (deleteFor = "me") => {
    if (!selectedMessage) return;
    
    try {
      // Close the dialog immediately for better UX
      setShowDeleteMessageDialog(false);
      
      // Capture the message ID before making the API call
      const messageId = selectedMessage._id;
      
      if (deleteFor === "me") {
        // For "delete for me", completely remove the message from UI
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      } else {
        // For "delete for everyone", update UI to show "This message was deleted"
        setMessages(prev => 
          prev.map(msg => 
            msg._id === messageId ? 
              { ...msg, isDeleted: true, content: "This message was deleted", attachment: null } : 
              msg
          )
        );
      }
      
      // Make API call to delete the message
      const response = await axios.delete(
        `http://localhost:4000/api/messages/message/${messageId}?deleteFor=${deleteFor}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        console.log(`Message deleted successfully with option: ${deleteFor}`);
        
        // Emit socket event for "delete for everyone" option only
        if (deleteFor === "everyone" && activeConversation) {
          socket.emit("delete_message", {
            messageId: messageId,
            conversationId: activeConversation._id,
            deleteFor: "everyone"
          });
        }
      } else {
        // If API call fails, refresh messages to restore state
        console.error("API returned error:", response.data.message);
        fetchMessages(activeConversation._id);
        alert("Failed to delete message: " + response.data.message);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      // Refresh messages to ensure UI is in sync with server
      if (activeConversation) {
        fetchMessages(activeConversation._id);
      }
    } finally {
      // Clean up
      setShowMessageMenu(false);
      setSelectedMessage(null);
    }
  };
  
  // Improve the handleDeleteConversation function
  const handleDeleteConversation = async () => {
    if (!activeConversation) return;
    
    try {
      setShowDeleteConversationDialog(false); // Close dialog immediately for better UX
      
      // Save current conversation ID and list before deletion
      const conversationId = activeConversation._id;
      const currentConversations = [...conversations];
      
      // Optimistically update UI
      setConversations(prev => 
        prev.filter(conv => conv._id !== conversationId)
      );
      
      // Get the next available conversation if any
      const remainingConversations = currentConversations.filter(c => c._id !== conversationId);
      
      if (remainingConversations.length > 0) {
        const nextConversation = remainingConversations[0]; // Get first available
        setActiveConversation(nextConversation);
        fetchMessages(nextConversation._id);
      } else {
        setActiveConversation(null);
        setMessages([]);
      }
      
      // Make the API call
      const response = await axios.delete(
        `http://localhost:4000/api/messages/conversation/${conversationId}`,
        { withCredentials: true }
      );
      
      if (!response.data.success) {
        console.error("API returned error:", response.data.message);
        // Restore previous state
        setConversations(currentConversations);
        alert(`Failed to delete conversation: ${response.data.message}`);
      } else {
        console.log("Conversation deleted successfully");
      }
      
    } catch (error) {
      console.error("Error deleting conversation:", error);
      // Provide more detailed error information
      const errorMessage = error.response?.data?.message || error.message || "Unknown error";
      alert(`Failed to delete conversation: ${errorMessage}`);
      // Refresh conversation list to ensure UI is in sync with server
      fetchConversations();
    }
  };
  
  // Render messages with memoized component
  const renderMessages = useCallback(() => {
    let lastDate = null;
    let lastSenderId = null;
    
    return messages
      // Improved filter to properly handle both types of message deletion
      .filter(message => {
        // If the message is in the user's deletedFor array, filter it out completely
        const isDeletedForCurrentUser = message.deletedFor && 
                                       Array.isArray(message.deletedFor) && 
                                       message.deletedFor.some(id => 
                                         (typeof id === 'string' && id === currentUser?._id) || 
                                         (id?._id && id._id === currentUser?._id)
                                       );
        
        // Skip the message entirely if it was deleted for current user
        if (isDeletedForCurrentUser) {
          return false;
        }
        
        // Keep all other messages (including those deleted for everyone)
        return true;
      })
      .map((message, index) => {
        // Rest of your mapping code remains the same
        const isOwn = isOwnMessage(message);
        const messageDate = new Date(message.createdAt).toDateString();
        const showDate = lastDate !== messageDate;
        if (showDate) lastDate = messageDate;
        
        const showSenderInfo = lastSenderId !== message.sender?._id;
        lastSenderId = message.sender?._id;
        
        const senderName = isOwn ? 'You' : (message.sender ? message.sender.name : 'Unknown');
        
        return (
          <React.Fragment key={message._id || message.tempId || index}>
            {showDate && (
              <div className="whatsapp-date-divider">
                <span>{new Date(message.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            
            <MessageBubble
              message={message}
              isOwn={isOwn}
              showSenderInfo={showSenderInfo}
              senderName={senderName}
              formatTimestamp={formatTimestamp}
              onContextMenu={handleMessageContextMenu}
            />
          </React.Fragment>
        );
      });
  }, [messages, isOwnMessage, formatTimestamp, currentUser, handleMessageContextMenu]);

  return (
    <div className={`whatsapp-container ${darkMode ? "whatsapp-dark" : ""}`}>
      <div className={`whatsapp-sidebar ${mobileView && !showConversations ? "whatsapp-sidebar-hidden" : ""}`}>
        <div className="whatsapp-header">
          <div className="whatsapp-user-info">
            {currentUser?.profilePicture ? (
              <img src={currentUser.profilePicture} alt="Profile" className="whatsapp-profile-image" />
            ) : (
              <div className="whatsapp-default-avatar whatsapp-header-avatar">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <h2>Messages</h2>
          </div>
          <div className="whatsapp-header-actions">
            <button className="whatsapp-icon-button">
              <FaEllipsisV />
            </button>
          </div>
        </div>
        
        <div className="whatsapp-search">
          <div className="whatsapp-search-container">
            <FaSearch className="whatsapp-search-icon" />
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className="whatsapp-chats">
          {loading ? (
            <div className="whatsapp-loading">
              <FaSpinner className="whatsapp-spinner" />
              <p>Loading conversations...</p>
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              const isActive = activeConversation && conversation._id === activeConversation._id;
              const unreadCount = unreadCounts[conversation._id] || 0;
              
              // Get appropriate preview text for the conversation
              const getPreviewText = () => {
                if (!conversation.lastMessage) return "Start a conversation";
                
                if (conversation.lastMessage.attachment) {
                  if (conversation.lastMessage.attachment.type?.startsWith("image")) {
                    return "📷 Photo";
                  }
                  return "📎 Document";
                }
                
                
                if (!conversation.lastMessage.content) return "No message";
                
                return conversation.lastMessage.content.length > 40
                  ? `${conversation.lastMessage.content.substring(0, 40)}...`
                  : conversation.lastMessage.content;
              };
              
              // Determine if this is a new message that just arrived
              const isNewMessage = conversation.lastMessage && 
                                   new Date().getTime() - new Date(conversation.lastMessage.createdAt).getTime() < 10000;
              
              return (
                <div 
                  key={conversation._id}
                  className={`whatsapp-chat-item ${isActive ? "whatsapp-active-chat" : ""} ${isNewMessage ? "whatsapp-new-message-highlight" : ""}`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="whatsapp-chat-avatar">
                    {otherParticipant.profilePicture ? (
                      <img src={otherParticipant.profilePicture} alt={otherParticipant.name} />
                    ) : (
                      <div className="whatsapp-default-avatar">
                        {otherParticipant.name ? otherParticipant.name.charAt(0).toUpperCase() : "?"}
                      </div>
                    )}
                  </div>
                  
                  <div className="whatsapp-chat-details">
                    <div className="whatsapp-chat-header">
                      <h4>{otherParticipant.name}</h4>
                      <span className="whatsapp-chat-time">
                        {conversation.lastMessage ? formatTimestamp(conversation.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    
                    <div className="whatsapp-chat-message">
                      <p className={unreadCount > 0 ? "whatsapp-unread-text" : ""}>
                        {getPreviewText()}
                      </p>
                      
                      {unreadCount > 0 && (
                        <div className="whatsapp-unread-count">{unreadCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="whatsapp-empty">
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>
      
      <div className={`whatsapp-chat ${mobileView && showConversations ? "whatsapp-chat-hidden" : ""}`}>
        {activeConversation ? (
          <>
            <div className="whatsapp-chat-header">
              {mobileView && (
                <button 
                  className="whatsapp-back-button"
                  onClick={() => setShowConversations(true)}
                >
                  <FaArrowLeft />
                </button>
              )}
              
              <div className="whatsapp-chat-user" onClick={() => {}}>
                <div className="whatsapp-chat-avatar">
                  {getOtherParticipant(activeConversation).profilePicture ? (
                    <img 
                      src={getOtherParticipant(activeConversation).profilePicture} 
                      alt={getOtherParticipant(activeConversation).name} 
                    />
                  ) : (
                    <div className="whatsapp-default-avatar">
                      {getOtherParticipant(activeConversation).name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="whatsapp-chat-user-info">
                  <h3>{getOtherParticipant(activeConversation).name}</h3>
                  <span className="whatsapp-user-status">
                    {getOtherParticipant(activeConversation).isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              
              <div className="whatsapp-chat-actions">
                <button className="whatsapp-icon-button">
                  <FaSearch />
                </button>
                <div className="whatsapp-dropdown">
                  <button className="whatsapp-icon-button">
                    <FaEllipsisV />
                  </button>
                  <div className="whatsapp-dropdown-menu">
                    <button 
                      className="whatsapp-dropdown-item"
                      onClick={() => setShowDeleteConversationDialog(true)}
                    >
                      <FaTrashAlt /> Delete Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="whatsapp-chat-body" ref={messagesContainerRef}>
              {hasMore && (
                <div className="whatsapp-load-more">
                  <button onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <FaSpinner className="whatsapp-spinner" />
                        Loading...
                      </>
                    ) : (
                      "Load older messages"
                    )}
                  </button>
                </div>
              )}
              
              <div className="whatsapp-messages">
                {messages.length > 0 ? renderMessages() : (
                  <div className="whatsapp-no-messages">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {isUploading && (
              <div className="whatsapp-upload-progress">
                <div className="whatsapp-progress-bar">
                  <div 
                    className="whatsapp-progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span>{uploadProgress}%</span>
              </div>
            )}
            
            {/* Attachment Preview UI */}
            {showAttachmentPreview && stagedAttachment && (
              <div className="whatsapp-attachment-preview">
                <div className="whatsapp-attachment-preview-header">
                  <button 
                    className="whatsapp-icon-button" 
                    onClick={() => {
                      setShowAttachmentPreview(false);
                      setStagedAttachment(null);
                      if (stagedAttachment.previewUrl) {
                        URL.revokeObjectURL(stagedAttachment.previewUrl);
                      }
                    }}
                  >
                    <FaArrowLeft />
                  </button>
                  <h3>{stagedAttachment.fileType === 'image' ? 'Preview Image' : 'Preview Document'}</h3>
                </div>
                
                <div className="whatsapp-attachment-preview-content">
                  {stagedAttachment.type && stagedAttachment.type.startsWith("image") ? (
                    <img 
                      src={stagedAttachment.previewUrl} 
                      alt="Preview" 
                      className="whatsapp-attachment-preview-image"
                    />
                  ) : (
                    <div className="whatsapp-attachment-preview-document">
                      <div className="whatsapp-file-icon large-icon">
                        <FaFile />
                      </div>
                      <p className="whatsapp-file-name">{stagedAttachment.filename}</p>
                    </div>
                  )}
                </div>
                
                <div className="whatsapp-attachment-caption">
                  <div className="whatsapp-input-container">
                    <input
                      type="text"
                      placeholder="Add a caption..."
                      value={attachmentCaption}
                      onChange={(e) => setAttachmentCaption(e.target.value)}
                      autoFocus
                    />
                  </div>
                  
                  <button 
                    className="whatsapp-icon-button whatsapp-send"
                    onClick={handleSendAttachment}
                  >
                    <FaPaperPlane />
                  </button>
                </div>
              </div>
            )}
            
            {/* Message context menu */}
            {showMessageMenu && selectedMessage && (
              <div 
                className="whatsapp-context-menu"
                style={{ top: menuPosition.y, left: menuPosition.x }}
              >
                <button 
                  className="whatsapp-context-menu-item"
                  onClick={() => {
                    setDeleteOption("me");
                    setShowDeleteMessageDialog(true);
                    setShowMessageMenu(false);
                  }}
                >
                  <FaTrashAlt /> Delete For Me
                </button>
                {isOwnMessage(selectedMessage) && !selectedMessage.isDeleted && (
                  <button 
                    className="whatsapp-context-menu-item"
                    onClick={() => {
                      setDeleteOption("everyone");
                      setShowDeleteMessageDialog(true);
                      setShowMessageMenu(false);
                    }}
                  >
                    <FaTrashAlt /> Delete For Everyone
                  </button>
                )}
              </div>
            )}

            {/* Delete message confirmation dialog */}
            {showDeleteMessageDialog && (
              <div className="whatsapp-dialog-overlay">
                <div className="whatsapp-dialog">
                  <h3>{deleteOption === "everyone" ? "Delete For Everyone" : "Delete For Me"}</h3>
                  <p>
                    {deleteOption === "everyone" 
                      ? "Are you sure you want to delete this message for everyone?" 
                      : "Delete this message? It will only be removed for you"}
                  </p>
                  {deleteOption === "me" && (
                    <p className="whatsapp-dialog-note">
                      You'll no longer see this message in this chat
                    </p>
                  )}
                  <div className="whatsapp-dialog-actions">
                    <button 
                      className="whatsapp-dialog-btn whatsapp-cancel-btn"
                      onClick={() => setShowDeleteMessageDialog(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="whatsapp-dialog-btn whatsapp-delete-btn"
                      onClick={() => handleDeleteMessage(deleteOption || "me")}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete conversation confirmation dialog */}
            {showDeleteConversationDialog && (
              <div className="whatsapp-dialog-overlay">
                <div className="whatsapp-dialog">
                  <h3>Delete Conversation</h3>
                  <p>Are you sure you want to delete this conversation?</p>
                  <p className="whatsapp-dialog-note">
                    Messages will be removed from this device only.
                  </p>
                  <div className="whatsapp-dialog-actions">
                    <button 
                      className="whatsapp-dialog-btn whatsapp-cancel-btn"
                      onClick={() => setShowDeleteConversationDialog(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="whatsapp-dialog-btn whatsapp-delete-btn"
                      onClick={handleDeleteConversation}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="whatsapp-chat-footer">
              <button 
                className="whatsapp-icon-button whatsapp-emoji"
                onClick={() => {}}
              >
                <FaSmile />
              </button>
              
              <button 
                className="whatsapp-icon-button whatsapp-attach"
                onClick={() => setShowUploadOptions(!showUploadOptions)}
              >
                <FaPaperclip />
              </button>
              
              {showUploadOptions && (
                <div className="whatsapp-upload-options">
                  <button 
                    className="whatsapp-upload-option"
                    onClick={() => imageInputRef.current.click()}
                  >
                    <div className="whatsapp-upload-icon whatsapp-photo-icon">
                      <FaImage />
                    </div>
                    <span>Photo</span>
                  </button>
                  <button 
                    className="whatsapp-upload-option"
                    onClick={() => fileInputRef.current.click()}
                  >
                    <div className="whatsapp-upload-icon whatsapp-doc-icon">
                      <FaFile />
                    </div>
                    <span>Document</span>
                  </button>
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileSelection(e, 'file')}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.txt,.zip,.rar"
              />
              
              <input 
                type="file" 
                ref={imageInputRef} 
                onChange={(e) => handleFileSelection(e, 'image')}
                style={{ display: 'none' }}
                accept="image/*"
              />
              
              <div className="whatsapp-input-container">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  ref={messageInputRef}
                />
              </div>
              
              <button 
                className="whatsapp-icon-button whatsapp-send"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                {newMessage.trim() ? <FaPaperPlane /> : <FaMicrophone />}
              </button>
            </div>
          </>
        ) : (
          <div className="whatsapp-welcome">
            <div className="whatsapp-welcome-container">
              <div className="whatsapp-welcome-image"></div>
              <h1>Keep your phone connected</h1>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerMessage;
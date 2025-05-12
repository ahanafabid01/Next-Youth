import API_BASE_URL from '../../utils/apiConfig';
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import axios from "axios";
import io from "socket.io-client";
import DOMPurify from "dompurify";
import twemoji from "twemoji";
import EmojiPicker from 'emoji-picker-react';
import debounce from 'lodash.debounce';
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
  FaEllipsisH,
  FaTrash,
  FaPlay,
  FaPause,
  FaPhoneAlt,
  FaVideo,
  FaMicrophoneSlash,
  FaVideoSlash,
  FaPhone,
  FaVolumeUp,
  FaVolumeMute,
  FaDesktop
} from "react-icons/fa";
import { getSocket } from '../../utils/socketConfig';
import "./EmployerMessage.css";
import logoLight from '../../assets/images/logo-light.png';
import logoDark from '../../assets/images/logo-dark.png';

// Add these constants
const STATUS_STABILITY_DELAY = 5000; // 5 seconds delay for status stability
const statusStabilityBuffer = {};

// Configure twemoji for better performance
const parseTwemoji = (text) => {
  if (!text) return '';
  
  // Use cache for parsed emoji html content
  if (window.__emojiCache === undefined) {
    window.__emojiCache = new Map();
  }
  
  // Return cached version if available
  if (window.__emojiCache.has(text)) {
    return window.__emojiCache.get(text);
  }
  
  // Parse and cache for future use
  const parsed = twemoji.parse(text, {
    folder: 'svg',
    ext: '.svg',
    className: 'emoji-icon',
    size: 16,
    callback: () => true
  });
  
  window.__emojiCache.set(text, parsed);
  return parsed;
};

// Create a memoized message component to prevent unnecessary re-renders
const MessageBubble = memo(({ message, isOwn, showSenderInfo, senderName, formatTimestamp, onContextMenu }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  
  // Add memoization for content to prevent unnecessary re-renders
  const sanitizedContent = useMemo(() => {
    if (!message.content || message.isDeleted) return null;
    return DOMPurify.sanitize(parseTwemoji(message.content));
  }, [message.content, message.isDeleted]);
  
  // Set up audio event listeners
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleDurationChange = () => setDuration(audio.duration);
      const handleEnded = () => setIsPlaying(false);
      
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('durationchange', handleDurationChange);
      audio.addEventListener('ended', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('durationchange', handleDurationChange);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [message]);
  
  // Play/pause audio
  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Format audio time
  const formatAudioTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };
  
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
              {message.content && (
                <span 
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }} 
                  className="whatsapp-text-content"
                />
              )}
              
              {message.attachment && (
                <div className="whatsapp-attachment">
                  {/* Handle voice messages */}
                  {message.attachment.isVoiceMessage || 
                   (message.attachment.type && message.attachment.type.startsWith("audio")) ? (
                    <div className="whatsapp-voice-message">
                      <button 
                        className={`whatsapp-voice-play-btn ${isPlaying ? 'playing' : ''}`}
                        onClick={togglePlay}
                      >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                      
                      <div className="whatsapp-voice-waveform">
                        <div className="whatsapp-voice-progress" style={{ 
                          width: `${duration ? (currentTime / duration) * 100 : 0}%` 
                        }}></div>
                      </div>
                      
                      <div className="whatsapp-voice-time">
                        {formatAudioTime(duration - currentTime)}
                      </div>
                      
                      <audio 
                        ref={audioRef} 
                        src={message.attachment.url} 
                        preload="metadata" 
                        style={{ display: 'none' }}
                      ></audio>
                    </div>
                  ) : message.attachment.type && message.attachment.type.startsWith("image") ? (
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
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.message._id === nextProps.message._id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.isDeleted === nextProps.message.isDeleted &&
    prevProps.isOwn === nextProps.isOwn
  );
});

// Add this near the top of both message components
const MemoizedMessageBubble = React.memo(MessageBubble, (prevProps, nextProps) => {
  // Strict comparison to prevent unnecessary re-renders
  return (
    prevProps.message._id === nextProps.message._id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.read === nextProps.message.read &&
    prevProps.message.isDeleted === nextProps.message.isDeleted &&
    prevProps.isOwn === nextProps.isOwn
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
  // State variable for online users
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  // State variables for audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioPlayback, setAudioPlayback] = useState(null);
  const recordingTimerRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // State variables for call functionality
  const [callStatus, setCallStatus] = useState(null); // "ringing", "ongoing", "ended"
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [isMakingCall, setIsMakingCall] = useState(false);
  const [isCallAccepted, setIsCallAccepted] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callerId, setCallerId] = useState(null);
  const [callerName, setCallerName] = useState(null);
  const [callerAvatar, setCallerAvatar] = useState(null);
  const [calleeId, setCalleeId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimer, setCallTimer] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [screenSharing, setScreenSharing] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const previousConversation = useRef(null);
  const emojiPickerRef = useRef(null);
  const socketRef = useRef(null);
  const pendingMessagesRef = useRef([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  
  // Handle incoming call
  const handleIncomingCall = useCallback(async (callData) => {
    // Set call state
    setIsIncomingCall(true);
    setCallerId(callData.callerId);
    setCallerName(callData.callerName);
    setCallerAvatar(callData.callerAvatar);
    setIsVideoCall(callData.isVideoCall);
    setCallStatus('ringing');
    
    // Play ringtone
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(e => console.log('Could not play ringtone', e));
    
    // Save reference to stop later
    window.__ringtone = audio;
  }, []);

  // Clean up call resources
  const cleanupCallResources = () => {
    // Stop call timer
    if (callTimer) {
      clearInterval(callTimer);
      setCallTimer(null);
    }
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    // Stop screen sharing
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    
    // Reset screen sharing state
    setScreenSharing(false);
  };

  // Handle when call is ended by either party
  const handleCallEnded = useCallback(() => {
    // Just clean up if we've already ended
    if (callStatus === 'ended') {
      return;
    }
    
    // Update status
    setCallStatus('ended');
    
    // Show ended message
    const callLength = callDuration;
    
    // Clean up resources
    cleanupCallResources();
    
    // Update call history with duration
    if (window.__currentCallId) {
      setCallHistory(prev => 
        prev.map(call => 
          call.id === window.__currentCallId 
            ? { ...call, status: 'completed', duration: callLength } 
            : call
        )
      );
    }
    
    // Reset state after a delay
    setTimeout(() => {
      setCallStatus(null);
      setIsCallAccepted(false);
      setIsMakingCall(false);
      setIsIncomingCall(false);
      setCallerId(null);
      setCallerName(null);
      setCallerAvatar(null);
      setCalleeId(null);
      setCallDuration(0);
    }, 3000);
  }, [callStatus, callDuration]);

  // Start call timer
  const startCallTimer = () => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    setCallTimer(timer);
  };

  // Handle when call is accepted
  const handleCallAccepted = useCallback(async (data) => {
    if (!peerConnectionRef.current) return;
    
    try {
      // Set remote description from answer
      await peerConnectionRef.current.setRemoteDescription(
        new RTCSessionDescription(data.sdp)
      );
      
      // Update call state
      setIsMakingCall(false);
      setIsCallAccepted(true);
      setCallStatus('ongoing');
      
      // Start call timer
      startCallTimer();
      
      // Update call in database - only if callId exists
      if (window.__callId) {
        try {
          await axios.put(
            `API_BASE_URL/calls/status/${window.__callId}`,
            { status: "connected" },
            { withCredentials: true }
          );
        } catch (error) {
          console.error("Error updating call status:", error);
        }
      }
      
    } catch (error) {
      console.error('Error handling accepted call:', error);
      handleEndCall();
    }
  }, []);
  
  // Handle when call is declined
  const handleCallDeclined = useCallback(() => {
    // Update call state
    setIsMakingCall(false);
    setCallStatus('ended');
    
    // Clean up resources
    cleanupCallResources();
    
    // Show declined message
    alert('Call was declined');
    
    // Update call history
    setCallHistory(prev => 
      prev.map(call => 
        call.id === window.__currentCallId 
          ? { ...call, status: 'declined' } 
          : call
      )
    );
    
    // Update call in database
    try {
      if (window.__callId) {
        axios.put(
          `API_BASE_URL/calls/status/${window.__callId}`,
          { status: "declined" },
          { withCredentials: true }
        );
      }
    } catch (error) {
      console.error("Error updating call status:", error);
    }
    
    // Reset state after a delay
    setTimeout(() => {
      setCallStatus(null);
      setCalleeId(null);
    }, 3000);
  }, []);
  
  // Handle ICE candidate from remote peer
  const handleIceCandidate = useCallback((data) => {
    if (peerConnectionRef.current && data.candidate) {
      try {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
          .catch(e => console.error('Error adding ICE candidate:', e));
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    }
  }, []);

  // End the current call
  const handleEndCall = () => {
    // Notify the other party
    if (calleeId) {
      socketRef.current.emit('call_end', {
        receiverId: calleeId
      });
    } else if (callerId) {
      socketRef.current.emit('call_end', {
        receiverId: callerId
      });
    }
    
    // Update call in database - only if callId exists
    if (window.__callId) {
      try {
        axios.put(
          `API_BASE_URL/calls/status/${window.__callId}`,
          { 
            status: "ended",
            duration: callDuration 
          },
          { withCredentials: true }
        );
      } catch (error) {
        console.error("Error updating call status:", error);
      }
    }
    
    // Handle the rest of cleanup
    handleCallEnded();
  };

  // Prevent render flicker on initial load
  useEffect(() => {
    // Add a class to prevent transitions during initial load
    document.body.classList.add('no-transition');
    
    // Remove the class after a small delay
    const timer = setTimeout(() => {
      document.body.classList.remove('no-transition');
    }, 300);
    
    return () => {
      clearTimeout(timer);
      document.body.classList.remove('no-transition');
    };
  }, []);

  // Limit rendering when visible only
  const isVisible = useRef(true);
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = document.visibilityState === 'visible';
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Mark a message as read
  const markMessageAsRead = async (messageId) => {
    try {
      await axios.put(
        `API_BASE_URL/messages/mark-read/${messageId}`,
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
        `API_BASE_URL/messages/mark-conversation-read/${conversationId}`,
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
      const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        setConversations(response.data.conversations);
        
        // Get unread counts for each conversation
        const counts = {};
        for (const conv of response.data.conversations) {
          const countResponse = await axios.get(`API_BASE_URL/messages/unread-count/${conv._id}`, {
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
    // Get shared socket instance
    socketRef.current = getSocket();
    
    // Get current user information
    const fetchCurrentUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          withCredentials: true
        });
        
        if (response.data.success) {
          console.log("Current user data:", response.data.user);
          setCurrentUser(response.data.user);
          
          // Identify to the socket server who we are
          if (socketRef.current) {
            socketRef.current.emit('user_connected', response.data.user._id);
          }
        } else {
          console.error("Failed to get current user:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching current user:", error.response?.data || error.message);
      }
    };

    fetchCurrentUser();
    
    // Clean up when component unmounts
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket reference");
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only runs once

  // Separate useEffect for message handlers
  useEffect(() => {
    if (!socketRef.current || !currentUser) {
      return;
    }
    
    console.log("Setting up socket message handlers");
    
    // Handler for new messages
    const handleNewMessage = (message) => {
      console.log("Received new message:", message);
      
      // Check if message is already in our state to avoid duplicates
      setMessages(prevMessages => {
        if (prevMessages.some(m => m._id === message._id || 
                                 (m.tempId && m.tempId === message.tempId))) {
          return prevMessages;
        }
        
        // Check if this message belongs to the current conversation
        if (activeConversation && 
            (message.conversation === activeConversation._id || 
             message.conversationId === activeConversation._id)) {
          
          // Mark as read if we're viewing this conversation
          if (message.sender !== currentUser._id) {
            markMessageAsRead(message._id);
          }
          
          return [...prevMessages, message];
        }
        
        return prevMessages;
      });
      
      // Update conversation list with the new message
      updateConversationList(message);
    };

    // Handle deleted messages
    const handleMessageDeleted = ({ messageId, deleteFor }) => {
      console.log("Message deleted event:", messageId, deleteFor);
      
      if (deleteFor === 'everyone') {
        setMessages(prev => 
          prev.map(m => 
            m._id === messageId ? 
              { ...m, isDeleted: true, content: "This message was deleted" } : m
          )
        );
      } else {
        // Just remove from this user's view
        setMessages(prev => prev.filter(m => m._id !== messageId));
      }
    };
    
    socketRef.current.on("new_message", handleNewMessage);
    socketRef.current.on("message_deleted", handleMessageDeleted);
    socketRef.current.on("user_status_changed", (data) => {
      console.log("User status changed:", data);
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.userId);
        } else {
          newSet.delete(data.userId);
        }
        return newSet;
      });
    });
    
    socketRef.current.on("online_users", (userIds) => {
      console.log("Received online users:", userIds);
      setOnlineUsers(new Set(userIds));
    });
    
    return () => {
      socketRef.current.off("new_message", handleNewMessage);
      socketRef.current.off("message_deleted", handleMessageDeleted);
      socketRef.current.off("user_status_changed");
      socketRef.current.off("online_users");
    };
  }, [activeConversation, currentUser, updateConversationList]);

  // Add this effect to process queued messages once user is loaded
  useEffect(() => {
    if (currentUser && pendingMessagesRef.current.length > 0) {
      console.log("Processing queued messages:", pendingMessagesRef.current.length);
      
      const messagesToProcess = [...pendingMessagesRef.current];
      pendingMessagesRef.current = []; // Clear the queue
      
      messagesToProcess.forEach(message => {
        // Re-emit these messages to be processed by the normal handler
        if (socketRef.current) {
          socketRef.current.emit("new_message", message);
        }
      });
    }
  }, [currentUser]);

  // Update the join/leave conversation useEffect
  useEffect(() => {
    if (socketRef.current && activeConversation) {
      const conversationId = activeConversation._id;
      console.log('Joining conversation room:', conversationId);
      
      // Leave previous conversation if any
      if (previousConversation.current && 
          previousConversation.current !== conversationId) {
        socketRef.current.emit('leave_conversation', previousConversation.current);
        console.log('Left conversation:', previousConversation.current);
      }
      
      // Join new conversation
      socketRef.current.emit('join_conversation', conversationId);
      previousConversation.current = conversationId;
      
      // Mark conversation as read when joining
      markConversationAsRead(conversationId);
      
      // Update unread counts
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: 0
      }));
    }
    
    return () => {
      if (socketRef.current && activeConversation) {
        socketRef.current.emit('leave_conversation', activeConversation._id);
      }
    };
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) && 
          !event.target.classList.contains('whatsapp-emoji') && 
          !event.target.closest('.whatsapp-emoji')) {
        setShowEmojiPicker(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [emojiPickerRef]);
  
  // Add this useEffect to preload common emojis in your component
  useEffect(() => {
    // Preload common emoji sets to improve first render performance
    const commonEmojis = ['😀', '😂', '👍', '❤️', '🙏', '👋', '😊', '🎉', '👏', '🔥',
                          '😁', '😄', '😆', '😅', '😂', '🤣', '😇', '😉', '😘', '🥰'];
    
    // Batch process to avoid blocking the main thread
    const preloadEmojis = (index = 0) => {
      if (index >= commonEmojis.length) return;
      
      const emoji = commonEmojis[index];
      if (typeof twemoji !== 'undefined') {
        twemoji.parse(emoji, {
          folder: 'svg',
          ext: '.svg'
        });
      }
      
      // Process next emoji in the next idle period
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => preloadEmojis(index + 1));
      } else {
        setTimeout(() => preloadEmojis(index + 1), 0);
      }
    };
    
    // Start preloading
    preloadEmojis();
  }, []);
  
  // Get other participant in conversation - FIXED FUNCTION
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) {
      return { name: "Unknown" };
    }
    
    // Use currentUser._id directly 
    const myId = currentUser?._id;
    if (!myId) {
      return { name: "Unknown" };
    }
    
    // Find the participant that isn't the current user
    const otherParticipant = conversation.participants.find(p => 
      p._id !== myId && 
      p !== null && 
      p !== undefined
    );
    
    return otherParticipant || { name: "Unknown" };
  };

  // Add this helper function after getOtherParticipant

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId);
  }, [onlineUsers]);
  
  // Fetch messages
  const fetchMessages = async (conversationId, page = 1, append = false) => {
    try {
      setLoadingMore(true);
      
      // Add a short delay to prevent rate limiting
      await new Promise(r => setTimeout(r, 300));
      
      console.log(`Fetching messages for conversation: ${conversationId}, page: ${page}`);
      const response = await axios.get(
        `${API_BASE_URL}/messages/${conversationId}?page=${page}&limit=20`, 
        { withCredentials: true }
      );
      
      console.log("Messages response:", response.data);
      
      if (response.data.success) {
        if (append) {
          setMessages(prev => [...response.data.messages.reverse(), ...prev]);
        } else {
          setMessages(response.data.messages.reverse());
        }
        
        setHasMore(response.data.hasMore);
        setPage(page);
        
        // Mark conversation as read when opening it
        if (page === 1 && !append) {
          markConversationAsRead(conversationId);
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error.response?.data || error.message);
    } finally {
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
    if (!newMessage.trim() || !activeConversation) {
      return;
    }
    
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
      console.log(`Sending message to conversation: ${activeConversation._id}`);
      console.log(`Message content: ${newMessage.trim()}`);
      console.log(`Other participant: ${getOtherParticipant(activeConversation)._id}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/messages`, 
        {
          content: newMessage.trim(),
          conversationId: activeConversation._id,
          receiverId: getOtherParticipant(activeConversation)._id
        },
        { withCredentials: true }
      );
      
      console.log("Send message response:", response.data);
      
      if (response.data.success) {
        // Replace temp message with the actual message from server
        setMessages(prev => 
          prev.map(msg => 
            msg._id === tempId ? response.data.message : msg
          )
        );
        
        // Emit to socket for real-time updates
        if (socketRef.current) {
          socketRef.current.emit('send_message', response.data.message);
        }
      } else {
        // Handle error - remove temp message
        setMessages(prev => prev.filter(msg => msg._id !== tempId));
        console.error("Failed to send message:", response.data.message);
      }
    } catch (error) {
      // Handle error - remove temp message
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
      console.error("Error sending message:", error.response?.data || error.message);
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
        `${API_BASE_URL}/messages/attachment`,
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
        
        socketRef.current.emit("send_message", realMessage);
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
        `API_BASE_URL/messages/message/${messageId}?deleteFor=${deleteFor}`,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        console.log(`Message deleted successfully with option: ${deleteFor}`);
        
        // Emit socket event for "delete for everyone" option only (modified)
        if (deleteFor === "everyone" && activeConversation && socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("delete_message", {
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
        `API_BASE_URL/messages/conversation/${conversationId}`,
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
        const isOwn = isOwnMessage(message);
        const messageDate = new Date(message.createdAt).toDateString();
        const showDate = lastDate !== messageDate;
        if (showDate) {
          lastDate = messageDate;
        }
        
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
            
            <MemoizedMessageBubble
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

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
      });
      
      // Start recording
      mediaRecorder.start();
      setAudioRecorder(mediaRecorder);
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (audioRecorder && audioRecorder.state !== "inactive") {
      audioRecorder.stop();
      setIsRecording(false);
      
      // Clear timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    if (audioRecorder && audioRecorder.state !== "inactive") {
      audioRecorder.stop();
    }
    
    setIsRecording(false);
    setAudioBlob(null);
    
    // Clear timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    setRecordingTime(0);
  };

  // Send voice message
  const sendVoiceMessage = async () => {
    if (!audioBlob || !activeConversation) return;
    
    // Generate a unique temp ID
    const tempId = `temp-${Date.now()}`;
    const currentTimestamp = new Date().toISOString();
    
    // Create a temp URL for immediate display
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create temporary message for immediate display
    const tempAttachment = {
      type: 'audio/webm',
      filename: 'Voice message',
      url: audioUrl,
      isVoiceMessage: true
    };
    
    const tempMessage = {
      _id: tempId,
      tempId,
      content: '',
      attachment: tempAttachment,
      createdAt: currentTimestamp,
      sender: currentUser,
      read: false,
      isTemp: true,
      conversationId: activeConversation._id
    };
    
    // Add to messages for immediate display
    setMessages(prev => [...prev, tempMessage]);
    updateConversationList(tempMessage);
    
    // Reset audio state
    setAudioBlob(null);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice-message.webm');
    formData.append('conversationId', activeConversation._id);
    formData.append('receiverId', getOtherParticipant(activeConversation)._id);
    formData.append('messageType', 'voice');
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const response = await axios.post(
        `${API_BASE_URL}/messages/attachment`,
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
        
        // Clean up the blob URL
        URL.revokeObjectURL(audioUrl);
        
        // Emit to socket
        socketRef.current.emit("send_message", realMessage);
      }
    } catch (error) {
      console.error("Error sending voice message:", error);
      alert("Failed to send voice message. Please try again.");
      
      // Remove the temp message
      setMessages(prev => prev.filter(msg => msg._id !== tempId && msg.tempId !== tempId));
      
      // Revoke the blob URL
      URL.revokeObjectURL(audioUrl);
      
      // Refresh conversation list
      fetchConversations();
    } finally {
      setIsUploading(false);
    }
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Handle emoji selection
  const handleEmojiClick = useCallback((emojiData) => {
    const emoji = emojiData.emoji;
    
    // Use requestAnimationFrame for smoother UI updates
    window.requestAnimationFrame(() => {
      setNewMessage(prev => prev + emoji);
      
      // Preload emoji to avoid flickering on first appearance
      if (typeof twemoji !== 'undefined') {
        twemoji.parse(emoji, {
          folder: 'svg',
          ext: '.svg'
        });
      }
      
      // Focus back on input in the next frame
      window.requestAnimationFrame(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      });
    });
  }, []);

  // Initialize WebRTC peer connection
  const initializePeerConnection = useCallback(() => {
    // Close any existing connections
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Create new connection with STUN/TURN servers for NAT traversal
    peerConnectionRef.current = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // You should add proper TURN servers in production
        // { urls: 'turn:your-turn-server.com', username: 'username', credential: 'credential' }
      ]
    });
    
    // Handle ICE candidates
    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send the ICE candidate to the remote peer via signaling
        socketRef.current.emit('ice_candidate', {
          candidate: event.candidate,
          receiverId: isIncomingCall ? callerId : calleeId
        });
      }
    };
    
    // Handle connection state changes
    peerConnectionRef.current.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnectionRef.current.connectionState);
      if (peerConnectionRef.current.connectionState === 'disconnected' || 
          peerConnectionRef.current.connectionState === 'failed') {
        handleEndCall();
      }
    };
    
    // Handle incoming tracks from remote peer
    peerConnectionRef.current.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    
    return peerConnectionRef.current;
  }, [callerId, calleeId, isIncomingCall]);

  // Initialize media stream
  const initializeMediaStream = async (isVideo = false) => {
    try {
      // Get user's media based on call type
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      });
      
      // Save the stream reference
      localStreamRef.current = stream;
      
      // Set local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Add tracks to peer connection
      if (peerConnectionRef.current) {
        stream.getTracks().forEach(track => {
          peerConnectionRef.current.addTrack(track, stream);
        });
      }
      
      return stream;
    } catch (error) {
      console.error('Error getting media stream:', error);
      alert('Could not access camera/microphone. Please check your permissions.');
      handleEndCall();
      return null;
    }
  };

  // Handle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (screenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => {
            track.stop();
            
            // Remove screen track from peer connection
            if (peerConnectionRef.current) {
              const senders = peerConnectionRef.current.getSenders();
              const sender = senders.find(s => s.track.kind === 'video');
              if (sender) {
                // Replace screen track with camera track
                if (localStreamRef.current) {
                  const videoTrack = localStreamRef.current.getVideoTracks()[0];
                  if (videoTrack) {
                    sender.replaceTrack(videoTrack);
                    
                    // Update local video
                    if (localVideoRef.current) {
                      localVideoRef.current.srcObject = localStreamRef.current;
                    }
                  }
                }
              }
            }
          });
        }
        screenStreamRef.current = null;
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        screenStreamRef.current = screenStream;
        
        // Replace video track in peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const sender = senders.find(s => s.track.kind === 'video');
          if (sender) {
            const screenVideoTrack = screenStream.getVideoTracks()[0];
            await sender.replaceTrack(screenVideoTrack);
          }
        }
        
        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Handle when user stops sharing screen via browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenSharing();
        };
      }
      
      setScreenSharing(!screenSharing);
    } catch (error) {
      console.error('Error during screen sharing:', error);
      alert('Could not start screen sharing. Please try again.');
    }
  };

  // Initiate a call
  const initiateCall = async (isVideo = false) => {
    if (!activeConversation) return;
    
    const receiver = getOtherParticipant(activeConversation);
    
    // Initialize call state
    setIsVideoCall(isVideo);
    setIsMakingCall(true);
    setCallStatus('ringing');
    setCalleeId(receiver._id);
    
    // Initialize WebRTC
    initializePeerConnection();
    
    try {
      // Get media stream
      const stream = await initializeMediaStream(isVideo);
      if (!stream) return;
      
      // Create offer
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: isVideo
      });
      
      // Set local description
      await peerConnectionRef.current.setLocalDescription(offer);
      
      // Send call offer via socket
      socketRef.current.emit('call_offer', {
        callerId: currentUser._id,
        callerName: currentUser.name,
        callerAvatar: currentUser.profilePicture || null,
        receiverId: receiver._id,
        sdp: offer,
        conversationId: activeConversation._id,
        isVideoCall: isVideo
      });
      
      // Save call to history
      const newCall = {
        id: Date.now().toString(),
        participantId: receiver._id,
        participantName: receiver.name,
        participantAvatar: receiver.profilePicture || null,
        timestamp: new Date().toISOString(),
        duration: 0,
        status: 'outgoing',
        isVideoCall: isVideo
      };
      
      setCallHistory(prev => [newCall, ...prev]);
      
      // Record call in database
      try {
        await axios.post(
          `${API_BASE_URL}/calls`,
          {
            receiverId: receiver._id,
            conversationId: activeConversation._id,
            callType: isVideo ? "video" : "audio",
            status: "initiated"
          },
          { withCredentials: true }
        );
      } catch (error) {
        console.error("Error saving call record:", error);
      }
      
    } catch (error) {
      console.error('Error initiating call:', error);
      handleEndCall();
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    try {
      // Stop ringtone
      if (window.__ringtone) {
        window.__ringtone.pause();
        window.__ringtone = null;
      }
      
      // Initialize WebRTC
      initializePeerConnection();
      
      // Get media stream
      const stream = await initializeMediaStream(isVideoCall);
      if (!stream) return;
      
      // Set call as accepted
      setIsIncomingCall(false);
      setIsCallAccepted(true);
      setCallStatus('ongoing');
      
      // Start call timer
      startCallTimer();
      
      // Set remote description from offer
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(window.__lastOffer));
      
      // Create answer
      const answer = await peerConnectionRef.current.createAnswer();
      
      // Set local description
      await peerConnectionRef.current.setLocalDescription(answer);
      
      // Send answer to caller
      socketRef.current.emit('call_answer', {
        calleeId: currentUser._id,
        callerId: callerId,
        sdp: answer,
        accepted: true
      });
      
      // Update call in database
      try {
        await axios.put(
          `API_BASE_URL/calls/status/${window.__callId}`,
          { status: "accepted" },
          { withCredentials: true }
        );
      } catch (error) {
        console.error("Error updating call status:", error);
      }
      
    } catch (error) {
      console.error('Error accepting call:', error);
      handleEndCall();
    }
  };

  // Decline incoming call
  const declineCall = () => {
    // Stop ringtone
    if (window.__ringtone) {
      window.__ringtone.pause();
      window.__ringtone = null;
    }
    
    // Send decline message
    socketRef.current.emit('call_answer', {
      calleeId: currentUser._id,
      callerId: callerId,
      accepted: false
    });
    
    // Reset call state
    setIsIncomingCall(false);
    setCallerId(null);
    setCallerName(null);
    setCallerAvatar(null);
    setCallStatus(null);
    
    // Update call in database
    try {
      axios.put(
        `API_BASE_URL/calls/status/${window.__callId}`,
        { status: "declined" },
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Error updating call status:", error);
    }
  };

  // Update this useEffect to properly store callId
  useEffect(() => {
    if (!socketRef.current) return;

    // Call offer received
    socketRef.current.on('call_offer', async (data) => {
      console.log('Call offer received:', data);
      if (data.sdp) {
        window.__lastOffer = data.sdp;
      }
      if (data.callId) {
        window.__callId = data.callId;
        console.log('Stored call ID:', window.__callId);
      }
      handleIncomingCall(data);
    });

    // Call answer received
    socketRef.current.on('call_answer', (data) => {
      console.log('Call answer received:', data);
      if (data.accepted) {
        handleCallAccepted(data);
      } else {
        handleCallDeclined();
      }
    });

    // Call ended by other party
    socketRef.current.on('call_end', () => {
      console.log('Call end received');
      handleCallEnded();
    });

    // ICE candidate from remote peer
    socketRef.current.on('ice_candidate', (data) => {
      console.log('ICE candidate received');
      handleIceCandidate(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off('call_offer');
        socketRef.current.off('call_answer');
        socketRef.current.off('call_end');
        socketRef.current.off('ice_candidate');
      }
    };
  }, [handleIncomingCall, handleCallAccepted, handleCallDeclined, handleCallEnded, handleIceCandidate]);

  // Add this function to format call duration
  const formatCallDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ]
      .filter(Boolean)
      .join(':');
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Toggle speaker
  const toggleSpeaker = () => {
    if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
      const audioEl = document.createElement('audio');
      audioEl.srcObject = remoteVideoRef.current.srcObject;
      audioEl.setSinkId(isSpeakerOn ? 'default' : '');
      setIsSpeakerOn(!isSpeakerOn);
    }
  };

  // Add to both message components right after socket initialization

  // Debounced online status handler
  const updateOnlineStatus = useCallback(
    debounce((userId, isOnline) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    }, 500),
    []
  );

  // Update this in your socket handling section
  useEffect(() => {
    if (!socketRef.current) return;
    
    socketRef.current.on("user_status_changed", (data) => {
      updateOnlineStatus(data.userId, data.isOnline);
    });
    
    socketRef.current.on("online_users", (userIds) => {
      // Batch update all online users at once
      setOnlineUsers(new Set(userIds));
      
      // Cache for offline fallback
      localStorage.setItem('onlineUsers', JSON.stringify(userIds));
    });
    
    // Restore from localStorage on init
    const cachedOnlineUsers = localStorage.getItem('onlineUsers');
    if (cachedOnlineUsers) {
      try {
        setOnlineUsers(new Set(JSON.parse(cachedOnlineUsers)));
      } catch (e) {
        console.error('Failed to parse cached online users');
      }
    }
    
    return () => {
      socketRef.current?.off("user_status_changed");
      socketRef.current?.off("online_users");
    };
  }, [updateOnlineStatus]);

  return (
    <div className={`whatsapp-container ${darkMode ? "whatsapp-dark" : ""}`}>
      <div className={`whatsapp-sidebar ${mobileView && !showConversations ? "whatsapp-sidebar-hidden" : ""}`}>
        <div className="whatsapp-header">
          <div className="whatsapp-user-info">
            {currentUser ? (
              currentUser.profilePicture ? (
                <img 
                  src={currentUser.profilePicture} 
                  alt="Profile" 
                  className="whatsapp-profile-image" 
                  onError={(e) => {
                    console.log("Failed to load current user avatar:", e);
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/40?text=U";
                  }}
                />
              ) : (
                <div className="whatsapp-default-avatar whatsapp-header-avatar">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                </div>
              )
            ) : (
              <div className="whatsapp-default-avatar whatsapp-header-avatar">
                <FaUser />
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
                  if (conversation.lastMessage.attachment.isVoiceMessage) {
                    return "🎤 Voice Message";
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
                  {(() => {
                    const otherUser = getOtherParticipant(activeConversation);
                    if (!otherUser) {
                      return (
                        <div className="whatsapp-default-avatar">
                          <FaUser />
                        </div>
                      );
                    }
                    
                    if (otherUser.profilePicture) {
                      // Add console log to debug avatar URLs
                      console.log("Chat partner avatar URL:", otherUser.profilePicture);
                      
                      return (
                        <img 
                          src={getOtherParticipant(activeConversation).profilePicture} 
                          alt={getOtherParticipant(activeConversation)?.name || "User"} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              getOtherParticipant(activeConversation)?.name || 'User'
                            )}&background=random&color=fff&size=160`;
                          }}
                        />
                      );
                    } else {
                      return (
                        <div className="whatsapp-default-avatar">
                          {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : "?"}
                        </div>
                      );
                    }
                  })()}
                </div>
                
                <div className="whatsapp-chat-user-info">
                  <h3>{getOtherParticipant(activeConversation).name}</h3>
                  <span className={`whatsapp-user-status ${isUserOnline(getOtherParticipant(activeConversation)._id) ? "whatsapp-status-online" : ""}`}>
                    {isUserOnline(getOtherParticipant(activeConversation)._id) ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              
              <div className="whatsapp-chat-actions">
                {/* Add call buttons */}
                <button 
                  className="whatsapp-icon-button"
                  onClick={() => initiateCall(false)}
                  title="Voice Call"
                >
                  <FaPhoneAlt />
                </button>
                <button 
                  className="whatsapp-icon-button"
                  onClick={() => initiateCall(true)}
                  title="Video Call"
                >
                  <FaVideo />
                </button>
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
            
            {/* Updated chat footer section */}
            <div className="whatsapp-chat-footer">
              {isRecording ? (
                <div className="whatsapp-recording">
                  <div className="whatsapp-recording-indicator">
                    <span className="recording-dot"></span>
                    <span className="recording-time">{formatTime(recordingTime)}</span>
                  </div>
                  <div className="whatsapp-recording-actions">
                    <button 
                      className="whatsapp-icon-button whatsapp-cancel-recording"
                      onClick={cancelRecording}
                    >
                      <FaTrash />
                    </button>
                    <button 
                      className="whatsapp-icon-button whatsapp-send-recording"
                      onClick={stopRecording}
                    >
                      <FaCheck />
                    </button>
                  </div>
                </div>
              ) : audioBlob ? (
                <div className="whatsapp-recording-preview">
                  <div className="whatsapp-voice-message">
                    <button 
                      className="whatsapp-voice-play-btn"
                      onClick={() => {
                        const audio = new Audio(URL.createObjectURL(audioBlob));
                        if (audioPlayback) {
                          audioPlayback.pause();
                        }
                        audio.play();
                        setAudioPlayback(audio);
                      }}
                    >
                      <FaPlay />
                    </button>
                    <div className="whatsapp-voice-waveform"></div>
                    <div className="whatsapp-recording-actions">
                      <button 
                        className="whatsapp-icon-button whatsapp-cancel-recording"
                        onClick={() => setAudioBlob(null)}
                      >
                        <FaTrash />
                      </button>
                      <button 
                        className="whatsapp-icon-button whatsapp-send-recording"
                        onClick={sendVoiceMessage}
                      >
                        <FaPaperPlane />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <button 
                    className="whatsapp-icon-button whatsapp-emoji"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <FaSmile />
                  </button>
                  
                  {showEmojiPicker && (
                    <div className="whatsapp-emoji-picker" ref={emojiPickerRef}>
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        searchPlaceholder="Search emoji"
                        width={300}
                        height={400}
                        previewConfig={{
                          showPreview: false
                        }}
                        lazyLoadEmojis={false}
                        skinTonesDisabled
                        autoFocusSearch={false}
                        categories={['suggested', 'smileys_people', 'animals_nature', 'food_drink']}
                        suggestedEmojisMode="recent"
                      />
                    </div>
                  )}
                  
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
                    onClick={newMessage.trim() ? handleSendMessage : startRecording}
                  >
                    {newMessage.trim() ? <FaPaperPlane /> : <FaMicrophone />}
                  </button>
                </>
              )}
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

      {/* Incoming call UI */}
      {isIncomingCall && (
        <div className="whatsapp-call-overlay">
          <div className="whatsapp-incoming-call">
            <div className="whatsapp-call-header">
              <h3>{isVideoCall ? 'Incoming Video Call' : 'Incoming Call'}</h3>
            </div>
            <div className="whatsapp-caller-info">
              <div className="whatsapp-caller-avatar">
                {callerAvatar ? (
                  <img src={callerAvatar} alt={callerName} />
                ) : (
                  <div className="whatsapp-default-avatar whatsapp-large-avatar">
                    {callerName ? callerName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
              <h2>{callerName}</h2>
              <p className="whatsapp-calling-status">Calling...</p>
            </div>
            <div className="whatsapp-call-actions">
              <button 
                className="whatsapp-call-action whatsapp-decline-call"
                onClick={declineCall}
              >
                <FaPhoneAlt />
              </button>
              <button 
                className="whatsapp-call-action whatsapp-accept-call"
                onClick={acceptCall}
              >
                <FaPhoneAlt />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing call UI */}
      {isMakingCall && !isCallAccepted && (
        <div className="whatsapp-call-overlay">
          <div className="whatsapp-outgoing-call">
            <div className="whatsapp-call-header">
              <h3>{isVideoCall ? 'Video Call' : 'Voice Call'}</h3>
            </div>
            <div className="whatsapp-callee-info">
              {activeConversation && (
                <>
                  <div className="whatsapp-callee-avatar">
                    {getOtherParticipant(activeConversation).profilePicture ? (
                      <img 
                        src={getOtherParticipant(activeConversation).profilePicture} 
                        alt={getOtherParticipant(activeConversation).name} 
                      />
                    ) : (
                      <div className="whatsapp-default-avatar whatsapp-large-avatar">
                        {getOtherParticipant(activeConversation).name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h2>{getOtherParticipant(activeConversation).name}</h2>
                  <p className="whatsapp-calling-status">Calling...</p>
                </>
              )}
            </div>
            <div className="whatsapp-call-actions">
              <button 
                className="whatsapp-call-action whatsapp-end-call"
                onClick={handleEndCall}
              >
                <FaPhoneAlt />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active call UI */}
      {isCallAccepted && (
        <div className="whatsapp-call-overlay">
          <div className={`whatsapp-active-call ${isVideoCall ? 'whatsapp-video-call' : 'whatsapp-audio-call'}`}>
            {isVideoCall ? (
              <div className="whatsapp-video-container">
                <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="whatsapp-remote-video"
                />
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="whatsapp-local-video"
                />
              </div>
            ) : (
              <div className="whatsapp-audio-call-container">
                <div className="whatsapp-call-avatar">
                  {isIncomingCall ? (
                    callerAvatar ? (
                      <img src={callerAvatar} alt={callerName} />
                    ) : (
                      <div className="whatsapp-default-avatar whatsapp-large-avatar">
                        {callerName ? callerName.charAt(0).toUpperCase() : "U"}
                      </div>
                    )
                  ) : (
                    getOtherParticipant(activeConversation).profilePicture ? (
                      <img 
                        src={getOtherParticipant(activeConversation).profilePicture} 
                        alt={getOtherParticipant(activeConversation).name} 
                      />
                    ) : (
                      <div className="whatsapp-default-avatar whatsapp-large-avatar">
                        {getOtherParticipant(activeConversation).name.charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                </div>
                <h2>
                  {isIncomingCall ? callerName : getOtherParticipant(activeConversation).name}
                </h2>
              </div>
            )}
            
            <div className="whatsapp-call-info">
              <p className="whatsapp-call-duration">{formatCallDuration(callDuration)}</p>
            </div>
            
            <div className="whatsapp-call-controls">
              {isVideoCall && (
                <>
                  <button 
                    className={`whatsapp-call-control ${isVideoOff ? 'active' : ''}`}
                    onClick={toggleVideo}
                  >
                    {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                  </button>
                  <button 
                    className={`whatsapp-call-control ${screenSharing ? 'active' : ''}`}
                    onClick={toggleScreenSharing}
                  >
                    <FaDesktop />
                  </button>
                </>
              )}
              <button 
                className={`whatsapp-call-control ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
              >
                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              <button 
                className={`whatsapp-call-control ${!isSpeakerOn ? 'active' : ''}`}
                onClick={toggleSpeaker}
              >
                {isSpeakerOn ? <FaVolumeUp /> : <FaVolumeMute />}
              </button>
              <button 
                className="whatsapp-call-control whatsapp-end-call"
                onClick={handleEndCall}
              >
                <FaPhone />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Call ended UI */}
      {callStatus === 'ended' && (
        <div className="whatsapp-call-ended">
          <p>Call ended</p>
        </div>
      )}
    </div>
  );
};

export default EmployerMessage;
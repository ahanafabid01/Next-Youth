/**
 * Create a consistent conversation ID between two users
 * by sorting their IDs and joining them with an underscore
 */
export const getConversationId = (user1Id, user2Id) => {
  return [user1Id, user2Id].sort().join('_');
};

/**
 * Format a timestamp for display in messages
 */
export const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format a date for display in message headers
 */
export const formatMessageDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  
  // If today, show "Today"
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  
  // If yesterday, show "Yesterday"
  if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  
  // Otherwise, show the date
  return date.toLocaleDateString();
};
# Chat System Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Dependencies

```bash
npm install socket.io-client axios
```

### Step 2: Get Your Auth Token

```javascript
// Login first to get token
const response = await fetch('http://your-api.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'yourpassword'
  })
});

const { token, user } = await response.json();
localStorage.setItem('jwt_token', token);
localStorage.setItem('user_role', user.role); // 'user' or 'admin'
localStorage.setItem('user_id', user.id);
```

### Step 3: Connect to WebSocket

```javascript
import io from 'socket.io-client';

const socket = io('http://your-api.com', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

socket.on('connect', () => {
  console.log('✅ Connected!');
});
```

### Step 4: Send & Receive Messages

```javascript
// Send a message (conversationId optional for NEW clients)
socket.emit('chatMessage', {
  conversationId: 1,  // Omit this for first-time message from client
  message: 'Hello!'
});

// Receive messages
socket.on('chatMessage', (data) => {
  console.log('New message:', data.content);
  displayMessage(data);
});
```

---

## 📊 Complete Integration Flows

### Flow 1: New Client Sends First Message

This is the complete flow when a NEW user/client wants to start a conversation with admin for the first time.

#### Frontend Implementation (Client Side)

```javascript
// ============================================
// STEP 1: Check if client has any conversations
// ============================================
async function initializeChat() {
  const token = localStorage.getItem('jwt_token');
  const userRole = localStorage.getItem('user_role');
  
  if (userRole !== 'user') {
    console.log('Only clients can initiate new conversations');
    return;
  }

  try {
    // Fetch existing conversations
    const response = await axios.get('http://your-api.com/api/chat/conversations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const conversations = response.data.data;
    
    if (conversations.length === 0) {
      // NEW CLIENT - No conversations exist
      console.log('New client - No conversations yet');
      showNewClientUI(); // Show UI to send first message
    } else {
      // EXISTING CLIENT - Has conversations
      console.log('Existing client - Loading conversations');
      displayConversations(conversations);
    }
  } catch (error) {
    console.error('Error fetching conversations:', error);
  }
}

// ============================================
// STEP 2: Send first message (NEW CLIENT)
// ============================================
function sendFirstMessage(message) {
  if (!message.trim()) {
    alert('Please enter a message');
    return;
  }

  // For NEW clients, DO NOT include conversationId
  socket.emit('chatMessage', {
    // conversationId: OMIT THIS for first message
    message: message.trim()
  });
  
  console.log('First message sent! Waiting for conversation to be created...');
}

// ============================================
// STEP 3: Listen for message confirmation
// ============================================
socket.on('messageReceived', (data) => {
  console.log('Message confirmed:', data);
  
  // Save the newly created conversationId
  const conversationId = data.conversationId;
  localStorage.setItem('current_conversation_id', conversationId);
  
  // Display the message in UI
  displayMessage({
    id: data.id,
    content: data.content,
    sender: 'me',
    timestamp: data.timestamp
  });
  
  // Now fetch conversations to update the list
  fetchConversations();
});

// ============================================
// STEP 4: Listen for admin's response
// ============================================
socket.on('chatMessage', (data) => {
  console.log('New message from admin:', data);
  
  // Display admin's message
  displayMessage({
    id: data.id,
    content: data.content,
    sender: 'admin',
    senderName: data.senderName,
    timestamp: data.timestamp
  });
  
  // Mark as read
  socket.emit('markAsRead', {
    conversationId: data.conversationId
  });
});

// ============================================
// COMPLETE EXAMPLE - New Client Chat Component
// ============================================
function NewClientChatComponent() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);

  useEffect(() => {
    // Check if conversations exist
    checkExistingConversations();
    
    // Setup listeners
    socket.on('messageReceived', handleMessageReceived);
    socket.on('chatMessage', handleIncomingMessage);
    
    return () => {
      socket.off('messageReceived');
      socket.off('chatMessage');
    };
  }, []);

  const checkExistingConversations = async () => {
    try {
      const response = await axios.get('/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      
      if (response.data.data.length > 0) {
        // Has conversations
        setConversationId(response.data.data[0].id);
        setIsFirstMessage(false);
        loadMessages(response.data.data[0].id);
      } else {
        // New client - no conversations
        setIsFirstMessage(true);
      }
    } catch (error) {
      console.error('Error checking conversations:', error);
    }
  };

  const loadMessages = async (convId) => {
    try {
      const response = await axios.get(`/api/chat/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      setMessages(response.data.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleMessageReceived = (data) => {
    // Message sent successfully
    setConversationId(data.conversationId);
    setIsFirstMessage(false);
    
    setMessages(prev => [...prev, {
      id: data.id,
      content: data.content,
      sender: 'me',
      timestamp: data.timestamp
    }]);
  };

  const handleIncomingMessage = (data) => {
    // Received message from admin
    setMessages(prev => [...prev, {
      id: data.id,
      content: data.content,
      sender: 'other',
      senderName: data.senderName,
      timestamp: data.timestamp
    }]);
    
    // Mark as read
    socket.emit('markAsRead', { conversationId: data.conversationId });
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const payload = {
      message: message.trim()
    };

    // Only include conversationId if it exists (not first message)
    if (conversationId) {
      payload.conversationId = conversationId;
    }

    socket.emit('chatMessage', payload);
    setMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Chat with Admin</h2>
        {isFirstMessage && <span className="badge">Start Conversation</span>}
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`message ${msg.sender}`}>
              <p>{msg.content}</p>
              <span className="time">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
          ))
        )}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={isFirstMessage ? "Send your first message..." : "Type a message..."}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

---

### Flow 2: Admin Receives New Client Message

This is how the admin side receives and displays messages from new or existing clients.

#### Frontend Implementation (Admin Side)

```javascript
// ============================================
// ADMIN: Complete Chat Setup
// ============================================
function AdminChatComponent() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Load all conversations
    loadConversations();
    
    // Setup Socket listeners
    setupSocketListeners();
    
    return () => {
      cleanupSocketListeners();
    };
  }, []);

  const setupSocketListeners = () => {
    // Listen for NEW messages from ANY client
    socket.on('newMessage', handleNewMessageNotification);
    
    // Listen for messages in current conversation
    socket.on('chatMessage', handleIncomingMessage);
    
    // Listen for message sent confirmation
    socket.on('messageReceived', handleMessageSent);
    
    // Listen for online/offline users
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('onlineUsers', setOnlineUsers);
    
    // Listen for typing indicators
    socket.on('typingStatus', handleTypingStatus);
  };

  const cleanupSocketListeners = () => {
    socket.off('newMessage');
    socket.off('chatMessage');
    socket.off('messageReceived');
    socket.off('userOnline');
    socket.off('userOffline');
    socket.off('onlineUsers');
    socket.off('typingStatus');
  };

  // ============================================
  // STEP 1: Load all conversations (including new ones)
  // ============================================
  const loadConversations = async () => {
    try {
      const response = await axios.get('http://your-api.com/api/chat/conversations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
      });
      
      const convs = response.data.data;
      setConversations(convs);
      
      console.log(`Loaded ${convs.length} conversations`);
      
      // Auto-select first conversation if exists
      if (convs.length > 0 && !selectedConversation) {
        selectConversation(convs[0]);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  // ============================================
  // STEP 2: Handle NEW message notification (Admin only)
  // ============================================
  const handleNewMessageNotification = (data) => {
    console.log('🔔 NEW MESSAGE from client:', data);
    
    // data structure:
    // {
    //   conversationId: 1,
    //   clientId: 5,
    //   clientName: "John Doe",
    //   message: { id, content, timestamp, ... }
    // }
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(`New message from ${data.clientName}`, {
        body: data.message.content,
        icon: '/notification-icon.png'
      });
    }
    
    // Play notification sound
    playNotificationSound();
    
    // Update conversations list to show unread
    loadConversations();
    
    // If this conversation is currently open, display the message
    if (selectedConversation && selectedConversation.id === data.conversationId) {
      setMessages(prev => [...prev, {
        id: data.message.id,
        content: data.message.content,
        sender: 'other',
        senderName: data.clientName,
        timestamp: data.message.timestamp
      }]);
      
      // Mark as read immediately
      socket.emit('markAsRead', { conversationId: data.conversationId });
    }
  };

  // ============================================
  // STEP 3: Select and load conversation messages
  // ============================================
  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    
    // Join conversation room for real-time updates
    socket.emit('joinConversation', {
      conversationId: conversation.id
    });
    
    try {
      // Load message history
      const response = await axios.get(
        `http://your-api.com/api/chat/conversations/${conversation.id}/messages`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` }
        }
      );
      
      setMessages(response.data.data);
      
      // Mark all messages as read
      socket.emit('markAsRead', { conversationId: conversation.id });
      
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // ============================================
  // STEP 4: Handle incoming message in current conversation
  // ============================================
  const handleIncomingMessage = (data) => {
    console.log('📨 Message received:', data);
    
    // Only add if it's for the currently selected conversation
    if (selectedConversation && data.conversationId === selectedConversation.id) {
      setMessages(prev => [...prev, {
        id: data.id,
        content: data.content,
        sender: 'other',
        senderName: data.senderName,
        timestamp: data.timestamp
      }]);
      
      // Auto-mark as read
      socket.emit('markAsRead', { conversationId: data.conversationId });
    }
    
    // Update conversation list to refresh last message
    loadConversations();
  };

  // ============================================
  // STEP 5: Send message to client
  // ============================================
  const sendMessageToClient = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    socket.emit('chatMessage', {
      conversationId: selectedConversation.id, // Admin MUST include this
      message: newMessage.trim()
    });

    setNewMessage('');
  };

  // ============================================
  // STEP 6: Handle message sent confirmation
  // ============================================
  const handleMessageSent = (data) => {
    console.log('✅ Message sent:', data);
    
    setMessages(prev => [...prev, {
      id: data.id,
      content: data.content,
      sender: 'me',
      timestamp: data.timestamp
    }]);
  };

  // ============================================
  // Handle online/offline status
  // ============================================
  const handleUserOnline = (data) => {
    console.log('User came online:', data.email);
    setOnlineUsers(prev => [...prev, data]);
  };

  const handleUserOffline = (data) => {
    console.log('User went offline:', data.email);
    setOnlineUsers(prev => prev.filter(u => u.userId !== data.userId));
  };

  const handleTypingStatus = (data) => {
    if (selectedConversation && data.conversationId === selectedConversation.id) {
      // Show/hide typing indicator
      setIsTyping(data.isTyping);
    }
  };

  // ============================================
  // UI Rendering
  // ============================================
  return (
    <div className="admin-chat-container">
      {/* Sidebar - Conversations List */}
      <div className="conversations-sidebar">
        <h2>Client Conversations</h2>
        <div className="stats">
          <span>Total: {conversations.length}</span>
          <span>Online: {onlineUsers.filter(u => u.role === 'user').length}</span>
        </div>
        
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''} ${conv.unread > 0 ? 'unread' : ''}`}
            onClick={() => selectConversation(conv)}
          >
            <div className="conv-header">
              <h3>{conv.client}</h3>
              {conv.unread > 0 && (
                <span className="unread-badge">{conv.unread}</span>
              )}
              {onlineUsers.some(u => u.email === conv.email) && (
                <span className="online-dot">🟢</span>
              )}
            </div>
            <p className="last-message">{conv.lastMessage}</p>
            <span className="time">{formatTime(conv.time)}</span>
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="empty-state">
            <p>No conversations yet</p>
            <small>Waiting for clients to message</small>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <h2>{selectedConversation.client}</h2>
              <span className="company">{selectedConversation.company}</span>
            </div>

            <div className="messages-area">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender}`}>
                  <div className="message-content">
                    <strong>{msg.senderName || 'You'}</strong>
                    <p>{msg.message || msg.content}</p>
                    <span className="timestamp">
                      {new Date(msg.time || msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessageToClient()}
                placeholder="Type your reply..."
              />
              <button onClick={sendMessageToClient}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Online Users Panel */}
      <div className="online-users-panel">
        <h3>Online Users ({onlineUsers.length})</h3>
        {onlineUsers.map(user => (
          <div key={user.userId} className="online-user">
            <span className="status-dot">🟢</span>
            <span>{user.email}</span>
            <span className="role-badge">{user.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return date.toLocaleTimeString();
  return date.toLocaleDateString();
}

function playNotificationSound() {
  const audio = new Audio('/notification.mp3');
  audio.play().catch(e => console.log('Could not play sound'));
}
```

---

## 📋 Essential Code Snippets

### Initialize Chat System

```javascript
class ChatService {
  constructor(apiUrl, socketUrl, token) {
    this.apiUrl = apiUrl;
    this.token = token;
    
    // Setup axios
    this.api = axios.create({
      baseURL: apiUrl,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Setup socket
    this.socket = io(socketUrl, {
      auth: { token }
    });
    
    this.setupListeners();
  }
  
  setupListeners() {
    this.socket.on('connect', () => console.log('Connected'));
    this.socket.on('chatMessage', (data) => this.onMessage(data));
    this.socket.on('typingStatus', (data) => this.onTyping(data));
    this.socket.on('error', (error) => console.error(error));
  }
  
  // Implement callbacks
  onMessage(data) { /* Your code */ }
  onTyping(data) { /* Your code */ }
}

// Usage
const chat = new ChatService(
  'http://localhost:5000/api',
  'http://localhost:5000',
  localStorage.getItem('jwt_token')
);
```

---

### Get Conversations (REST API)

```javascript
async function getConversations() {
  try {
    const response = await axios.get('http://localhost:5000/api/chat/conversations', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

### Get Messages for a Conversation (REST API)

```javascript
async function getMessages(conversationId) {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/chat/conversations/${conversationId}/messages`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

### Send Message (WebSocket - Real-time)

```javascript
function sendMessage(conversationId, message) {
  socket.emit('chatMessage', {
    conversationId: conversationId,  // Omit for new conversation (clients only)
    message: message
  });
}

// Listen for confirmation
socket.on('messageReceived', (data) => {
  console.log('Message sent successfully:', data);
  // Update UI to show message
});
```

---

### Send Message (REST API - Alternative)

```javascript
async function sendMessageREST(conversationId, message) {
  try {
    const response = await axios.post(
      `http://localhost:5000/api/chat/conversations/${conversationId}/messages`,
      { message },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

---

### Typing Indicator

```javascript
let typingTimer;

function handleUserTyping(conversationId) {
  // Clear previous timer
  clearTimeout(typingTimer);
  
  // Emit typing start
  socket.emit('typing', {
    conversationId: conversationId,
    isTyping: true
  });
  
  // Stop typing after 2 seconds
  typingTimer = setTimeout(() => {
    socket.emit('typing', {
      conversationId: conversationId,
      isTyping: false
    });
  }, 2000);
}

// Listen for typing from others
socket.on('typingStatus', (data) => {
  if (data.isTyping) {
    showTypingIndicator(`${data.userName} is typing...`);
  } else {
    hideTypingIndicator();
  }
});
```

---

### Mark Messages as Read

```javascript
// WebSocket (Real-time)
function markAsRead(conversationId) {
  socket.emit('markAsRead', {
    conversationId: conversationId
  });
}

// Listen for confirmation
socket.on('messagesMarkedRead', (data) => {
  console.log(`${data.count} messages marked as read`);
});

// Listen for when others read your messages
socket.on('messagesRead', (data) => {
  console.log('Your messages were read at:', data.readAt);
  // Update UI to show read receipts
});
```

---

### Online Status Tracking

```javascript
// Request online users list
socket.emit('getOnlineUsers');

// Listen for online users
socket.on('onlineUsers', (users) => {
  console.log('Online users:', users);
  updateOnlineUsersList(users);
});

// Listen for users coming online
socket.on('userOnline', (data) => {
  console.log('User online:', data.email);
  addOnlineUser(data);
});

// Listen for users going offline
socket.on('userOffline', (data) => {
  console.log('User offline:', data.email);
  removeOnlineUser(data);
});
```

---

### Admin: Listen for All New Messages

```javascript
// Admin-only event
socket.on('newMessage', (data) => {
  console.log('New message from:', data.clientName);
  console.log('Message:', data.message);
  
  // Show notification
  showNotification({
    title: `New message from ${data.clientName}`,
    body: data.message.content,
    conversationId: data.conversationId
  });
});
```

---

### Join/Leave Conversation Rooms

```javascript
// Join a conversation (for real-time updates)
function openConversation(conversationId) {
  socket.emit('joinConversation', {
    conversationId: conversationId
  });
}

// Listen for confirmation
socket.on('joinedConversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});

// Leave a conversation
function closeConversation(conversationId) {
  socket.emit('leaveConversation', {
    conversationId: conversationId
  });
}

socket.on('leftConversation', (data) => {
  console.log('Left conversation:', data.conversationId);
});
```

---

### Error Handling

```javascript
// WebSocket errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
  
  switch(error.code) {
    case 'VALIDATION_ERROR':
      alert('Please check your input');
      break;
    case 'NOT_FOUND':
      alert('Conversation not found');
      break;
    case 'FORBIDDEN':
      alert('Access denied');
      break;
    case 'SERVER_ERROR':
      alert('Server error. Please try again.');
      break;
    default:
      alert(error.message);
  }
});

// REST API errors
async function handleAPICall() {
  try {
    const response = await axios.get('...');
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error
      const { code, message } = error.response.data.error;
      console.error(`Error ${code}: ${message}`);
      
      if (error.response.status === 401) {
        // Token expired, redirect to login
        redirectToLogin();
      }
    } else if (error.request) {
      // No response received
      console.error('Network error');
    } else {
      console.error('Error:', error.message);
    }
  }
}
```

---

### Search Messages

```javascript
async function searchMessages(query, conversationId = null) {
  try {
    const params = new URLSearchParams({ query });
    if (conversationId) {
      params.append('conversationId', conversationId);
    }
    
    const response = await axios.get(
      `http://localhost:5000/api/chat/search?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Search error:', error);
  }
}
```

---

### Get Statistics

```javascript
async function getChatStats() {
  try {
    const response = await axios.get(
      'http://localhost:5000/api/chat/stats',
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        }
      }
    );
    
    const stats = response.data.data;
    console.log('Total conversations:', stats.totalConversations);
    console.log('Unread messages:', stats.unreadMessages);
    
    return stats;
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}
```

---

## 🎨 React Hooks Example

### useChat Hook

```javascript
import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

export const useChat = (apiUrl, socketUrl, token) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(socketUrl, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('chatMessage', (data) => {
      setMessages(prev => [...prev, data]);
    });

    newSocket.on('typingStatus', (data) => {
      setIsTyping(data.isTyping);
    });

    newSocket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [socketUrl, token]);

  const sendMessage = (conversationId, message) => {
    if (socket) {
      socket.emit('chatMessage', { conversationId, message });
    }
  };

  const markAsRead = (conversationId) => {
    if (socket) {
      socket.emit('markAsRead', { conversationId });
    }
  };

  const sendTyping = (conversationId, isTyping) => {
    if (socket) {
      socket.emit('typing', { conversationId, isTyping });
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${apiUrl}/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  return {
    socket,
    messages,
    conversations,
    isTyping,
    onlineUsers,
    isConnected,
    sendMessage,
    markAsRead,
    sendTyping,
    fetchConversations
  };
};
```

### Usage in Component

```javascript
import { useChat } from './hooks/useChat';

function ChatComponent() {
  const {
    messages,
    conversations,
    isTyping,
    isConnected,
    sendMessage,
    fetchConversations
  } = useChat(
    'http://localhost:5000/api',
    'http://localhost:5000',
    localStorage.getItem('jwt_token')
  );

  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div>
      <div className="status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      {/* Rest of your UI */}
    </div>
  );
}
```

---

## 🔑 Key Points to Remember

1. **Always authenticate**: Include JWT token in both REST and WebSocket
2. **Handle disconnections**: Socket.io reconnects automatically, but inform users
3. **Typing indicators**: Stop after 2-3 seconds of inactivity
4. **Mark as read**: When user views a conversation
5. **Error handling**: Always handle both API and socket errors
6. **Cleanup**: Remove socket listeners when component unmounts
7. **Real-time first**: Use WebSocket for messaging, REST for loading history
8. **Admin vs User**: Different events/permissions for different roles

---

## 🐛 Common Issues & Solutions

### Issue: Can't connect to WebSocket
**Solution**: Check token validity, CORS settings, and server is running

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  if (error.message.includes('token')) {
    // Token issue - redirect to login
    window.location.href = '/login';
  }
});
```

### Issue: Messages not updating in real-time
**Solution**: Ensure you're listening to the correct event

```javascript
// Correct
socket.on('chatMessage', (data) => { /* ... */ });

// Not 'message' or 'newMessage' (unless you're admin)
```

### Issue: Typing indicator stuck
**Solution**: Always emit false after a timeout

```javascript
clearTimeout(typingTimer);
typingTimer = setTimeout(() => {
  socket.emit('typing', { conversationId, isTyping: false });
}, 2000);
```

---

## 📱 Testing Checklist

- [ ] User can login and get token
- [ ] Socket connects successfully
- [ ] User can see conversations list
- [ ] User can view messages in a conversation
- [ ] User can send messages (both as client and admin)
- [ ] Real-time message delivery works
- [ ] Typing indicators work
- [ ] Read receipts work
- [ ] Online status updates work
- [ ] Error handling works
- [ ] Token expiration handled
- [ ] Disconnection/reconnection works

---

## 🔗 Quick Reference URLs

```
Authentication:
POST   /api/auth/login
POST   /api/auth/signup

Chat REST APIs:
GET    /api/chat/conversations
GET    /api/chat/conversations/:id/messages
POST   /api/chat/conversations/:id/messages
POST   /api/chat/messages
PUT    /api/chat/conversations/:id/read
DELETE /api/chat/conversations/:id
GET    /api/chat/stats
GET    /api/chat/search?query=...

WebSocket Events:
Emit:   chatMessage, markAsRead, typing, joinConversation, leaveConversation, getOnlineUsers
Listen: chatMessage, messageReceived, messagesRead, typingStatus, onlineUsers, userOnline, userOffline, error, newMessage (admin)
```

---

**Happy Coding! 🚀**

Need help? Check the full documentation in `CHAT_API_DOCUMENTATION.md`

---

## 🔄 Complete API Integration Flow Diagrams

### Scenario 1: New Client First Message Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   CLIENT    │         │  FRONTEND   │         │   BACKEND   │         │    ADMIN    │
│  (New User) │         │   (React)   │         │   (Socket)  │         │  Dashboard  │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │                       │
       │ 1. Opens Chat Page    │                       │                       │
       ├──────────────────────►│                       │                       │
       │                       │                       │                       │
       │                       │ 2. GET /conversations │                       │
       │                       ├──────────────────────►│                       │
       │                       │                       │                       │
       │                       │ 3. Returns [] (empty) │                       │
       │                       │◄──────────────────────┤                       │
       │                       │                       │                       │
       │ 4. Shows "New Chat"   │                       │                       │
       │      UI               │                       │                       │
       │◄──────────────────────┤                       │                       │
       │                       │                       │                       │
       │ 5. Types message      │                       │                       │
       │    "Hello, I need     │                       │                       │
       │     help"             │                       │                       │
       ├──────────────────────►│                       │                       │
       │                       │                       │                       │
       │                       │ 6. socket.emit()      │                       │
       │                       │    'chatMessage'      │                       │
       │                       │    {                  │                       │
       │                       │      message: "Hello" │                       │
       │                       │      // NO            │                       │
       │                       │      // conversationId│                       │
       │                       │    }                  │                       │
       │                       ├──────────────────────►│                       │
       │                       │                       │                       │
       │                       │                       │ 7. Creates new        │
       │                       │                       │    Conversation       │
       │                       │                       │    Creates Message    │
       │                       │                       │    in Database        │
       │                       │                       │                       │
       │                       │ 8. messageReceived    │                       │
       │                       │    {                  │                       │
       │                       │      id: 1,           │                       │
       │                       │      conversationId:1,│                       │
       │                       │      content: "Hello" │                       │
       │                       │    }                  │                       │
       │                       │◄──────────────────────┤                       │
       │                       │                       │                       │
       │ 9. Shows message      │                       │                       │
       │    in chat            │                       │                       │
       │◄──────────────────────┤                       │                       │
       │                       │                       │                       │
       │                       │                       │ 10. 'newMessage'      │
       │                       │                       │     event to admin    │
       │                       │                       ├──────────────────────►│
       │                       │                       │                       │
       │                       │                       │                       │ 11. Shows
       │                       │                       │                       │     notification
       │                       │                       │                       │     "New message
       │                       │                       │                       │     from Client"
       │                       │                       │                       │
       │                       │                       │ 12. Admin opens       │
       │                       │                       │     conversation      │
       │                       │                       │◄──────────────────────┤
       │                       │                       │                       │
       │                       │                       │ 13. GET /conversations│
       │                       │                       │     /:id/messages     │
       │                       │                       │◄──────────────────────┤
       │                       │                       │                       │
       │                       │                       │ 14. Returns messages  │
       │                       │                       ├──────────────────────►│
       │                       │                       │                       │
       │                       │                       │                       │ 15. Displays
       │                       │                       │                       │     chat with
       │                       │                       │                       │     client msg
       │                       │                       │                       │
       │                       │                       │ 16. Admin replies     │
       │                       │                       │     "Hi, how can I    │
       │                       │                       │      help?"           │
       │                       │                       │◄──────────────────────┤
       │                       │                       │                       │
       │                       │                       │ socket.emit()         │
       │                       │                       │ 'chatMessage'         │
       │                       │                       │ {                     │
       │                       │                       │   conversationId: 1,  │
       │                       │                       │   message: "Hi..."    │
       │                       │                       │ }                     │
       │                       │                       │                       │
       │                       │ 17. 'chatMessage'     │                       │
       │                       │     from admin        │                       │
       │                       │◄──────────────────────┤                       │
       │                       │                       │                       │
       │ 18. Shows admin reply │                       │                       │
       │◄──────────────────────┤                       │                       │
       │                       │                       │                       │
```

### Scenario 2: Existing Client Sends Message

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   CLIENT    │         │  FRONTEND   │         │   BACKEND   │         │    ADMIN    │
│ (Returning) │         │             │         │             │         │             │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │                       │
       │ 1. Opens Chat         │                       │                       │
       ├──────────────────────►│                       │                       │
       │                       │                       │                       │
       │                       │ 2. GET /conversations │                       │
       │                       ├──────────────────────►│                       │
       │                       │                       │                       │
       │                       │ 3. Returns            │                       │
       │                       │    [{id:1, client:..}]│                       │
       │                       │◄──────────────────────┤                       │
       │                       │                       │                       │
       │ 4. Shows conversation │                       │                       │
       │    list               │                       │                       │
       │◄──────────────────────┤                       │                       │
       │                       │                       │                       │
       │ 5. Selects            │                       │                       │
       │    conversation       │                       │                       │
       ├──────────────────────►│                       │                       │
       │                       │                       │                       │
       │                       │ 6. GET /conversations │                       │
       │                       │    /1/messages        │                       │
       │                       ├──────────────────────►│                       │
       │                       │                       │                       │
       │                       │ 7. Returns message    │                       │
       │                       │    history            │                       │
       │                       │◄──────────────────────┤                       │
       │                       │                       │                       │
       │ 8. Shows chat history │                       │                       │
       │◄──────────────────────┤                       │                       │
       │                       │                       │                       │
       │ 9. Types new message  │                       │                       │
       ├──────────────────────►│                       │                       │
       │                       │                       │                       │
       │                       │ 10. socket.emit()     │                       │
       │                       │     'chatMessage'     │                       │
       │                       │     {                 │                       │
       │                       │       conversationId:1│                       │
       │                       │       message: "..."  │                       │
       │                       │     }                 │                       │
       │                       ├──────────────────────►│                       │
       │                       │                       │                       │
       │                       │ 11. Saves to DB       │                       │
       │                       │                       │                       │
       │                       │ 12. messageReceived   │                       │
       │                       │◄──────────────────────┤                       │
       │                       │                       │                       │
       │ 13. Shows in UI       │                       │ 14. Broadcasts to     │
       │◄──────────────────────┤                       │     admin             │
       │                       │                       ├──────────────────────►│
       │                       │                       │                       │
       │                       │                       │                       │ 15. Admin sees
       │                       │                       │                       │     message
       │                       │                       │                       │
```

---

## 📝 Step-by-Step Implementation Checklist

### For CLIENT Side (React/Vue/Angular)

#### Step 1: Initial Setup
- [ ] Install dependencies: `npm install socket.io-client axios`
- [ ] Create authentication flow (login/signup)
- [ ] Store JWT token in localStorage
- [ ] Store user role in localStorage

#### Step 2: Socket Connection
```javascript
// ✅ Initialize socket when user logs in
const socket = io('http://your-api.com', {
  auth: { token: localStorage.getItem('jwt_token') }
});

// ✅ Handle connection events
socket.on('connect', () => console.log('Connected'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

#### Step 3: Check Existing Conversations
```javascript
// ✅ On chat page load
async function initChat() {
  const response = await axios.get('/api/chat/conversations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const conversations = response.data.data;
  
  if (conversations.length === 0) {
    // NEW CLIENT - Show "Start Conversation" UI
    showNewChatUI();
  } else {
    // EXISTING CLIENT - Show conversation list
    displayConversations(conversations);
  }
}
```

#### Step 4: Send First Message (New Client)
```javascript
// ✅ When new client sends first message
function sendFirstMessage(message) {
  socket.emit('chatMessage', {
    // DO NOT include conversationId for first message
    message: message
  });
}

// ✅ Listen for confirmation
socket.on('messageReceived', (data) => {
  // Save the conversationId for future messages
  setConversationId(data.conversationId);
  displayMessage(data);
});
```

#### Step 5: Send Subsequent Messages (Existing Client)
```javascript
// ✅ For existing conversations
function sendMessage(conversationId, message) {
  socket.emit('chatMessage', {
    conversationId: conversationId, // NOW include it
    message: message
  });
}
```

#### Step 6: Receive Messages
```javascript
// ✅ Listen for incoming messages
socket.on('chatMessage', (data) => {
  displayMessage(data);
  
  // Mark as read
  socket.emit('markAsRead', {
    conversationId: data.conversationId
  });
});
```

#### Step 7: Typing Indicators
```javascript
// ✅ When user types
let typingTimer;
function handleTyping(conversationId) {
  clearTimeout(typingTimer);
  
  socket.emit('typing', { conversationId, isTyping: true });
  
  typingTimer = setTimeout(() => {
    socket.emit('typing', { conversationId, isTyping: false });
  }, 2000);
}

// ✅ Show when admin types
socket.on('typingStatus', (data) => {
  if (data.isTyping) {
    showTypingIndicator();
  } else {
    hideTypingIndicator();
  }
});
```

---

### For ADMIN Side (Dashboard)

#### Step 1: Initial Setup
- [ ] Same as client: Install dependencies and authenticate
- [ ] Verify user has 'admin' role
- [ ] Initialize socket connection

#### Step 2: Load All Conversations
```javascript
// ✅ On dashboard load
async function loadAllConversations() {
  const response = await axios.get('/api/chat/conversations', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  // Admin sees ALL client conversations
  setConversations(response.data.data);
}
```

#### Step 3: Listen for New Messages from Any Client
```javascript
// ✅ IMPORTANT: Admin-only event
socket.on('newMessage', (data) => {
  console.log('New message from:', data.clientName);
  
  // Show notification
  showNotification({
    title: `Message from ${data.clientName}`,
    body: data.message.content
  });
  
  // Update conversations list
  loadAllConversations();
  
  // If conversation is open, show message immediately
  if (currentConversationId === data.conversationId) {
    appendMessage(data.message);
  }
});
```

#### Step 4: Select and View Conversation
```javascript
// ✅ When admin clicks on a conversation
async function selectConversation(conversationId) {
  // Join room
  socket.emit('joinConversation', { conversationId });
  
  // Load messages
  const response = await axios.get(
    `/api/chat/conversations/${conversationId}/messages`,
    { headers: { 'Authorization': `Bearer ${adminToken}` } }
  );
  
  setMessages(response.data.data);
  
  // Mark as read
  socket.emit('markAsRead', { conversationId });
}
```

#### Step 5: Reply to Client
```javascript
// ✅ Admin sends reply
function replyToClient(conversationId, message) {
  socket.emit('chatMessage', {
    conversationId: conversationId, // REQUIRED for admin
    message: message
  });
}

// ✅ Confirmation
socket.on('messageReceived', (data) => {
  appendMessageToUI(data);
});
```

#### Step 6: Monitor Online Users
```javascript
// ✅ Track online clients
socket.on('userOnline', (data) => {
  addToOnlineList(data);
});

socket.on('userOffline', (data) => {
  removeFromOnlineList(data);
});

socket.on('onlineUsers', (users) => {
  setOnlineUsers(users);
});
```

---

## 🎯 API Endpoints Quick Reference

### Authentication
| Method | Endpoint | Body | Returns | Use Case |
|--------|----------|------|---------|----------|
| POST | `/api/auth/login` | `{email, password}` | `{token, user}` | Login |
| POST | `/api/auth/signup` | `{email, password}` | `{user}` | Register |

### Conversations
| Method | Endpoint | Body | Returns | Use Case |
|--------|----------|------|---------|----------|
| GET | `/api/chat/conversations` | - | Array of conversations | List all conversations |
| GET | `/api/chat/conversations/:id/messages` | - | Array of messages | Get chat history |
| POST | `/api/chat/messages` | `{message}` | Message object | New client first message |
| POST | `/api/chat/conversations/:id/messages` | `{message}` | Message object | Send to existing conversation |
| PUT | `/api/chat/conversations/:id/read` | - | Success | Mark as read |
| DELETE | `/api/chat/conversations/:id` | - | Success | Delete (admin only) |

### Statistics & Search
| Method | Endpoint | Query Params | Returns | Use Case |
|--------|----------|--------------|---------|----------|
| GET | `/api/chat/stats` | - | Statistics object | Get chat statistics |
| GET | `/api/chat/search` | `?query=text&conversationId=1` | Array of messages | Search messages |

---

## 🔌 WebSocket Events Quick Reference

### Client Events (Emit)
| Event | Payload | When to Use |
|-------|---------|-------------|
| `chatMessage` | `{message}` (no conversationId) | **NEW CLIENT**: First message |
| `chatMessage` | `{conversationId, message}` | **EXISTING**: Send message |
| `markAsRead` | `{conversationId}` | Mark messages as read |
| `typing` | `{conversationId, isTyping}` | Show/hide typing indicator |
| `joinConversation` | `{conversationId}` | Join conversation room |
| `leaveConversation` | `{conversationId}` | Leave conversation room |
| `getOnlineUsers` | - | Request online users list |

### Client Events (Listen)
| Event | Payload | What It Means |
|-------|---------|---------------|
| `messageReceived` | Message object | Your message was sent successfully |
| `chatMessage` | Message object | New message from other party |
| `messagesRead` | `{conversationId, readBy, readAt}` | Someone read your messages |
| `typingStatus` | `{conversationId, isTyping}` | Other party is typing |
| `onlineUsers` | Array of users | List of online users |
| `error` | Error object | Something went wrong |

### Admin-Only Events (Listen)
| Event | Payload | What It Means |
|-------|---------|---------------|
| `newMessage` | `{conversationId, clientId, clientName, message}` | **NEW MESSAGE** from any client |
| `userOnline` | `{userId, email, role}` | User came online |
| `userOffline` | `{userId, email, role}` | User went offline |

---

## 💡 Common Scenarios & Solutions

### Scenario: "How do I know if it's a new client?"
**Solution**: Check if conversations array is empty:
```javascript
const conversations = await getConversations();
if (conversations.length === 0) {
  // NEW CLIENT - Don't send conversationId
  socket.emit('chatMessage', { message: 'Hello' });
} else {
  // EXISTING CLIENT - Send with conversationId
  socket.emit('chatMessage', { conversationId: 1, message: 'Hello' });
}
```

### Scenario: "Admin not receiving new message notifications"
**Solution**: Make sure admin is listening to `newMessage` event:
```javascript
// Admin MUST listen to this
socket.on('newMessage', (data) => {
  console.log('New message from:', data.clientName);
  showNotification(data);
});
```

### Scenario: "Messages not appearing in real-time"
**Solution**: Ensure you're listening to `chatMessage` event:
```javascript
socket.on('chatMessage', (data) => {
  appendMessageToUI(data);
});
```

### Scenario: "How to handle multiple conversations?"
**Solution**: Store conversationId and switch between them:
```javascript
const [currentConversationId, setCurrentConversationId] = useState(null);

function switchConversation(convId) {
  // Leave previous room
  if (currentConversationId) {
    socket.emit('leaveConversation', { conversationId: currentConversationId });
  }
  
  // Join new room
  socket.emit('joinConversation', { conversationId: convId });
  setCurrentConversationId(convId);
  
  // Load messages
  loadMessages(convId);
}
```

---

**Happy Coding! 🚀**

Need help? Check the full documentation in `CHAT_API_DOCUMENTATION.md`

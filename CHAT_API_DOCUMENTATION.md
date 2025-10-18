# Chat System API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Roles](#user-roles)
4. [REST API Endpoints](#rest-api-endpoints)
5. [WebSocket Events](#websocket-events)
6. [Error Handling](#error-handling)
7. [Frontend Integration Examples](#frontend-integration-examples)

---

## Overview

This chat system provides real-time communication between **Clients (Users)** and **Admins** using both REST APIs and WebSocket connections. The system supports:

- Real-time messaging
- Online/offline status tracking
- Typing indicators
- Message read receipts
- Conversation management
- Message search
- Conversation statistics

**Base API URL**: `http://your-domain.com/api`  
**WebSocket URL**: `ws://your-domain.com` or `wss://your-domain.com`

---

## Authentication

All API endpoints and WebSocket connections require JWT authentication.

### Login
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe"
  },
  "role": "user"
}
```

### Register
**Endpoint**: `POST /api/auth/signup`

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "message": "User created",
  "user": {
    "id": 2,
    "email": "newuser@example.com",
    "role": "user"
  }
}
```

### Using the Token
Include the JWT token in the Authorization header for all authenticated requests:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

For WebSocket connections, pass the token during connection:
```javascript
const socket = io('http://your-domain.com', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

---

## User Roles

The system has two roles:

1. **`user`** (Client Role)
   - Can create conversations with admins
   - Can send/receive messages
   - Can view their own conversations
   - Limited to their own conversation access

2. **`admin`** (Admin Role)
   - Can view all client conversations
   - Can respond to any conversation
   - Can delete conversations
   - Has access to system-wide statistics
   - Receives notifications for all new messages

---

## REST API Endpoints

### 1. Get All Conversations

**Endpoint**: `GET /api/chat/conversations`  
**Auth Required**: Yes  
**Role**: Both (user/admin)

**Description**: 
- **Admin**: Gets all conversations with clients
- **User**: Gets their conversation(s) with admin

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client": "John Doe",
      "company": "Acme Corp",
      "lastMessage": "Hello, I need help with my project",
      "time": "2025-10-18T10:30:00.000Z",
      "unread": 3,
      "online": false
    }
  ]
}
```

---

### 2. Get Conversation Messages

**Endpoint**: `GET /api/chat/conversations/:conversationId/messages`  
**Auth Required**: Yes  
**Role**: Both (user/admin)

**Parameters**:
- `conversationId` (path) - The ID of the conversation

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender": "me",
      "senderName": "John Doe",
      "message": "Hello, I need help",
      "time": "2025-10-18T10:30:00.000Z",
      "senderType": "client"
    },
    {
      "id": 2,
      "sender": "other",
      "senderName": "Admin",
      "message": "Sure, how can I help you?",
      "time": "2025-10-18T10:31:00.000Z",
      "senderType": "agency"
    }
  ]
}
```

---

### 3. Send Message

**Endpoint**: `POST /api/chat/conversations/:conversationId/messages`  
**OR**: `POST /api/chat/messages` (for new conversations)  
**Auth Required**: Yes  
**Role**: Both (user/admin)

**Request Body**:
```json
{
  "message": "Hello, I have a question about my project"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "conversationId": 1,
    "sender": "me",
    "message": "Hello, I have a question about my project",
    "time": "2025-10-18T10:32:00.000Z",
    "senderType": "client"
  }
}
```

**Note**: 
- Clients can omit `conversationId` to start a new conversation
- Admins must specify `conversationId`

---

### 4. Mark Messages as Read

**Endpoint**: `PUT /api/chat/conversations/:conversationId/read`  
**Auth Required**: Yes  
**Role**: Both (user/admin)

**Parameters**:
- `conversationId` (path) - The ID of the conversation

**Response**:
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

### 5. Get Conversation Statistics

**Endpoint**: `GET /api/chat/stats`  
**Auth Required**: Yes  
**Role**: Both (user/admin)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalConversations": 15,
    "activeConversations": 12,
    "unreadMessages": 7,
    "totalMessages": 245
  }
}
```

---

### 6. Search Messages

**Endpoint**: `GET /api/chat/search`  
**Auth Required**: Yes  
**Role**: Both (user/admin)

**Query Parameters**:
- `query` (required) - Search term (min 2 characters)
- `conversationId` (optional) - Limit search to specific conversation

**Example**: `GET /api/chat/search?query=project&conversationId=1`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "conversationId": 1,
      "content": "I need help with my project timeline",
      "senderType": "client",
      "senderName": "John Doe",
      "timestamp": "2025-10-18T10:32:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 7. Delete Conversation

**Endpoint**: `DELETE /api/chat/conversations/:conversationId`  
**Auth Required**: Yes  
**Role**: Admin only

**Parameters**:
- `conversationId` (path) - The ID of the conversation

**Response**:
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

## WebSocket Events

### Connection

Connect to the WebSocket server with JWT authentication:

```javascript
import io from 'socket.io-client';

const socket = io('http://your-domain.com', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});
```

### Connection Events

#### 1. `connect`
Emitted when successfully connected to the server.

```javascript
socket.on('connect', () => {
  console.log('Connected to chat server');
});
```

#### 2. `disconnect`
Emitted when disconnected from the server.

```javascript
socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});
```

#### 3. `connect_error`
Emitted when connection fails (e.g., invalid token).

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});
```

---

### Messaging Events

#### 1. Send Message: `chatMessage`

**Emit** to send a message:

```javascript
socket.emit('chatMessage', {
  conversationId: 1,  // Optional for clients starting new conversation
  message: 'Hello, I need assistance'
});
```

#### 2. Receive Message: `chatMessage`

**Listen** for incoming messages:

```javascript
socket.on('chatMessage', (data) => {
  console.log('New message:', data);
  // data structure:
  // {
  //   id: 123,
  //   conversationId: 1,
  //   senderId: 2,
  //   senderName: "John Doe",
  //   senderType: "client",
  //   content: "Hello, I need assistance",
  //   timestamp: "2025-10-18T10:32:00.000Z",
  //   isRead: false
  // }
});
```

#### 3. Message Received Confirmation: `messageReceived`

**Listen** for confirmation that your message was sent:

```javascript
socket.on('messageReceived', (data) => {
  console.log('Message sent successfully:', data);
  // Same structure as chatMessage
});
```

---

### Read Receipt Events

#### 1. Mark Messages as Read: `markAsRead`

**Emit** to mark messages as read:

```javascript
socket.emit('markAsRead', {
  conversationId: 1
});
```

#### 2. Messages Marked Read Confirmation: `messagesMarkedRead`

**Listen** for confirmation:

```javascript
socket.on('messagesMarkedRead', (data) => {
  console.log('Messages marked as read:', data);
  // {
  //   conversationId: 1,
  //   count: 3
  // }
});
```

#### 3. Messages Read by Other Party: `messagesRead`

**Listen** when the other party reads your messages:

```javascript
socket.on('messagesRead', (data) => {
  console.log('Your messages were read:', data);
  // {
  //   conversationId: 1,
  //   readBy: 2,
  //   readAt: "2025-10-18T10:35:00.000Z",
  //   count: 3
  // }
});
```

---

### Typing Indicator Events

#### 1. Send Typing Status: `typing`

**Emit** typing status:

```javascript
// When user starts typing
socket.emit('typing', {
  conversationId: 1,
  isTyping: true
});

// When user stops typing
socket.emit('typing', {
  conversationId: 1,
  isTyping: false
});
```

#### 2. Receive Typing Status: `typingStatus`

**Listen** for typing indicators:

```javascript
socket.on('typingStatus', (data) => {
  console.log('Typing status:', data);
  // {
  //   conversationId: 1,
  //   userId: 2,
  //   userName: "user@example.com",
  //   isTyping: true
  // }
});
```

---

### Online Status Events

#### 1. Request Online Users: `getOnlineUsers`

**Emit** to request list of online users:

```javascript
socket.emit('getOnlineUsers');
```

#### 2. Receive Online Users List: `onlineUsers`

**Listen** for online users (automatically sent on connection):

```javascript
socket.on('onlineUsers', (users) => {
  console.log('Online users:', users);
  // [
  //   {
  //     userId: 1,
  //     email: "admin@example.com",
  //     role: "admin",
  //     lastSeen: "2025-10-18T10:30:00.000Z"
  //   }
  // ]
});
```

#### 3. User Came Online: `userOnline`

**Listen** for users coming online (admins receive this for all users):

```javascript
socket.on('userOnline', (data) => {
  console.log('User came online:', data);
  // {
  //   userId: 2,
  //   email: "user@example.com",
  //   role: "user",
  //   timestamp: "2025-10-18T10:32:00.000Z"
  // }
});
```

#### 4. User Went Offline: `userOffline`

**Listen** for users going offline (admins receive this for all users):

```javascript
socket.on('userOffline', (data) => {
  console.log('User went offline:', data);
  // {
  //   userId: 2,
  //   email: "user@example.com",
  //   role: "user",
  //   timestamp: "2025-10-18T10:45:00.000Z"
  // }
});
```

---

### Conversation Management Events

#### 1. Join Conversation: `joinConversation`

**Emit** to join a conversation room for real-time updates:

```javascript
socket.emit('joinConversation', {
  conversationId: 1
});
```

#### 2. Joined Conversation Confirmation: `joinedConversation`

**Listen** for confirmation:

```javascript
socket.on('joinedConversation', (data) => {
  console.log('Joined conversation:', data.conversationId);
});
```

#### 3. Leave Conversation: `leaveConversation`

**Emit** to leave a conversation room:

```javascript
socket.emit('leaveConversation', {
  conversationId: 1
});
```

#### 4. Left Conversation Confirmation: `leftConversation`

**Listen** for confirmation:

```javascript
socket.on('leftConversation', (data) => {
  console.log('Left conversation:', data.conversationId);
});
```

---

### Admin-Specific Events

#### New Message Notification: `newMessage`

**Listen** for new messages from any client (admin only):

```javascript
socket.on('newMessage', (data) => {
  console.log('New message from client:', data);
  // {
  //   conversationId: 1,
  //   clientId: 5,
  //   clientName: "John Doe",
  //   message: {
  //     id: 123,
  //     content: "Hello",
  //     timestamp: "2025-10-18T10:32:00.000Z",
  //     ...
  //   }
  // }
});
```

---

### Error Events

#### Error: `error`

**Listen** for errors:

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // {
  //   code: "VALIDATION_ERROR",
  //   message: "Message cannot be empty",
  //   details: "Additional error details"
  // }
});
```

**Error Codes**:
- `VALIDATION_ERROR` - Invalid input data
- `NOT_FOUND` - Resource not found
- `FORBIDDEN` - Access denied
- `SERVER_ERROR` - Internal server error
- `AUTHENTICATION_ERROR` - Auth token invalid

---

## Error Handling

### REST API Errors

All REST API errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Frontend Integration Examples

### Complete Chat Component Example (React)

```javascript
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const ChatComponent = () => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  const API_BASE = 'http://localhost:5000/api';
  const SOCKET_URL = 'http://localhost:5000';
  const token = localStorage.getItem('jwt_token');

  // Setup axios default headers
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
    });

    // Listen for incoming messages
    newSocket.on('chatMessage', (data) => {
      console.log('📨 New message:', data);
      if (currentConversation && data.conversationId === currentConversation.id) {
        setMessages(prev => [...prev, data]);
        // Mark as read if conversation is active
        newSocket.emit('markAsRead', { conversationId: data.conversationId });
      }
      // Update conversation list
      fetchConversations();
    });

    // Listen for message sent confirmation
    newSocket.on('messageReceived', (data) => {
      console.log('✅ Message sent:', data);
      setMessages(prev => [...prev, data]);
    });

    // Listen for typing indicators
    newSocket.on('typingStatus', (data) => {
      if (currentConversation && data.conversationId === currentConversation.id) {
        setIsTyping(data.isTyping);
      }
    });

    // Listen for read receipts
    newSocket.on('messagesRead', (data) => {
      console.log('👁️ Messages read:', data);
      if (currentConversation && data.conversationId === currentConversation.id) {
        setMessages(prev => 
          prev.map(msg => ({
            ...msg,
            isRead: true
          }))
        );
      }
    });

    // Listen for online users
    newSocket.on('onlineUsers', (users) => {
      console.log('👥 Online users:', users);
      setOnlineUsers(users);
    });

    // Admin: listen for new message notifications
    newSocket.on('newMessage', (data) => {
      console.log('🔔 New message notification:', data);
      // Show notification or update UI
    });

    // Handle errors
    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      alert(error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, currentConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE}/chat/conversations`);
      setConversations(response.data.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(
        `${API_BASE}/chat/conversations/${conversationId}/messages`
      );
      setMessages(response.data.data);
      
      // Mark messages as read
      if (socket) {
        socket.emit('markAsRead', { conversationId });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Select conversation
  const selectConversation = (conversation) => {
    setCurrentConversation(conversation);
    fetchMessages(conversation.id);
    
    // Join conversation room
    if (socket) {
      socket.emit('joinConversation', { conversationId: conversation.id });
    }
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit('chatMessage', {
      conversationId: currentConversation?.id,
      message: newMessage
    });

    setNewMessage('');
    
    // Stop typing indicator
    if (currentConversation) {
      socket.emit('typing', {
        conversationId: currentConversation.id,
        isTyping: false
      });
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !currentConversation) return;

    // Send typing indicator
    socket.emit('typing', {
      conversationId: currentConversation.id,
      isTyping: true
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        conversationId: currentConversation.id,
        isTyping: false
      });
    }, 2000);
  };

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  return (
    <div className="chat-container">
      {/* Conversation List */}
      <div className="conversation-list">
        <h2>Conversations</h2>
        {conversations.map(conv => (
          <div 
            key={conv.id}
            className={`conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}`}
            onClick={() => selectConversation(conv)}
          >
            <h3>{conv.client || conv.agency}</h3>
            <p>{conv.lastMessage}</p>
            {conv.unread > 0 && <span className="unread-badge">{conv.unread}</span>}
          </div>
        ))}
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {currentConversation ? (
          <>
            <div className="messages-header">
              <h2>{currentConversation.client || currentConversation.agency}</h2>
            </div>
            
            <div className="messages-list">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}
                >
                  <p>{msg.message || msg.content}</p>
                  <span className="timestamp">{new Date(msg.time || msg.timestamp).toLocaleTimeString()}</span>
                  {msg.sender === 'me' && msg.isRead && <span className="read-indicator">✓✓</span>}
                </div>
              ))}
              {isTyping && <div className="typing-indicator">Typing...</div>}
            </div>

            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-conversation">Select a conversation to start chatting</div>
        )}
      </div>

      {/* Online Users (Admin view) */}
      <div className="online-users">
        <h3>Online Users ({onlineUsers.length})</h3>
        {onlineUsers.map(user => (
          <div key={user.userId} className="online-user">
            <span className="status-dot"></span>
            {user.email}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatComponent;
```

### Vanilla JavaScript Example

```javascript
// Initialize socket
const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
});

// Send a message
function sendMessage(conversationId, message) {
  socket.emit('chatMessage', {
    conversationId: conversationId,
    message: message
  });
}

// Listen for messages
socket.on('chatMessage', (data) => {
  console.log('New message:', data);
  displayMessage(data);
});

// Mark as read
function markAsRead(conversationId) {
  socket.emit('markAsRead', {
    conversationId: conversationId
  });
}

// Typing indicator
let typingTimeout;
function handleTyping(conversationId, isTyping) {
  clearTimeout(typingTimeout);
  
  socket.emit('typing', {
    conversationId: conversationId,
    isTyping: true
  });

  typingTimeout = setTimeout(() => {
    socket.emit('typing', {
      conversationId: conversationId,
      isTyping: false
    });
  }, 2000);
}

// Listen for typing
socket.on('typingStatus', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator();
  }
});
```

---

## Best Practices

1. **Always handle connection errors**: Display user-friendly messages when connection fails
2. **Implement reconnection logic**: Socket.io handles this automatically, but inform users
3. **Use typing timeouts**: Stop typing indicator after 2-3 seconds of inactivity
4. **Mark messages as read**: When user opens a conversation
5. **Handle token expiration**: Refresh tokens before they expire
6. **Optimize message loading**: Use pagination for conversations with many messages
7. **Test with different roles**: Ensure proper access control
8. **Clean up listeners**: Remove event listeners when components unmount
9. **Handle offline state**: Queue messages when offline and send when reconnected
10. **Secure your tokens**: Never expose JWT tokens in URLs or logs

---

## Testing

### Test with cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get conversations
curl -X GET http://localhost:5000/api/chat/conversations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send message
curl -X POST http://localhost:5000/api/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello from API"}'
```

---

## Support

For issues or questions:
- Check error codes and messages
- Review authentication setup
- Verify JWT token validity
- Check CORS settings if running on different domains
- Ensure database models are synced

---

**Version**: 1.0.0  
**Last Updated**: October 18, 2025

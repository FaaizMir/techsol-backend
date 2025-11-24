# Chat System Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React/Vue  │  │  Socket.io   │  │     Axios    │      │
│  │  Components  │  │    Client    │  │  REST Client │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │                  │                  │
┌─────────┼──────────────────┼──────────────────┼─────────────┐
│         │                  │                  │              │
│         │     WebSocket    │      HTTP/HTTPS  │              │
│         │     Connection   │      Requests    │              │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐     │
│  │            BACKEND SERVER (Node.js)                 │     │
│  │  ┌──────────────────────────────────────────────┐  │     │
│  │  │          Express.js Application              │  │     │
│  │  │  ┌────────────┐  ┌────────────────────────┐ │  │     │
│  │  │  │   Routes   │  │   Socket.io Server     │ │  │     │
│  │  │  │ /api/chat  │  │   - Authentication     │ │  │     │
│  │  │  │ /api/auth  │  │   - Event Handlers     │ │  │     │
│  │  │  └─────┬──────┘  │   - Room Management    │ │  │     │
│  │  │        │         └────────────┬───────────┘ │  │     │
│  │  │        │                      │              │  │     │
│  │  │  ┌─────▼──────────────────────▼───────────┐ │  │     │
│  │  │  │         Controllers                     │ │  │     │
│  │  │  │  - chatController.js                    │ │  │     │
│  │  │  │  - authController.js                    │ │  │     │
│  │  │  └─────┬───────────────────────────────────┘ │  │     │
│  │  │        │                                      │  │     │
│  │  │  ┌─────▼───────────────────────────────────┐ │  │     │
│  │  │  │         Middleware                       │ │  │     │
│  │  │  │  - authMiddleware.js (JWT Verification) │ │  │     │
│  │  │  │  - errorHandler.js                      │ │  │     │
│  │  │  └─────┬───────────────────────────────────┘ │  │     │
│  │  │        │                                      │  │     │
│  │  │  ┌─────▼───────────────────────────────────┐ │  │     │
│  │  │  │         Models (Sequelize ORM)          │ │  │     │
│  │  │  │  - User.js                              │ │  │     │
│  │  │  │  - Client.js                            │ │  │     │
│  │  │  │  - Conversation.js                      │ │  │     │
│  │  │  │  - Message.js                           │ │  │     │
│  │  │  └─────┬───────────────────────────────────┘ │  │     │
│  │  └────────┼─────────────────────────────────────┘  │     │
│  └───────────┼────────────────────────────────────────┘     │
│              │                                               │
└──────────────┼───────────────────────────────────────────────┘
               │
               │
┌──────────────▼────────────────────────────────────────────┐
│                    DATABASE (MySQL)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Users     │  │   Clients    │  │Conversations │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Messages   │  │   Projects   │  │  Documents   │     │
│  └─────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  company VARCHAR(255),
  phone VARCHAR(255),
  profilePicture VARCHAR(255),
  isOnboardingCompleted BOOLEAN DEFAULT FALSE,
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Clients Table
```sql
CREATE TABLE Clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(255),
  contactPerson VARCHAR(100),
  status ENUM('active', 'inactive') DEFAULT 'active',
  createdAt DATETIME,
  updatedAt DATETIME
);
```

### Conversations Table
```sql
CREATE TABLE Conversations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clientId INT NOT NULL,
  agencyId INT NOT NULL,
  lastMessage TEXT,
  lastMessageTime DATETIME,
  unreadCount INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (clientId) REFERENCES Clients(id),
  FOREIGN KEY (agencyId) REFERENCES Users(id),
  UNIQUE KEY unique_conversation (clientId, agencyId)
);
```

### Messages Table
```sql
CREATE TABLE Messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversationId INT NOT NULL,
  senderId INT NOT NULL,
  receiverId INT NOT NULL,
  senderType ENUM('client', 'agency') NOT NULL,
  content TEXT NOT NULL,
  isRead BOOLEAN DEFAULT FALSE,
  readAt DATETIME,
  createdAt DATETIME,
  updatedAt DATETIME,
  FOREIGN KEY (conversationId) REFERENCES Conversations(id),
  FOREIGN KEY (senderId) REFERENCES Users(id),
  FOREIGN KEY (receiverId) REFERENCES Users(id)
);
```

---

## Data Flow

### 1. User Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐
│ Client  │────────▶│  API    │────────▶│ Database │
│         │ POST    │ /auth/  │ Query   │          │
│         │ login   │ login   │ User    │          │
└────┬────┘         └────┬────┘         └──────────┘
     │                   │
     │◀──────────────────┤
     │  JWT Token +      │
     │  User Data        │
     │                   │
     └───────────────────┘
```

### 2. Message Sending Flow (WebSocket)

```
┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
│ Sender   │        │ Socket   │        │ Database │        │ Receiver │
│ Client   │        │ Server   │        │          │        │ Client   │
└────┬─────┘        └────┬─────┘        └────┬─────┘        └────┬─────┘
     │                   │                   │                   │
     │ chatMessage       │                   │                   │
     ├──────────────────▶│                   │                   │
     │ {conversationId,  │                   │                   │
     │  message}         │                   │                   │
     │                   │                   │                   │
     │                   │ Save Message      │                   │
     │                   ├──────────────────▶│                   │
     │                   │                   │                   │
     │                   │◀──────────────────┤                   │
     │                   │ Message Saved     │                   │
     │                   │                   │                   │
     │ messageReceived   │                   │                   │
     │◀──────────────────┤                   │                   │
     │ (confirmation)    │                   │                   │
     │                   │                   │                   │
     │                   │ chatMessage       │                   │
     │                   ├───────────────────────────────────────▶│
     │                   │ (broadcast)       │                   │
     │                   │                   │                   │
```

### 3. Typing Indicator Flow

```
┌──────────┐        ┌──────────┐        ┌──────────┐
│ User A   │        │ Socket   │        │ User B   │
│          │        │ Server   │        │          │
└────┬─────┘        └────┬─────┘        └────┬─────┘
     │                   │                   │
     │ typing: true      │                   │
     ├──────────────────▶│                   │
     │                   │                   │
     │                   │ typingStatus      │
     │                   ├──────────────────▶│
     │                   │ {isTyping: true}  │
     │                   │                   │
     │  (2s timeout)     │                   │
     │                   │                   │
     │ typing: false     │                   │
     ├──────────────────▶│                   │
     │                   │                   │
     │                   │ typingStatus      │
     │                   ├──────────────────▶│
     │                   │ {isTyping: false} │
     │                   │                   │
```

### 4. Read Receipt Flow

```
┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
│ Reader   │        │ Socket   │        │ Database │        │ Sender   │
│          │        │ Server   │        │          │        │          │
└────┬─────┘        └────┬─────┘        └────┬─────┘        └────┬─────┘
     │                   │                   │                   │
     │ markAsRead        │                   │                   │
     ├──────────────────▶│                   │                   │
     │                   │                   │                   │
     │                   │ UPDATE Messages   │                   │
     │                   ├──────────────────▶│                   │
     │                   │ SET isRead=true   │                   │
     │                   │                   │                   │
     │                   │◀──────────────────┤                   │
     │                   │                   │                   │
     │ messagesMarkedRead│                   │                   │
     │◀──────────────────┤                   │                   │
     │                   │                   │                   │
     │                   │ messagesRead      │                   │
     │                   ├───────────────────────────────────────▶│
     │                   │ (notification)    │                   │
     │                   │                   │                   │
```

---

## WebSocket Room Structure

### Room Types

1. **User-specific rooms**: `user_{userId}`
   - Each user joins their own room
   - Used for direct messages to specific users

2. **Role-based rooms**: `admin` or `user`
   - All admins in `admin` room
   - All regular users in `user` room
   - Used for broadcasting to entire role

3. **Conversation rooms**: `conversation_{conversationId}`
   - Users join when viewing specific conversation
   - Used for real-time updates within conversation

### Room Membership Example

```
User A (Admin, ID: 1):
  - user_1
  - admin
  - conversation_1 (when viewing)
  - conversation_3 (when viewing)

User B (Client, ID: 5):
  - user_5
  - user
  - conversation_1 (when viewing)
```

---

## Authentication & Authorization

### JWT Token Structure

```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "user",
  "iat": 1634567890,
  "exp": 1634571490
}
```

### Authorization Rules

| Action | Client (User) | Admin |
|--------|---------------|-------|
| View all conversations | ❌ (Only their own) | ✅ |
| Create conversation | ✅ | ❌ (Must specify existing) |
| Send message | ✅ | ✅ |
| Delete conversation | ❌ | ✅ |
| View online users | ✅ (Limited) | ✅ (All) |
| Receive new message notifications | ❌ | ✅ |

### Access Control Flow

```
Request ──▶ authMiddleware ──▶ Verify JWT ──▶ Extract user info
                                    │
                                    ├─ Valid ──▶ req.user = decoded
                                    │            ├─ Continue to controller
                                    │            └─ Check role-specific permissions
                                    │
                                    └─ Invalid ──▶ 401 Unauthorized
```

---

## Error Handling Strategy

### Error Types

1. **Validation Errors** (400)
   - Missing required fields
   - Invalid data format
   - Empty messages

2. **Authentication Errors** (401)
   - Missing token
   - Invalid token
   - Expired token

3. **Authorization Errors** (403)
   - Insufficient permissions
   - Role restrictions
   - Access to unauthorized resources

4. **Not Found Errors** (404)
   - Conversation doesn't exist
   - User doesn't exist
   - Resource not found

5. **Server Errors** (500)
   - Database errors
   - Unexpected exceptions

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional context (dev mode only)"
  }
}
```

---

## Performance Considerations

### Optimizations Implemented

1. **Indexed Queries**
   - Unique index on `(clientId, agencyId)` in Conversations
   - Indexes on foreign keys

2. **Efficient Message Loading**
   - Paginated message retrieval (can be added)
   - Only load necessary fields with Sequelize attributes

3. **Socket Connection Management**
   - Automatic reconnection
   - Ping/pong for connection health
   - Connection timeout settings

4. **Typing Indicator Cleanup**
   - Automatic cleanup every 10 seconds
   - Prevents memory leaks from stale typing states

### Scalability Considerations

For production scaling:

1. **Redis for Socket.io**
   ```javascript
   const { createAdapter } = require("@socket.io/redis-adapter");
   io.adapter(createAdapter(pubClient, subClient));
   ```

2. **Message Queue**
   - Use RabbitMQ or Bull for message processing
   - Async message delivery

3. **Database Optimization**
   - Read replicas for queries
   - Connection pooling
   - Query caching

4. **CDN for Static Assets**
   - Profile pictures
   - File attachments

---

## Security Features

### Implemented Security

1. **JWT Authentication**
   - Secure token generation
   - Token expiration (1 hour)
   - Token verification on all requests

2. **Password Security**
   - Bcrypt hashing (10 rounds)
   - No plain text storage

3. **Access Control**
   - Role-based permissions
   - Conversation ownership verification
   - Resource authorization checks

4. **Input Validation**
   - Message content sanitization
   - Email validation
   - SQL injection prevention (Sequelize ORM)

5. **CORS Configuration**
   - Configured for specific origins in production
   - Credentials support

### Security Best Practices

```javascript
// Token refresh strategy (implement client-side)
async function refreshToken() {
  if (isTokenExpiringSoon()) {
    const newToken = await api.post('/auth/refresh');
    localStorage.setItem('jwt_token', newToken);
  }
}

// Secure token storage
// ❌ Don't: localStorage (vulnerable to XSS)
// ✅ Do: httpOnly cookies (for web)
// ✅ Do: Secure storage (for mobile)
```

---

## Monitoring & Logging

### Logged Events

```javascript
// Connection events
console.log("✅ User connected:", email, role);
console.log("❌ User disconnected:", email);

// Error events
console.error("❌ Error handling chat message:", error);
console.error("❌ Error marking messages as read:", error);

// Socket events
console.log("📨 New message:", data);
console.log("👁️ Messages read:", data);
console.log("✍️ User typing:", data);
```

### Metrics to Track (Future Enhancement)

- Active connections
- Messages per second
- Average response time
- Error rates
- User activity patterns

---

## Deployment Architecture

### Development Setup

```
localhost:5000
├── REST API (:5000/api)
├── WebSocket (:5000)
└── Database (localhost:3306)
```

### Production Setup

```
┌──────────────────┐
│   Load Balancer  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Node  │ │ Node  │
│ App 1 │ │ App 2 │
└───┬───┘ └──┬────┘
    │        │
    └────┬───┘
         │
┌────────▼─────────┐
│  MySQL Database  │
│  (Primary)       │
└──────────────────┘
```

---

## Testing Strategy

### Unit Tests

```javascript
// Example: Test message sending
describe('sendMessage', () => {
  it('should send message successfully', async () => {
    const result = await chatController.sendMessage(req, res, next);
    expect(result.success).toBe(true);
  });
  
  it('should reject empty messages', async () => {
    req.body.message = '';
    await chatController.sendMessage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
```

### Integration Tests

```javascript
// Example: Test WebSocket connection
describe('Socket.io', () => {
  it('should connect with valid token', (done) => {
    const socket = io(SOCKET_URL, {
      auth: { token: validToken }
    });
    
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      done();
    });
  });
});
```

---

## Future Enhancements

### Planned Features

1. **File Attachments**
   - Image sharing
   - Document uploads
   - File preview

2. **Message Reactions**
   - Emoji reactions
   - Like/heart messages

3. **Message Threading**
   - Reply to specific messages
   - Thread conversations

4. **Video/Voice Calls**
   - WebRTC integration
   - Call history

5. **Advanced Search**
   - Full-text search
   - Search filters (date, sender, etc.)

6. **Message Templates**
   - Quick replies
   - Saved responses

7. **Chat Bots**
   - Auto-responses
   - FAQ bot

8. **Analytics Dashboard**
   - Response times
   - User activity
   - Popular topics

---

## Maintenance & Updates

### Regular Tasks

1. **Database Maintenance**
   - Backup daily
   - Optimize tables weekly
   - Archive old messages monthly

2. **Security Updates**
   - Update dependencies
   - Review security patches
   - Rotate JWT secrets

3. **Performance Monitoring**
   - Check server metrics
   - Monitor database performance
   - Review error logs

---

## Troubleshooting Guide

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | Server not running | Start server with `npm run dev` |
| Authentication failed | Invalid/expired token | Re-login to get new token |
| Messages not updating | Not listening to correct event | Check event listeners |
| Typing stuck | Timeout not working | Implement timeout cleanup |
| CORS errors | Origin not allowed | Update CORS config |

---

## Contact & Support

For technical support or questions:
- Review this documentation
- Check CHAT_API_DOCUMENTATION.md
- Check CHAT_QUICK_START_GUIDE.md

---

**Version**: 1.0.0  
**Last Updated**: October 18, 2025  
**Maintained by**: Backend Team

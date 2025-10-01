# TechCraft Solutions API Integration Guide

## Overview

This comprehensive guide provides detailed documentation for integrating with the TechCraft Solutions dashboard API. The API follows RESTful conventions and requires authentication for all protected endpoints.

## Base URL
```
http://localhost:3000/api
```

## Authentication

All API endpoints except authentication require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Authentication Endpoints

### 1.1 User Registration
**Endpoint:** `POST /auth/signup`

**Description:** Register a new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "isOnboardingCompleted": false
    },
    "token": "jwt-token-here"
  }
}
```

### 1.2 User Login
**Endpoint:** `POST /auth/login`

**Description:** Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "isOnboardingCompleted": true
    },
    "token": "jwt-token-here"
  }
}
```

---

## 2. Protected Endpoints

### 2.1 Get User Profile
**Endpoint:** `GET /protected/profile`

**Description:** Get basic user profile information

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "isOnboardingCompleted": true
  }
}
```

### 2.2 Check Authentication Status
**Endpoint:** `GET /protected/check-auth`

**Description:** Verify if the current token is valid

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": 1,
      "email": "user@example.com"
    }
  }
}
```

---

## 3. Onboarding Endpoints

### 3.1 Start Onboarding Process
**Endpoint:** `POST /onboarding/start`

**Description:** Initialize the onboarding process for a user

**Request Body:**
```json
{
  "userId": 1
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "projectId": null,
    "currentStep": 0,
    "message": "Onboarding started successfully"
  }
}
```

### 3.2 Save Project Details (Step 1)
**Endpoint:** `POST /onboarding/project`

**Description:** Save basic project information

**Request Body:**
```json
{
  "title": "E-commerce Website",
  "description": "Build a modern e-commerce platform",
  "category": "web-development",
  "deadline": "2025-12-31"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": 1,
      "title": "E-commerce Website",
      "description": "Build a modern e-commerce platform",
      "category": "web-development",
      "deadline": "2025-12-31T00:00:00.000Z",
      "status": "draft"
    },
    "nextStep": 1
  }
}
```

### 3.3 Save Requirements (Step 2)
**Endpoint:** `POST /onboarding/requirements/{projectId}`

**Description:** Upload project requirements and files

**Content-Type:** `multipart/form-data`

**Form Data:**
- `notes`: "Project requirements and specifications"
- `files`: Multiple file uploads

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "requirements": {
      "id": 1,
      "notes": "Project requirements and specifications",
      "files": [
        {
          "filename": "requirements.pdf",
          "originalName": "Project Requirements.pdf",
          "mimetype": "application/pdf",
          "size": 2048576,
          "url": "/uploads/requirements.pdf",
          "uploadedAt": "2025-09-21T10:00:00.000Z"
        }
      ]
    },
    "nextStep": 2
  }
}
```

### 3.4 Save Milestones (Step 3)
**Endpoint:** `POST /onboarding/milestones/{projectId}`

**Description:** Define project milestones and deliverables

**Request Body:**
```json
{
  "milestones": [
    {
      "title": "Design Phase",
      "deliverable": "UI/UX Design Mockups",
      "deadline": "2025-10-15",
      "amount": 2500.00,
      "status": "pending"
    },
    {
      "title": "Development Phase",
      "deliverable": "Functional Website",
      "deadline": "2025-11-30",
      "amount": 7500.00,
      "status": "pending"
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Design Phase",
      "deliverable": "UI/UX Design Mockups",
      "deadline": "2025-10-15T00:00:00.000Z",
      "amount": 2500,
      "status": "pending",
      "order": 1,
      "projectId": 1
    }
  ]
}
```

### 3.5 Save Client Information (Step 4)
**Endpoint:** `POST /onboarding/client/{projectId}`

**Description:** Add client contact information

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@company.com",
  "company": "TechCorp Inc",
  "country": "United States",
  "phone": "+1-555-0123",
  "contactPerson": "John Smith"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "client": {
      "id": 1,
      "name": "John Smith",
      "email": "john@company.com",
      "company": "TechCorp Inc",
      "country": "United States",
      "phone": "+1-555-0123",
      "contactPerson": "John Smith"
    },
    "nextStep": 4
  }
}
```

### 3.6 Review Onboarding Data (Step 5)
**Endpoint:** `POST /onboarding/review`

**Description:** Review all onboarding data before completion

**Request Body:**
```json
{
  "projectId": 1
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": 1,
      "title": "E-commerce Website",
      "description": "Build a modern e-commerce platform",
      "category": "web-development",
      "deadline": "2025-12-31T00:00:00.000Z",
      "status": "draft"
    },
    "requirements": {
      "id": 1,
      "notes": "Project requirements",
      "files": [...]
    },
    "milestones": [...],
    "client": {...},
    "nextStep": 5
  }
}
```

### 3.7 Complete Onboarding (Step 6)
**Endpoint:** `POST /onboarding/complete`

**Description:** Finalize the onboarding process and activate the project

**Request Body:**
```json
{
  "projectId": 1
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "message": "Onboarding completed successfully",
    "project": {
      "id": 1,
      "status": "active"
    }
  }
}
```

### 3.8 Get Onboarding Progress
**Endpoint:** `GET /onboarding/progress/{userId}`

**Description:** Check the current onboarding progress for a user

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "currentStep": 3,
    "isCompleted": false,
    "completedSteps": [1, 2],
    "lastUpdated": "2025-09-21T10:00:00.000Z"
  }
}
```

### 3.9 Get Onboarding Data
**Endpoint:** `GET /onboarding/{projectId}`

**Description:** Get all onboarding data for a specific project

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "project": {...},
    "requirements": {...},
    "milestones": [...],
    "client": {...},
    "progress": {
      "currentStep": 4,
      "isCompleted": false
    }
  }
}
```

### 3.10 Update Onboarding Step
**Endpoint:** `PUT /onboarding/step`

**Description:** Manually update the current onboarding step

**Request Body:**
```json
{
  "userId": 1,
  "projectId": 1,
  "step": 3
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "message": "Step updated successfully",
    "currentStep": 3
  }
}
```

### 3.11 Get User Projects
**Endpoint:** `GET /onboarding/projects`

**Description:** Get all projects for the authenticated user

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "E-commerce Website",
      "description": "Build a modern e-commerce platform",
      "category": "web-development",
      "deadline": "2025-12-31T00:00:00.000Z",
      "status": "active",
      "progress": 25,
      "priority": "high",
      "budget": 10000.00,
      "createdAt": "2025-09-21T10:00:00.000Z",
      "updatedAt": "2025-09-21T10:00:00.000Z"
    }
  ]
}
```

### 3.12 Get Single Project
**Endpoint:** `GET /onboarding/projects/{projectId}`

**Description:** Get detailed information about a specific project

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "E-commerce Website",
    "description": "Build a modern e-commerce platform",
    "category": "web-development",
    "deadline": "2025-12-31T00:00:00.000Z",
    "status": "active",
    "progress": 25,
    "priority": "high",
    "budget": 10000.00,
    "client": {
      "id": 1,
      "name": "John Smith",
      "email": "john@company.com",
      "company": "TechCorp Inc"
    },
    "milestones": [...],
    "requirements": {...}
  }
}
```

### 3.13 Get Project Requirements
**Endpoint:** `GET /onboarding/projects/{projectId}/requirements`

**Description:** Get requirements for a specific project

### 3.14 Get Project Milestones
**Endpoint:** `GET /onboarding/projects/{projectId}/milestones`

**Description:** Get milestones for a specific project

### 3.15 Get Project Client
**Endpoint:** `GET /onboarding/projects/{projectId}/client`

**Description:** Get client information for a specific project

### 3.16 Get All Projects (Dashboard)
**Endpoint:** `GET /onboarding/all-projects`

**Description:** Get all projects with filtering and pagination

**Query Parameters:**
- `status`: Filter by project status (active, completed, etc.)
- `search`: Search in title and description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "E-commerce Website",
      "status": "active",
      "progress": 25,
      "dueDate": "2025-12-31",
      "client": "John Smith",
      "priority": "high",
      "budget": 10000.00,
      "description": "Build a modern e-commerce platform",
      "category": "web-development",
      "tasks": [],
      "requirements": {
        "id": 1,
        "notes": "Project requirements and specifications",
        "files": [...]
      },
      "milestones": [
        {
          "id": 1,
          "title": "Design Phase",
          "deliverable": "UI/UX Design Mockups",
          "deadline": "2025-10-15",
          "amount": 2500.00,
          "status": "completed",
          "order": 1
        }
      ],
      "clientInfo": {
        "id": 1,
        "name": "John Smith",
        "email": "john@company.com",
        "company": "TechCorp Inc",
        "country": "United States",
        "phone": "+1-555-0123",
        "contactPerson": "John Smith"
      },
      "createdAt": "2025-09-21T10:00:00.000Z",
      "updatedAt": "2025-09-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### 3.17 Update Project Status
**Endpoint:** `PUT /onboarding/projects/{projectId}/status`

**Description:** Update project status and progress

**Request Body:**
```json
{
  "status": "active",
  "progress": 50
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "active",
    "progress": 50
  }
}
```

### 3.18 Delete Project
**Endpoint:** `DELETE /onboarding/projects/{projectId}`

**Description:** Delete a project and all associated data

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## 4. Dashboard Endpoints

### 4.1 Get Dashboard Statistics
**Endpoint:** `GET /dashboard/stats`

**Description:** Get overview statistics for the dashboard

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "totalProjects": 15,
    "activeProjects": 5,
    "completedProjects": 8,
    "totalSpent": "$45000.00"
  }
}
```

### 4.2 Get Recent Projects
**Endpoint:** `GET /dashboard/recent-projects`

**Description:** Get recently updated projects

**Query Parameters:**
- `limit`: Number of projects to return (default: 3)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "E-commerce Website",
      "client": "John Smith",
      "status": "active",
      "progress": 25
    }
  ]
}
```

### 4.3 Get Recent Messages
**Endpoint:** `GET /dashboard/recent-messages`

**Description:** Get recent chat messages from all conversations

**Query Parameters:**
- `limit`: Number of messages to return (default: 3)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client": "John Smith",
      "company": "TechCorp Inc",
      "lastMessage": "When will the design phase be completed?",
      "time": "2025-09-21T14:30:00.000Z",
      "unread": 2
    }
  ]
}
```

---

## 5. Chat Endpoints

### 5.1 Get All Conversations
**Endpoint:** `GET /chat/conversations`

**Description:** Get all chat conversations for the agency

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client": "John Smith",
      "company": "TechCorp Inc",
      "lastMessage": "When will the design phase be completed?",
      "time": "2025-09-21T14:30:00.000Z",
      "unread": 2,
      "online": false
    }
  ]
}
```

### 5.2 Get Conversation Messages
**Endpoint:** `GET /chat/conversations/{conversationId}/messages`

**Description:** Get all messages in a specific conversation

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender": "client",
      "message": "Hello, how is the project progressing?",
      "time": "2025-09-21T14:00:00.000Z"
    },
    {
      "id": 2,
      "sender": "me",
      "message": "Hi John! The project is going well. We're currently in the design phase.",
      "time": "2025-09-21T14:15:00.000Z"
    }
  ]
}
```

### 5.3 Send Message
**Endpoint:** `POST /chat/conversations/{conversationId}/messages`

**Description:** Send a new message in a conversation

**Request Body:**
```json
{
  "message": "The design mockups are ready for your review."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "sender": "me",
    "message": "The design mockups are ready for your review.",
    "time": "2025-09-21T14:45:00.000Z"
  }
}
```

### 5.4 Mark Messages as Read
**Endpoint:** `PUT /chat/conversations/{conversationId}/read`

**Description:** Mark all messages in a conversation as read

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

## 6. Documents Endpoints

### 6.1 Get Project Documents
**Endpoint:** `GET /documents/projects/{projectId}/documents`

**Description:** Get all documents for a specific project

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Project Requirements.pdf",
      "type": "PDF",
      "size": "2.1 MB",
      "client": "John Smith",
      "uploadDate": "2025-09-21",
      "status": "approved"
    }
  ]
}
```

### 6.2 Upload Document
**Endpoint:** `POST /documents/projects/{projectId}/documents`

**Description:** Upload a new document to a project

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: The file to upload

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Design Mockups.zip",
    "type": "ZIP",
    "size": "15.3 MB",
    "uploadDate": "2025-09-21",
    "status": "draft"
  }
}
```

### 6.3 Download Document
**Endpoint:** `GET /documents/{documentId}/download`

**Description:** Download a specific document

**Response:** File download (binary data)

### 6.4 Update Document Status
**Endpoint:** `PUT /documents/{documentId}/status`

**Description:** Update the status of a document

**Request Body:**
```json
{
  "status": "approved"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "approvedAt": "2025-09-21T15:00:00.000Z"
  }
}
```

### 6.5 Delete Document
**Endpoint:** `DELETE /documents/{documentId}`

**Description:** Delete a document and its file

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## 7. Clients Endpoints

### 7.1 Get All Clients
**Endpoint:** `GET /clients`

**Description:** Get all clients with filtering and pagination

**Query Parameters:**
- `status`: Filter by client status (active, inactive)
- `search`: Search in name, email, company
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Smith",
      "contact": "John Smith",
      "email": "john@company.com",
      "phone": "+1-555-0123",
      "projects": 2,
      "totalValue": "$15000.00",
      "lastContact": "2025-09-21",
      "status": "active"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### 7.2 Get Client Details
**Endpoint:** `GET /clients/{clientId}`

**Description:** Get detailed information about a specific client including all their projects

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith",
    "contact": "John Smith",
    "email": "john@company.com",
    "phone": "+1-555-0123",
    "company": "TechCorp Inc",
    "country": "United States",
    "status": "active",
    "projects": [
      {
        "id": 1,
        "name": "E-commerce Website",
        "status": "active",
        "progress": 25,
        "budget": 10000,
        "totalValue": 10000
      }
    ]
  }
}
```

### 7.3 Update Client
**Endpoint:** `PUT /clients/{clientId}`

**Description:** Update client information

**Request Body:**
```json
{
  "name": "John Smith Jr.",
  "email": "john.jr@company.com",
  "phone": "+1-555-0124",
  "company": "TechCorp Inc",
  "country": "United States",
  "status": "active"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Smith Jr.",
    "contact": "John Smith Jr.",
    "email": "john.jr@company.com",
    "phone": "+1-555-0124",
    "company": "TechCorp Inc",
    "country": "United States",
    "status": "active"
  }
}
```

### 7.4 Create New Client
**Endpoint:** `POST /clients`

**Description:** Create a new client

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@startup.com",
  "phone": "+1-555-0567",
  "company": "StartupXYZ",
  "country": "Canada",
  "contactPerson": "Jane Doe",
  "status": "active"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Doe",
    "contact": "Jane Doe",
    "email": "jane@startup.com",
    "phone": "+1-555-0567",
    "company": "StartupXYZ",
    "country": "Canada",
    "status": "active"
  }
}
```

---

## 8. Profile Endpoints

### 8.1 Get User Profile
**Endpoint:** `GET /profile`

**Description:** Get the authenticated user's profile information

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-0123",
    "company": "TechCraft Solutions",
    "profilePicture": "/uploads/profile-123.jpg",
    "bio": "Experienced software developer",
    "address": "123 Main St",
    "city": "New York",
    "country": "United States",
    "timezone": "America/New_York",
    "emailNotifications": true,
    "pushNotifications": true,
    "isOnboardingCompleted": true
  }
}
```

### 8.2 Update Profile
**Endpoint:** `PUT /profile`

**Description:** Update user profile information

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1-555-0123",
  "company": "TechCraft Solutions",
  "bio": "Experienced software developer",
  "address": "123 Main St",
  "city": "New York",
  "country": "United States",
  "timezone": "America/New_York",
  "emailNotifications": true,
  "pushNotifications": false
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1-555-0123",
    "company": "TechCraft Solutions",
    "profilePicture": "/uploads/profile-123.jpg",
    "bio": "Experienced software developer",
    "address": "123 Main St",
    "city": "New York",
    "country": "United States",
    "timezone": "America/New_York",
    "emailNotifications": true,
    "pushNotifications": false
  }
}
```

### 8.3 Update Profile Picture
**Endpoint:** `POST /profile/picture`

**Description:** Upload a new profile picture

**Content-Type:** `multipart/form-data`

**Form Data:**
- `profilePicture`: Image file (JPG, PNG, etc.)

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "profilePicture": "/uploads/profile-456.jpg"
  }
}
```

### 8.4 Change Password
**Endpoint:** `PUT /profile/password`

**Description:** Change the user's password

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Error Handling

All API endpoints return errors in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes:
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Access denied
- `SERVER_ERROR`: Internal server error

---

## File Upload

Endpoints that accept file uploads use `multipart/form-data` encoding:

- **Onboarding Requirements:** `POST /onboarding/requirements/{projectId}`
- **Document Upload:** `POST /documents/projects/{projectId}/documents`
- **Profile Picture:** `POST /profile/picture`

---

## Authentication Flow

1. **Register/Login** to get JWT token
2. **Include token** in Authorization header for all protected requests
3. **Token expires** - implement refresh logic if needed
4. **Check auth status** with `GET /protected/check-auth`

---

## Onboarding Flow

1. **Start Onboarding** → `POST /onboarding/start`
2. **Save Project** → `POST /onboarding/project`
3. **Upload Requirements** → `POST /onboarding/requirements/{projectId}`
4. **Set Milestones** → `POST /onboarding/milestones/{projectId}`
5. **Add Client** → `POST /onboarding/client/{projectId}`
6. **Review** → `POST /onboarding/review`
7. **Complete** → `POST /onboarding/complete`

---

## Dashboard Integration

1. **Load Statistics** → `GET /dashboard/stats`
2. **Load Recent Projects** → `GET /dashboard/recent-projects`
3. **Load Recent Messages** → `GET /dashboard/recent-messages`
4. **Load Projects List** → `GET /onboarding/all-projects`
5. **Load Clients List** → `GET /clients`
6. **Load Conversations** → `GET /chat/conversations`

---

## Data Models

### Project
```json
{
  "id": "number",
  "title": "string",
  "description": "string",
  "category": "enum",
  "deadline": "date",
  "status": "enum",
  "progress": "number",
  "priority": "enum",
  "budget": "decimal",
  "clientId": "number"
}
```

### Client
```json
{
  "id": "number",
  "name": "string",
  "email": "string",
  "company": "string",
  "country": "string",
  "phone": "string",
  "contactPerson": "string",
  "status": "enum"
}
```

### Message
```json
{
  "id": "number",
  "content": "string",
  "senderId": "number",
  "receiverId": "number",
  "conversationId": "number",
  "senderType": "enum",
  "isRead": "boolean",
  "readAt": "date"
}
```

### Document
```json
{
  "id": "number",
  "projectId": "number",
  "name": "string",
  "filePath": "string",
  "fileSize": "number",
  "mimeType": "string",
  "status": "enum",
  "uploadedBy": "number"
}
```

---

## Rate Limiting

- Implement client-side rate limiting for API calls
- Handle 429 (Too Many Requests) responses appropriately
- Use exponential backoff for retries

---

## WebSocket Integration (Future)

For real-time features like live chat, implement WebSocket connections:

- **Connection URL:** `ws://localhost:3000`
- **Events:**
  - `new-message`: Real-time message delivery
  - `project-update`: Live project status updates
  - `notification`: System notifications

---

## Testing

Use the following tools to test the API:

1. **Postman/Insomnia** - Manual API testing
2. **cURL** - Command line testing
3. **Jest/Supertest** - Automated testing

Example cURL command:
```bash
curl -X GET "http://localhost:3000/api/dashboard/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Deployment Notes

1. **Environment Variables:**
   - Set `NODE_ENV=production`
   - Configure database connection strings
   - Set JWT secret keys
   - Configure CORS origins

2. **File Storage:**
   - Use cloud storage (AWS S3, Cloudinary) for production
   - Configure upload limits and file validation

3. **Security:**
   - Enable HTTPS
   - Implement rate limiting
   - Add input validation and sanitization
   - Use secure headers (helmet.js)

4. **Monitoring:**
   - Add logging and error tracking
   - Implement health checks
   - Monitor API performance

---

This guide provides everything needed to integrate with the TechCraft Solutions dashboard API. Start with authentication, then implement the onboarding flow, and finally build the dashboard features using the provided endpoints.</content>
<parameter name="filePath">c:\Users\LENOVO\Desktop\HotelBuzz\HotelBuzz-BookingEngine\techsol-backend\API_INTEGRATION_GUIDE.md
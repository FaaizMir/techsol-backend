# Admin API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Dashboard & Analytics](#dashboard--analytics)
3. [User Management](#user-management)
4. [Project Management](#project-management)
5. [Milestone Management](#milestone-management)
6. [Requirement Management](#requirement-management)
7. [Client Management](#client-management)
8. [Chat & Communication](#chat--communication)
9. [Document Management](#document-management)

---

## Authentication

All admin API endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

**Admin Role Required**: All endpoints require the user to have `role: 'admin'`

### Error Responses

- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: User doesn't have admin role
- **404 Not Found**: Resource not found
- **400 Bad Request**: Validation error
- **500 Internal Server Error**: Server error

---

## Dashboard & Analytics

### 1. Get Dashboard Statistics

Get comprehensive statistics for the admin dashboard including users, projects, clients, finance, documents, and chat metrics.

**Endpoint:** `GET /api/admin/dashboard/stats`

**Request:**
```http
GET /api/admin/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 45,
      "onboarded": 38,
      "pending": 7,
      "recent": 5
    },
    "projects": {
      "total": 120,
      "active": 45,
      "completed": 60,
      "pending": 10,
      "cancelled": 5,
      "recent": 8
    },
    "clients": {
      "total": 35,
      "active": 30,
      "topClients": [
        {
          "id": 1,
          "name": "Acme Corp",
          "company": "Acme Corporation",
          "projectCount": 12
        }
      ]
    },
    "finance": {
      "totalRevenue": "450000.00",
      "completedMilestones": 180,
      "pendingMilestones": 45,
      "overdueMilestones": 5
    },
    "documents": {
      "total": 320,
      "approved": 280,
      "pending": 40
    },
    "chat": {
      "totalConversations": 35,
      "unreadMessages": 12
    },
    "trends": {
      "monthlyProjects": [
        { "month": "2025-04", "count": 15 },
        { "month": "2025-05", "count": 18 },
        { "month": "2025-06", "count": 22 }
      ],
      "monthlyUsers": [
        { "month": "2025-04", "count": 8 },
        { "month": "2025-05", "count": 10 },
        { "month": "2025-06", "count": 12 }
      ],
      "projectsByStatus": [
        { "status": "active", "count": 45 },
        { "status": "completed", "count": 60 },
        { "status": "pending", "count": 10 }
      ]
    }
  }
}
```

**Use Case:** Display comprehensive dashboard metrics on the admin home page with charts and statistics.

---

### 2. Get Project Analytics

Get detailed analytics about projects including completion rates, durations, distributions, and budget utilization.

**Endpoint:** `GET /api/admin/dashboard/analytics/projects`

**Request:**
```http
GET /api/admin/dashboard/analytics/projects
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "completionRate": 50.25,
    "averageProjectDuration": 45,
    "projectsByCategory": [
      { "category": "web-development", "count": 45 },
      { "category": "mobile-app", "count": 30 },
      { "category": "ai-ml", "count": 20 }
    ],
    "projectsByPriority": [
      { "priority": "high", "count": 25 },
      { "priority": "medium", "count": 60 },
      { "priority": "low", "count": 35 }
    ],
    "overdueProjects": 5,
    "atRiskProjects": 8,
    "budget": {
      "total": "1200000.00",
      "spent": "850000.00",
      "utilization": 70.83
    }
  }
}
```

**Use Case:** Display project analytics with charts showing category distribution, priority breakdown, and financial metrics.

---

## User Management

### 3. Get All Users

Retrieve all users excluding admin users.

**Endpoint:** `GET /api/admin/users`

**Request:**
```http
GET /api/admin/users
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "id": 2,
      "email": "john.doe@example.com",
      "role": "user",
      "isOnboardingCompleted": true,
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "company": "Tech Solutions Inc",
      "city": "New York",
      "country": "USA",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-03-20T14:45:00.000Z"
    }
  ]
}
```

**Use Case:** Display all users in a table with sorting and filtering options.

---

### 4. Get User By ID

Get detailed information about a specific user.

**Endpoint:** `GET /api/admin/users/:id`

**Request:**
```http
GET /api/admin/users/2
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "john.doe@example.com",
    "role": "user",
    "isOnboardingCompleted": true,
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "company": "Tech Solutions Inc",
    "profilePicture": "/uploads/profile.jpg",
    "bio": "Experienced project manager",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "timezone": "America/New_York",
    "emailNotifications": true,
    "pushNotifications": true,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-03-20T14:45:00.000Z"
  }
}
```

**Use Case:** Display user profile with all details in a user detail modal or page.

---

### 5. Update User

Update user information (password and role cannot be updated via this endpoint).

**Endpoint:** `PUT /api/admin/users/:id`

**Request:**
```http
PUT /api/admin/users/2
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "company": "Updated Company Name",
  "city": "San Francisco",
  "country": "USA",
  "emailNotifications": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 2,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "company": "Updated Company Name",
    "city": "San Francisco",
    "country": "USA",
    "emailNotifications": false,
    "updatedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Use Case:** Edit user information from admin panel.

---

### 6. Delete User

Delete a user account (non-admin only).

**Endpoint:** `DELETE /api/admin/users/:id`

**Request:**
```http
DELETE /api/admin/users/2
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Use Case:** Remove inactive or problematic user accounts.

---

## Project Management

### 7. Get All Projects

Retrieve all projects with associated user and client information.

**Endpoint:** `GET /api/admin/projects`

**Request:**
```http
GET /api/admin/projects
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 120,
  "data": [
    {
      "id": 1,
      "title": "E-commerce Website Redesign",
      "description": "Complete redesign of the e-commerce platform",
      "category": "web-development",
      "deadline": "2025-12-31T00:00:00.000Z",
      "status": "active",
      "progress": 65,
      "priority": "high",
      "budget": "50000.00",
      "userId": 2,
      "clientId": 1,
      "createdAt": "2025-01-10T09:00:00.000Z",
      "updatedAt": "2025-10-15T14:30:00.000Z",
      "user": {
        "id": 2,
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "client": {
        "id": 1,
        "name": "Acme Corp",
        "email": "contact@acme.com",
        "company": "Acme Corporation"
      }
    }
  ]
}
```

**Use Case:** Display all projects in a table with user and client details.

---

### 8. Get Project By ID

Get complete project details including milestones, requirements, and documents.

**Endpoint:** `GET /api/admin/projects/:id`

**Request:**
```http
GET /api/admin/projects/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "E-commerce Website Redesign",
    "description": "Complete redesign of the e-commerce platform",
    "category": "web-development",
    "deadline": "2025-12-31T00:00:00.000Z",
    "status": "active",
    "progress": 65,
    "priority": "high",
    "budget": "50000.00",
    "userId": 2,
    "clientId": 1,
    "user": {
      "id": 2,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "company": "Tech Solutions Inc"
    },
    "client": {
      "id": 1,
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "company": "Acme Corporation",
      "phone": "+1234567890",
      "country": "USA"
    },
    "milestones": [
      {
        "id": 1,
        "title": "Phase 1: Design",
        "deliverable": "Complete UI/UX designs",
        "deadline": "2025-11-01T00:00:00.000Z",
        "amount": "15000.00",
        "status": "completed",
        "order": 1
      }
    ],
    "requirement": {
      "id": 1,
      "notes": "Mobile responsive, SEO optimized",
      "files": [
        {
          "name": "requirements.pdf",
          "url": "/uploads/requirements.pdf"
        }
      ]
    },
    "documents": [
      {
        "id": 1,
        "name": "Project Brief",
        "originalName": "brief.pdf",
        "filePath": "/uploads/brief.pdf",
        "status": "approved",
        "uploader": {
          "id": 2,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john.doe@example.com"
        }
      }
    ]
  }
}
```

**Use Case:** Display detailed project view with all associated data.

---

### 9. Create Project

Create a new project for a user.

**Endpoint:** `POST /api/admin/projects`

**Request:**
```http
POST /api/admin/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 2,
  "clientId": 1,
  "title": "Mobile App Development",
  "description": "iOS and Android app for inventory management",
  "category": "mobile-app",
  "deadline": "2026-06-30",
  "budget": 75000,
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": 121,
    "title": "Mobile App Development",
    "description": "iOS and Android app for inventory management",
    "category": "mobile-app",
    "deadline": "2026-06-30T00:00:00.000Z",
    "budget": "75000.00",
    "priority": "high",
    "status": "pending",
    "progress": 0,
    "userId": 2,
    "clientId": 1,
    "user": {
      "id": 2,
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "client": {
      "id": 1,
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "company": "Acme Corporation"
    }
  }
}
```

**Use Case:** Create new projects from admin panel.

---

### 10. Update Project

Update project information.

**Endpoint:** `PUT /api/admin/projects/:id`

**Request:**
```http
PUT /api/admin/projects/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "E-commerce Platform Complete Overhaul",
  "description": "Updated description",
  "progress": 75,
  "priority": "urgent",
  "budget": 60000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": 1,
    "title": "E-commerce Platform Complete Overhaul",
    "description": "Updated description",
    "progress": 75,
    "priority": "urgent",
    "budget": "60000.00",
    "updatedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Use Case:** Edit project details from admin panel.

---

### 11. Update Project Status

Update only the status of a project.

**Endpoint:** `PUT /api/admin/projects/:id/status`

**Request:**
```http
PUT /api/admin/projects/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project status updated successfully",
  "data": {
    "id": 1,
    "status": "completed"
  }
}
```

**Valid statuses:** `pending`, `active`, `completed`, `cancelled`

**Use Case:** Quick status update from project list.

---

### 12. Bulk Update Projects

Update multiple projects at once.

**Endpoint:** `PUT /api/admin/projects/bulk-update`

**Request:**
```http
PUT /api/admin/projects/bulk-update
Authorization: Bearer <token>
Content-Type: application/json

{
  "projectIds": [1, 2, 3, 4],
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated 4 projects",
  "data": {
    "updatedCount": 4
  }
}
```

**Use Case:** Bulk operations like changing status of multiple selected projects.

---

### 13. Search Projects

Search and filter projects with pagination.

**Endpoint:** `GET /api/admin/projects/search`

**Query Parameters:**
- `query` - Search in title and description
- `status` - Filter by status (pending, active, completed, cancelled)
- `category` - Filter by category
- `priority` - Filter by priority
- `clientId` - Filter by client
- `minBudget` - Minimum budget filter
- `maxBudget` - Maximum budget filter
- `startDate` - Filter projects created after this date
- `endDate` - Filter projects created before this date
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Request:**
```http
GET /api/admin/projects/search?query=ecommerce&status=active&category=web-development&page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": 1,
        "title": "E-commerce Website Redesign",
        "description": "Complete redesign of the e-commerce platform",
        "status": "active",
        "category": "web-development",
        "priority": "high",
        "budget": "50000.00",
        "user": {
          "id": 2,
          "email": "john.doe@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "client": {
          "id": 1,
          "name": "Acme Corp",
          "email": "contact@acme.com",
          "company": "Acme Corporation"
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

**Use Case:** Advanced search and filtering in project management interface.

---

### 14. Delete Project

Delete a project.

**Endpoint:** `DELETE /api/admin/projects/:id`

**Request:**
```http
DELETE /api/admin/projects/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

**Use Case:** Remove cancelled or obsolete projects.

---

## Milestone Management

### 15. Get All Milestones

Retrieve all milestones with project information.

**Endpoint:** `GET /api/admin/milestones`

**Request:**
```http
GET /api/admin/milestones
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 180,
  "data": [
    {
      "id": 1,
      "title": "Phase 1: Design",
      "deliverable": "Complete UI/UX designs",
      "deadline": "2025-11-01T00:00:00.000Z",
      "amount": "15000.00",
      "status": "completed",
      "order": 1,
      "projectId": 1,
      "project": {
        "id": 1,
        "title": "E-commerce Website Redesign",
        "status": "active",
        "user": {
          "id": 2,
          "email": "john.doe@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    }
  ]
}
```

**Use Case:** Display all milestones across projects.

---

### 16. Create Milestone

Create a new milestone for a project.

**Endpoint:** `POST /api/admin/projects/:projectId/milestones`

**Request:**
```http
POST /api/admin/projects/1/milestones
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Phase 2: Development",
  "deliverable": "Complete frontend development",
  "deadline": "2025-12-15",
  "amount": 20000,
  "order": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Milestone created successfully",
  "data": {
    "id": 2,
    "title": "Phase 2: Development",
    "deliverable": "Complete frontend development",
    "deadline": "2025-12-15T00:00:00.000Z",
    "amount": "20000.00",
    "status": "pending",
    "order": 2,
    "projectId": 1
  }
}
```

**Use Case:** Add milestones to projects from project detail page.

---

### 17. Update Milestone

Update milestone information.

**Endpoint:** `PUT /api/admin/milestones/:id`

**Request:**
```http
PUT /api/admin/milestones/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Phase 1: Complete Design",
  "status": "completed",
  "amount": 18000
}
```

**Response:**
```json
{
  "success": true,
  "message": "Milestone updated successfully",
  "data": {
    "id": 1,
    "title": "Phase 1: Complete Design",
    "status": "completed",
    "amount": "18000.00",
    "updatedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Valid statuses:** `pending`, `in-progress`, `completed`, `overdue`

**Use Case:** Edit milestone details and update status.

---

### 18. Delete Milestone

Delete a milestone.

**Endpoint:** `DELETE /api/admin/milestones/:id`

**Request:**
```http
DELETE /api/admin/milestones/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Milestone deleted successfully"
}
```

**Use Case:** Remove milestones that are no longer needed.

---

## Requirement Management

### 19. Get All Requirements

Retrieve all requirements with project information.

**Endpoint:** `GET /api/admin/requirements`

**Request:**
```http
GET /api/admin/requirements
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 95,
  "data": [
    {
      "id": 1,
      "notes": "Mobile responsive design required. SEO optimized.",
      "files": [
        {
          "name": "requirements.pdf",
          "url": "/uploads/requirements.pdf"
        }
      ],
      "projectId": 1,
      "project": {
        "id": 1,
        "title": "E-commerce Website Redesign",
        "status": "active",
        "category": "web-development",
        "user": {
          "id": 2,
          "email": "john.doe@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    }
  ]
}
```

**Use Case:** View all project requirements across the system.

---

### 20. Create Requirement

Create a new requirement for a project.

**Endpoint:** `POST /api/admin/projects/:projectId/requirements`

**Request:**
```http
POST /api/admin/projects/1/requirements
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Must support multiple payment gateways including Stripe and PayPal",
  "files": [
    {
      "name": "payment-specs.pdf",
      "url": "/uploads/payment-specs.pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Requirement created successfully",
  "data": {
    "id": 2,
    "notes": "Must support multiple payment gateways including Stripe and PayPal",
    "files": [
      {
        "name": "payment-specs.pdf",
        "url": "/uploads/payment-specs.pdf"
      }
    ],
    "projectId": 1
  }
}
```

**Use Case:** Add requirements to projects.

---

### 21. Update Requirement

Update requirement information.

**Endpoint:** `PUT /api/admin/requirements/:id`

**Request:**
```http
PUT /api/admin/requirements/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Updated requirements with additional security features",
  "files": [
    {
      "name": "updated-requirements.pdf",
      "url": "/uploads/updated-requirements.pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Requirement updated successfully",
  "data": {
    "id": 1,
    "notes": "Updated requirements with additional security features",
    "files": [
      {
        "name": "updated-requirements.pdf",
        "url": "/uploads/updated-requirements.pdf"
      }
    ],
    "updatedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Use Case:** Modify project requirements.

---

### 22. Delete Requirement

Delete a requirement.

**Endpoint:** `DELETE /api/admin/requirements/:id`

**Request:**
```http
DELETE /api/admin/requirements/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Requirement deleted successfully"
}
```

**Use Case:** Remove obsolete requirements.

---

## Client Management

### 23. Get All Clients

Retrieve all clients with their projects.

**Endpoint:** `GET /api/admin/clients`

**Request:**
```http
GET /api/admin/clients
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 35,
  "data": [
    {
      "id": 1,
      "name": "Acme Corp",
      "email": "contact@acme.com",
      "company": "Acme Corporation",
      "country": "USA",
      "phone": "+1234567890",
      "contactPerson": "Jane Smith",
      "status": "active",
      "createdAt": "2025-01-05T09:00:00.000Z",
      "projects": [
        {
          "id": 1,
          "title": "E-commerce Website Redesign",
          "status": "active"
        },
        {
          "id": 5,
          "title": "Mobile App Development",
          "status": "pending"
        }
      ]
    }
  ]
}
```

**Use Case:** Display client list with their projects.

---

### 24. Create Client

Create a new client.

**Endpoint:** `POST /api/admin/clients`

**Request:**
```http
POST /api/admin/clients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "TechStart Inc",
  "email": "hello@techstart.com",
  "company": "TechStart Incorporated",
  "country": "Canada",
  "phone": "+1987654321",
  "contactPerson": "Robert Johnson"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": 36,
    "name": "TechStart Inc",
    "email": "hello@techstart.com",
    "company": "TechStart Incorporated",
    "country": "Canada",
    "phone": "+1987654321",
    "contactPerson": "Robert Johnson",
    "status": "active",
    "createdAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Use Case:** Add new clients to the system.

---

### 25. Update Client

Update client information.

**Endpoint:** `PUT /api/admin/clients/:id`

**Request:**
```http
PUT /api/admin/clients/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Corporation",
  "phone": "+1234567899",
  "contactPerson": "Jane Doe",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": 1,
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1234567899",
    "contactPerson": "Jane Doe",
    "status": "active",
    "updatedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Use Case:** Edit client information.

---

### 26. Delete Client

Delete a client (only if they have no associated projects).

**Endpoint:** `DELETE /api/admin/clients/:id`

**Request:**
```http
DELETE /api/admin/clients/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

**Error Response (if client has projects):**
```json
{
  "success": false,
  "error": "Cannot delete client with 5 associated projects. Please reassign or delete projects first."
}
```

**Use Case:** Remove clients without active projects.

---

## Chat & Communication

### 27. Get All Conversations

Retrieve all chat conversations.

**Endpoint:** `GET /api/admin/conversations`

**Request:**
```http
GET /api/admin/conversations
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client": "Acme Corp",
      "company": "Acme Corporation",
      "agency": "John Doe",
      "lastMessage": "Thank you for the update!",
      "time": "2025-10-18T11:30:00.000Z",
      "unread": 2
    },
    {
      "id": 2,
      "client": "TechStart Inc",
      "company": "TechStart Incorporated",
      "agency": "Sarah Wilson",
      "lastMessage": "When can we schedule a call?",
      "time": "2025-10-18T10:15:00.000Z",
      "unread": 0
    }
  ]
}
```

**Use Case:** Display list of all conversations in admin chat interface.

---

### 28. Get Conversation Messages

Retrieve all messages in a specific conversation.

**Endpoint:** `GET /api/admin/conversations/:conversationId/messages`

**Request:**
```http
GET /api/admin/conversations/1/messages
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sender": "John Doe",
      "senderType": "agency",
      "message": "Hello! How can I help you today?",
      "time": "2025-10-18T09:00:00.000Z",
      "isRead": true
    },
    {
      "id": 2,
      "sender": "Client",
      "senderType": "client",
      "message": "I'd like an update on my project",
      "time": "2025-10-18T09:05:00.000Z",
      "isRead": true
    },
    {
      "id": 3,
      "sender": "John Doe",
      "senderType": "agency",
      "message": "Your project is 75% complete",
      "time": "2025-10-18T09:10:00.000Z",
      "isRead": true
    }
  ]
}
```

**Use Case:** Display chat history in conversation view.

---

### 29. Send Message as Admin

Send a message in a conversation as admin.

**Endpoint:** `POST /api/admin/conversations/:conversationId/messages`

**Request:**
```http
POST /api/admin/conversations/1/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Thank you for your patience. We'll have an update by end of day."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "sender": "Admin",
    "senderType": "agency",
    "message": "Thank you for your patience. We'll have an update by end of day.",
    "time": "2025-10-18T12:00:00.000Z"
  }
}
```

**Use Case:** Admin responds to client messages.

---

## Document Management

### 30. Get All Documents

Retrieve all documents with project and user information.

**Endpoint:** `GET /api/admin/documents`

**Request:**
```http
GET /api/admin/documents
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Project Brief",
      "originalName": "brief.pdf",
      "type": "PDF",
      "size": "2.5 MB",
      "project": "E-commerce Website Redesign",
      "user": "John Doe",
      "client": "Acme Corp",
      "uploader": "John Doe",
      "uploadDate": "2025-10-15",
      "status": "approved",
      "approvedBy": "Admin User",
      "approvedAt": "2025-10-16T10:00:00.000Z"
    }
  ]
}
```

**Use Case:** Display all documents in document management interface.

---

### 31. Upload Document

Upload a document to a project.

**Endpoint:** `POST /api/admin/projects/:projectId/documents`

**Request:**
```http
POST /api/admin/projects/1/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "contract.pdf",
    "type": "PDF",
    "size": "1.8 MB",
    "uploadDate": "2025-10-18",
    "status": "draft"
  }
}
```

**Use Case:** Admin uploads documents for projects.

---

### 32. Update Document Status

Update the status of a document.

**Endpoint:** `PUT /api/admin/documents/:documentId/status`

**Request:**
```http
PUT /api/admin/documents/1/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "approved"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "approved",
    "approvedAt": "2025-10-18T12:00:00.000Z"
  }
}
```

**Valid statuses:** `draft`, `under-review`, `approved`, `signed`

**Use Case:** Approve or change document status.

---

### 33. Delete Document

Delete a document and its file.

**Endpoint:** `DELETE /api/admin/documents/:documentId`

**Request:**
```http
DELETE /api/admin/documents/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Use Case:** Remove unwanted or outdated documents.

---

## Integration Examples

### React/Next.js Integration Example

```javascript
// api/adminService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with auth
const adminApi = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Dashboard
export const getDashboardStats = () => adminApi.get('/admin/dashboard/stats');
export const getProjectAnalytics = () => adminApi.get('/admin/dashboard/analytics/projects');

// Users
export const getAllUsers = () => adminApi.get('/admin/users');
export const getUserById = (id) => adminApi.get(`/admin/users/${id}`);
export const updateUser = (id, data) => adminApi.put(`/admin/users/${id}`, data);
export const deleteUser = (id) => adminApi.delete(`/admin/users/${id}`);

// Projects
export const getAllProjects = () => adminApi.get('/admin/projects');
export const getProjectById = (id) => adminApi.get(`/admin/projects/${id}`);
export const createProject = (data) => adminApi.post('/admin/projects', data);
export const updateProject = (id, data) => adminApi.put(`/admin/projects/${id}`, data);
export const deleteProject = (id) => adminApi.delete(`/admin/projects/${id}`);
export const searchProjects = (params) => adminApi.get('/admin/projects/search', { params });

// Milestones
export const createMilestone = (projectId, data) => 
  adminApi.post(`/admin/projects/${projectId}/milestones`, data);
export const updateMilestone = (id, data) => adminApi.put(`/admin/milestones/${id}`, data);
export const deleteMilestone = (id) => adminApi.delete(`/admin/milestones/${id}`);

// Clients
export const getAllClients = () => adminApi.get('/admin/clients');
export const createClient = (data) => adminApi.post('/admin/clients', data);
export const updateClient = (id, data) => adminApi.put(`/admin/clients/${id}`, data);
export const deleteClient = (id) => adminApi.delete(`/admin/clients/${id}`);

// Chat
export const getConversations = () => adminApi.get('/admin/conversations');
export const getMessages = (conversationId) => 
  adminApi.get(`/admin/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, message) => 
  adminApi.post(`/admin/conversations/${conversationId}/messages`, { message });

// Documents
export const getAllDocuments = () => adminApi.get('/admin/documents');
export const uploadDocument = (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return adminApi.post(`/admin/projects/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const updateDocumentStatus = (documentId, status) => 
  adminApi.put(`/admin/documents/${documentId}/status`, { status });
export const deleteDocument = (documentId) => 
  adminApi.delete(`/admin/documents/${documentId}`);

export default adminApi;
```

### Usage in React Component

```javascript
// pages/admin/Dashboard.jsx
import { useEffect, useState } from 'react';
import { getDashboardStats, getProjectAnalytics } from '@/api/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          getDashboardStats(),
          getProjectAnalytics()
        ]);
        setStats(statsRes.data.data);
        setAnalytics(analyticsRes.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard">
      <h1>Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p>{stats?.users?.total}</p>
        </div>
        <div className="stat-card">
          <h3>Active Projects</h3>
          <p>{stats?.projects?.active}</p>
        </div>
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${stats?.finance?.totalRevenue}</p>
        </div>
        <div className="stat-card">
          <h3>Completion Rate</h3>
          <p>{analytics?.completionRate}%</p>
        </div>
      </div>

      {/* Charts and more details */}
    </div>
  );
}
```

### Error Handling Example

```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    switch (status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        return 'Session expired. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return data.error || 'Resource not found.';
      case 400:
        return data.error || 'Invalid request.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.error || 'An error occurred.';
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
};

// Usage in component
try {
  await deleteProject(projectId);
  alert('Project deleted successfully');
} catch (error) {
  const errorMessage = handleApiError(error);
  alert(errorMessage);
}
```

---

## Best Practices

1. **Always include authentication token** in the Authorization header
2. **Handle errors gracefully** - Check for 401 (unauthorized) and redirect to login
3. **Use pagination** for large data sets (search endpoints)
4. **Validate data** on frontend before sending to API
5. **Show loading states** while API calls are in progress
6. **Cache dashboard data** to reduce API calls
7. **Use debouncing** for search inputs
8. **Implement optimistic updates** for better UX
9. **Handle file uploads** with progress indicators
10. **Log out users** on 401 or 403 errors

---

## Rate Limiting & Performance

- Most endpoints return all data, consider implementing pagination on frontend
- Use the search endpoint for large datasets
- Dashboard stats endpoint is comprehensive - cache for 5-10 minutes
- Batch operations when possible (bulk update endpoint)
- File uploads have size limits - check with backend team

---

## Support

For issues or questions regarding the Admin API:
- Check the error response for detailed messages
- Verify authentication token is valid and user has admin role
- Ensure all required fields are provided in requests
- Contact backend team for API-related issues

---

**Last Updated:** October 18, 2025
**API Version:** 1.0
**Base URL:** `http://localhost:5000/api` (Update for production)

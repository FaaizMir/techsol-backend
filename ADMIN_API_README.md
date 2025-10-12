# Admin API Endpoints - Frontend Integration Guide

This guide explains how to integrate with the admin API endpoints for editing projects, clients, milestones, and requirements in your frontend application.

## 🔐 Authentication

All admin endpoints require:
1. **JWT Token** in Authorization header: `Bearer <token>`
2. **Admin Role** - Only users with `role: "admin"` can access these endpoints

### Login as Admin
```javascript
// Login credentials
const adminCredentials = {
  email: "admin@example.com",
  password: "admin123"
};

// Login request
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(adminCredentials)
});

const loginData = await loginResponse.json();
const adminToken = loginData.token; // Store this for subsequent requests
```

## 📋 API Endpoints

### Projects

#### Edit Project
```http
PUT /api/admin/projects/:id
```

**Request:**
```javascript
const response = await fetch(`/api/admin/projects/${projectId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Updated Project Title",
    description: "Updated project description",
    status: "in_progress", // draft, in_progress, completed, on_hold, cancelled
    category: "web-development",
    budget: 25000,
    deadline: "2025-12-31",
    priority: "high", // low, medium, high, urgent
    clientId: 123
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": 456,
    "title": "Updated Project Title",
    "description": "Updated project description",
    "status": "in_progress",
    "category": "web-development",
    "budget": 25000,
    "deadline": "2025-12-31T00:00:00.000Z",
    "priority": "high",
    "clientId": 123,
    "userId": 789,
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-11T00:00:00.000Z",
    "user": {
      "id": 789,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "client": {
      "id": 123,
      "name": "ABC Corp",
      "email": "contact@abc.com",
      "company": "ABC Corporation"
    }
  }
}
```

### Clients

#### Edit Client
```http
PUT /api/admin/clients/:id
```

**Request:**
```javascript
const response = await fetch(`/api/admin/clients/${clientId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: "Updated Client Name",
    email: "updated@email.com",
    phone: "+1234567890",
    company: "Updated Company Name",
    address: "Updated Address",
    city: "Updated City",
    country: "Updated Country",
    notes: "Updated notes about the client"
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": 123,
    "name": "Updated Client Name",
    "email": "updated@email.com",
    "phone": "+1234567890",
    "company": "Updated Company Name",
    "address": "Updated Address",
    "city": "Updated City",
    "country": "Updated Country",
    "notes": "Updated notes about the client",
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-11T00:00:00.000Z",
    "projects": [
      {
        "id": 456,
        "title": "Project Title",
        "status": "in_progress",
        "user": {
          "id": 789,
          "email": "user@example.com",
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    ]
  }
}
```

### Milestones

#### Edit Milestone
```http
PUT /api/admin/milestones/:id
```

**Request:**
```javascript
const response = await fetch(`/api/admin/milestones/${milestoneId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Updated Milestone Title",
    description: "Updated milestone description",
    dueDate: "2025-11-15",
    status: "in_progress", // pending, in_progress, completed, overdue, cancelled
    priority: "high",
    progress: 75,
    notes: "Updated notes"
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Milestone updated successfully",
  "data": {
    "id": 101,
    "title": "Updated Milestone Title",
    "description": "Updated milestone description",
    "dueDate": "2025-11-15T00:00:00.000Z",
    "status": "in_progress",
    "priority": "high",
    "progress": 75,
    "notes": "Updated notes",
    "projectId": 456,
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-11T00:00:00.000Z",
    "project": {
      "id": 456,
      "title": "Project Title",
      "status": "in_progress",
      "user": {
        "id": 789,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "client": {
        "id": 123,
        "name": "ABC Corp",
        "email": "contact@abc.com",
        "company": "ABC Corporation"
      }
    }
  }
}
```

### Requirements

#### Edit Requirement
```http
PUT /api/admin/requirements/:id
```

**Request:**
```javascript
const response = await fetch(`/api/admin/requirements/${requirementId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Updated Requirement Title",
    description: "Updated requirement description",
    type: "functional", // functional, non_functional, technical, business
    priority: "high", // low, medium, high, critical
    status: "approved", // draft, pending_review, approved, rejected, implemented
    notes: "Updated notes",
    acceptanceCriteria: "Updated acceptance criteria",
    estimatedHours: 40,
    actualHours: 35
  })
});
```

**Response:**
```json
{
  "success": true,
  "message": "Requirement updated successfully",
  "data": {
    "id": 202,
    "title": "Updated Requirement Title",
    "description": "Updated requirement description",
    "type": "functional",
    "priority": "high",
    "status": "approved",
    "notes": "Updated notes",
    "acceptanceCriteria": "Updated acceptance criteria",
    "estimatedHours": 40,
    "actualHours": 35,
    "projectId": 456,
    "createdAt": "2025-10-01T00:00:00.000Z",
    "updatedAt": "2025-10-11T00:00:00.000Z",
    "project": {
      "id": 456,
      "title": "Project Title",
      "status": "in_progress",
      "user": {
        "id": 789,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "client": {
        "id": 123,
        "name": "ABC Corp",
        "email": "contact@abc.com",
        "company": "ABC Corporation"
      }
    }
  }
}
```

## 🎯 Frontend Integration Example

Here's how you can implement the edit functionality in your frontend:

```javascript
// Edit functionality for your admin dashboard
class AdminEditor {
  constructor() {
    this.adminToken = localStorage.getItem('adminToken');
  }

  async editEntity(entityType, id, data) {
    try {
      const response = await fetch(`/api/admin/${entityType}/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        this.showNotification('Entity updated successfully', 'success');
        // Refresh the data
        this.refreshData();
      } else {
        // Show error message
        this.showNotification(result.error || 'Failed to update entity', 'error');
      }

      return result;
    } catch (error) {
      console.error('Edit error:', error);
      this.showNotification('Network error occurred', 'error');
    }
  }

  // Specific edit methods
  async editProject(id, data) {
    return this.editEntity('projects', id, data);
  }

  async editClient(id, data) {
    return this.editEntity('clients', id, data);
  }

  async editMilestone(id, data) {
    return this.editEntity('milestones', id, data);
  }

  async editRequirement(id, data) {
    return this.editEntity('requirements', id, data);
  }

  showNotification(message, type) {
    // Implement your notification system
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  refreshData() {
    // Implement data refresh logic
    window.location.reload(); // Or use a more sophisticated method
  }
}

// Usage in your component
const adminEditor = new AdminEditor();

// Example: Edit a project
async function handleProjectEdit(projectId, formData) {
  const result = await adminEditor.editProject(projectId, formData);
  if (result.success) {
    // Close modal or redirect
  }
}
```

## ⚠️ Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not admin user)
- `404` - Not Found (entity doesn't exist)
- `500` - Internal Server Error

## 🔒 Security Notes

- All endpoints require admin authentication
- Admin users cannot edit their own data (filtered out)
- Sensitive fields are automatically excluded from updates
- All changes are logged for audit purposes

## 📊 Data Flow

1. **Fetch Data**: Use GET endpoints to load current data
2. **Display Form**: Populate form with existing data
3. **User Edits**: User modifies data in the form
4. **Submit Changes**: Call PUT endpoint with updated data
5. **Handle Response**: Show success/error messages
6. **Refresh UI**: Update the display with new data

This system allows you to create a comprehensive admin dashboard where you can view and edit all client-related data in a hierarchical manner: Client → Projects → Milestones/Requirements.
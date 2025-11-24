# Admin API Quick Reference Guide

Quick reference for integrating Admin APIs into the frontend application.

## Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('authToken');

// Headers for all requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## Dashboard APIs

### Get Dashboard Stats
```javascript
GET /api/admin/dashboard/stats
// Returns: users, projects, clients, finance, documents, chat stats, trends
```

### Get Project Analytics
```javascript
GET /api/admin/dashboard/analytics/projects
// Returns: completion rate, avg duration, distributions, budget info
```

---

## User Management

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List all users | GET | `/api/admin/users` | - |
| Get user | GET | `/api/admin/users/:id` | - |
| Update user | PUT | `/api/admin/users/:id` | `{ firstName, lastName, phone, company, city, country }` |
| Delete user | DELETE | `/api/admin/users/:id` | - |

---

## Project Management

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List all projects | GET | `/api/admin/projects` | - |
| Get project details | GET | `/api/admin/projects/:id` | - |
| Create project | POST | `/api/admin/projects` | `{ userId, clientId, title, description, category, deadline, budget, priority }` |
| Update project | PUT | `/api/admin/projects/:id` | `{ title, description, progress, priority, budget }` |
| Update status | PUT | `/api/admin/projects/:id/status` | `{ status }` |
| Bulk update | PUT | `/api/admin/projects/bulk-update` | `{ projectIds: [], status }` |
| Search projects | GET | `/api/admin/projects/search?query=...&status=...&page=1&limit=10` | - |
| Delete project | DELETE | `/api/admin/projects/:id` | - |

**Project Statuses:** `pending`, `active`, `completed`, `cancelled`

**Categories:** `web-development`, `mobile-app`, `ai-ml`, `cloud-services`, `consulting`, `other`

**Priorities:** `low`, `medium`, `high`, `urgent`

---

## Milestone Management

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List all milestones | GET | `/api/admin/milestones` | - |
| Create milestone | POST | `/api/admin/projects/:projectId/milestones` | `{ title, deliverable, deadline, amount, order }` |
| Update milestone | PUT | `/api/admin/milestones/:id` | `{ title, deliverable, deadline, amount, status }` |
| Delete milestone | DELETE | `/api/admin/milestones/:id` | - |

**Milestone Statuses:** `pending`, `in-progress`, `completed`, `overdue`

---

## Requirement Management

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List all requirements | GET | `/api/admin/requirements` | - |
| Create requirement | POST | `/api/admin/projects/:projectId/requirements` | `{ notes, files: [] }` |
| Update requirement | PUT | `/api/admin/requirements/:id` | `{ notes, files: [] }` |
| Delete requirement | DELETE | `/api/admin/requirements/:id` | - |

---

## Client Management

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List all clients | GET | `/api/admin/clients` | - |
| Create client | POST | `/api/admin/clients` | `{ name, email, company, country, phone, contactPerson }` |
| Update client | PUT | `/api/admin/clients/:id` | `{ name, email, company, country, phone, contactPerson, status }` |
| Delete client | DELETE | `/api/admin/clients/:id` | - |

---

## Chat/Communication

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List conversations | GET | `/api/admin/conversations` | - |
| Get messages | GET | `/api/admin/conversations/:conversationId/messages` | - |
| Send message | POST | `/api/admin/conversations/:conversationId/messages` | `{ message }` |

---

## Document Management

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| List all documents | GET | `/api/admin/documents` | - |
| Upload document | POST | `/api/admin/projects/:projectId/documents` | `FormData with 'file'` |
| Update status | PUT | `/api/admin/documents/:documentId/status` | `{ status }` |
| Delete document | DELETE | `/api/admin/documents/:documentId` | - |

**Document Statuses:** `draft`, `under-review`, `approved`, `signed`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Common HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Display data |
| 201 | Created | Show success message |
| 400 | Bad Request | Show validation error |
| 401 | Unauthorized | Redirect to login |
| 403 | Forbidden | Show permission error |
| 404 | Not Found | Show not found message |
| 500 | Server Error | Show generic error |

---

## Sample API Call (Fetch)

```javascript
// GET Request
async function getDashboardStats() {
  try {
    const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data; // Return the data object
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// POST Request
async function createProject(projectData) {
  try {
    const response = await fetch('http://localhost:5000/api/admin/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create project');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// File Upload
async function uploadDocument(projectId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`http://localhost:5000/api/admin/projects/${projectId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        // Don't set Content-Type for FormData, browser will set it with boundary
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload document');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## Sample API Call (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// GET Request
const getDashboardStats = () => api.get('/admin/dashboard/stats');

// POST Request
const createProject = (data) => api.post('/admin/projects', data);

// PUT Request
const updateProject = (id, data) => api.put(`/admin/projects/${id}`, data);

// DELETE Request
const deleteProject = (id) => api.delete(`/admin/projects/${id}`);

// File Upload
const uploadDocument = (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/admin/projects/${projectId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
```

---

## Pagination Parameters

For search endpoints that support pagination:

```javascript
{
  page: 1,        // Page number (starts at 1)
  limit: 10,      // Items per page
}

// Response includes:
{
  data: {
    projects: [...],
    pagination: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10
    }
  }
}
```

---

## Search/Filter Parameters

For `/api/admin/projects/search`:

```javascript
{
  query: "search term",           // Search in title/description
  status: "active",               // Filter by status
  category: "web-development",    // Filter by category
  priority: "high",               // Filter by priority
  clientId: 1,                    // Filter by client
  minBudget: 10000,              // Minimum budget
  maxBudget: 50000,              // Maximum budget
  startDate: "2025-01-01",       // Created after date
  endDate: "2025-12-31",         // Created before date
  page: 1,                        // Page number
  limit: 10                       // Items per page
}
```

---

## Frontend State Management Tips

### Using React Query

```javascript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch dashboard stats
const { data, isLoading, error } = useQuery({
  queryKey: ['dashboardStats'],
  queryFn: getDashboardStats,
  staleTime: 5 * 60 * 1000, // Cache for 5 minutes
});

// Create project mutation
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: createProject,
  onSuccess: () => {
    queryClient.invalidateQueries(['projects']); // Refresh projects list
  },
});
```

### Using Redux Toolkit

```javascript
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDashboardStats = createAsyncThunk(
  'admin/fetchDashboardStats',
  async () => {
    const response = await getDashboardStats();
    return response.data;
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: { stats: null, loading: false, error: null },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
```

---

## Testing the APIs

### Using cURL

```bash
# Get dashboard stats
curl -X GET http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create project
curl -X POST http://localhost:5000/api/admin/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 2,
    "title": "New Project",
    "description": "Project description",
    "category": "web-development",
    "deadline": "2025-12-31",
    "budget": 50000,
    "priority": "high"
  }'

# Update project status
curl -X PUT http://localhost:5000/api/admin/projects/1/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

### Using Postman

1. Create a new request collection for "Admin APIs"
2. Set base URL as `http://localhost:5000/api`
3. In Authorization tab, select "Bearer Token" and add your token
4. Save token as environment variable for reuse
5. Test each endpoint with sample data

---

## Common Integration Patterns

### Dashboard Page
```
1. Fetch dashboard stats on mount
2. Fetch project analytics on mount
3. Display in cards and charts
4. Refresh data every 5 minutes
```

### Projects List Page
```
1. Fetch all projects on mount
2. Implement search with debounce (500ms)
3. Add filters for status, category, priority
4. Implement pagination
5. Add create/edit/delete actions
```

### Project Detail Page
```
1. Fetch project by ID on mount
2. Display project info
3. Show milestones list with add/edit/delete
4. Show requirements with add/edit/delete
5. Show documents with upload/download/delete
```

### Chat Interface
```
1. Fetch conversations list
2. Display in sidebar
3. On conversation click, fetch messages
4. Implement real-time updates (polling or WebSocket)
5. Send message functionality
```

---

## Performance Tips

1. **Cache dashboard data** - Stats don't change frequently
2. **Debounce search inputs** - Wait 300-500ms before API call
3. **Use pagination** - Load 10-20 items at a time
4. **Lazy load images** - For documents and profiles
5. **Optimistic updates** - Update UI immediately, revert on error
6. **Batch requests** - Use bulk update when possible
7. **Infinite scroll** - For long lists like documents

---

## Security Checklist

- ✅ Always send Authorization header
- ✅ Store token securely (httpOnly cookie preferred over localStorage)
- ✅ Handle 401 errors (redirect to login)
- ✅ Handle 403 errors (show permission denied)
- ✅ Validate user input before sending
- ✅ Sanitize display data (prevent XSS)
- ✅ Use HTTPS in production
- ✅ Implement CSRF protection
- ✅ Set appropriate CORS headers

---

## Need Help?

- Check full documentation: `ADMIN_API_DOCUMENTATION.md`
- Test endpoints with Postman
- Check browser console for errors
- Verify authentication token is valid
- Ensure user has admin role

---

**Quick Reference Version:** 1.0  
**Last Updated:** October 18, 2025

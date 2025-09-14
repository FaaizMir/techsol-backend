# TechSol Onboarding System - Backend API Documentation

## Overview
This document outlines the backend API requirements for handling the TechSol onboarding system. The onboarding process collects project details, requirements, milestones, and client information to create a comprehensive project setup.

## Database Models

### 1. Project Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  title: String (required, min: 3, max: 100),
  description: String (required, min: 10, max: 1000),
  category: String (required, enum: ['web-development', 'mobile-app', 'ai-ml', 'cloud-services', 'consulting', 'other']),
  deadline: Date (required),
  status: String (enum: ['draft', 'active', 'completed', 'cancelled'], default: 'draft'),
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Project Requirements Model
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Project),
  notes: String (max: 2000),
  files: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Milestone Model
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Project),
  title: String (required, min: 3, max: 100),
  deliverable: String (required, min: 5, max: 500),
  deadline: Date (required),
  amount: Number (required, min: 0),
  status: String (enum: ['pending', 'in-progress', 'completed', 'overdue'], default: 'pending'),
  order: Number (required),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Client Information Model
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: Project),
  name: String (required, min: 2, max: 100),
  email: String (required, format: email),
  company: String (max: 100),
  country: String (required, min: 2, max: 100),
  phone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Onboarding Progress Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  projectId: ObjectId (ref: Project),
  currentStep: Number (0-5),
  isCompleted: Boolean (default: false),
  completedSteps: [Number],
  lastUpdated: Date,
  createdAt: Date
}
```

## API Endpoints

### Base URL: `/api/onboarding`

### 1. Start New Onboarding
**POST** `/api/onboarding/start`

**Request Body:**
```json
{
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "string",
    "currentStep": 0,
    "message": "Onboarding started successfully"
  }
}
```

### 2. Save Project Details (Step 1)
**POST** `/api/onboarding/project`

**Request Body:**
```json
{
  "projectId": "string",
  "title": "string",
  "description": "string",
  "category": "web-development",
  "deadline": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "category": "string",
      "deadline": "2025-12-31T00:00:00.000Z"
    },
    "nextStep": 1
  }
}
```

### 3. Save Requirements & Upload Files (Step 2)
**POST** `/api/onboarding/requirements`

**Request Body (Form Data):**
```
projectId: string
notes: string
files: File[] (multiple files allowed)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requirements": {
      "_id": "string",
      "notes": "string",
      "files": [
        {
          "filename": "string",
          "originalName": "string",
          "mimetype": "string",
          "size": 12345,
          "url": "string"
        }
      ]
    },
    "nextStep": 2
  }
}
```

### 4. Save Milestones (Step 3)
**POST** `/api/onboarding/milestones`

**Request Body:**
```json
{
  "projectId": "string",
  "milestones": [
    {
      "title": "string",
      "deliverable": "string",
      "deadline": "2025-10-15",
      "amount": 1500.00
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "milestones": [
      {
        "_id": "string",
        "title": "string",
        "deliverable": "string",
        "deadline": "2025-10-15T00:00:00.000Z",
        "amount": 1500.00,
        "status": "pending",
        "order": 0
      }
    ],
    "nextStep": 3
  }
}
```

### 5. Save Client Information (Step 4)
**POST** `/api/onboarding/client`

**Request Body:**
```json
{
  "projectId": "string",
  "name": "string",
  "email": "client@example.com",
  "company": "string",
  "country": "string",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client": {
      "_id": "string",
      "name": "string",
      "email": "client@example.com",
      "company": "string",
      "country": "string",
      "phone": "+1234567890"
    },
    "nextStep": 4
  }
}
```

### 6. Review & Finalize (Step 5)
**POST** `/api/onboarding/review`

**Request Body:**
```json
{
  "projectId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project": { /* full project object */ },
    "requirements": { /* full requirements object */ },
    "milestones": [ /* full milestones array */ ],
    "client": { /* full client object */ },
    "nextStep": 5
  }
}
```

### 7. Complete Onboarding (Step 6)
**POST** `/api/onboarding/complete`

**Request Body:**
```json
{
  "projectId": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Onboarding completed successfully",
    "project": {
      "_id": "string",
      "status": "active"
    }
  }
}
```

### 8. Get Onboarding Progress
**GET** `/api/onboarding/progress/:userId`

**Response:**
```json
{
  "success": true,
  "data": {
    "currentStep": 2,
    "isCompleted": false,
    "completedSteps": [0, 1],
    "lastUpdated": "2025-09-14T10:30:00.000Z"
  }
}
```

### 9. Get Onboarding Data
**GET** `/api/onboarding/:projectId`

**Response:**
```json
{
  "success": true,
  "data": {
    "project": { /* full project object */ },
    "requirements": { /* full requirements object */ },
    "milestones": [ /* full milestones array */ ],
    "client": { /* full client object */ },
    "progress": {
      "currentStep": 3,
      "isCompleted": false
    }
  }
}
```

### 10. Update Onboarding Step
**PUT** `/api/onboarding/step`

**Request Body:**
```json
{
  "userId": "string",
  "projectId": "string",
  "step": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Step updated successfully",
    "currentStep": 2
  }
}
```

## File Upload Specifications

### Supported File Types
- Documents: `.pdf`, `.doc`, `.docx`, `.txt`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Spreadsheets: `.xls`, `.xlsx`
- Presentations: `.ppt`, `.pptx`
- Archives: `.zip`, `.rar`

### File Size Limits
- Individual files: 10MB maximum
- Total upload per project: 50MB maximum
- Maximum files per project: 20

### File Storage
- Use cloud storage (AWS S3, Google Cloud Storage, or similar)
- Generate secure, unique filenames
- Store file metadata in database
- Implement file access controls

## Validation Rules

### Project Validation
- Title: Required, 3-100 characters
- Description: Required, 10-1000 characters
- Category: Must be from predefined list
- Deadline: Must be future date

### Milestone Validation
- Title: Required, 3-100 characters
- Deliverable: Required, 5-500 characters
- Deadline: Must be future date
- Amount: Must be positive number

### Client Validation
- Name: Required, 2-100 characters
- Email: Required, valid email format
- Country: Required, 2-100 characters

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "title",
      "message": "Title is required"
    }
  }
}
```

### Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: User not authorized
- `FILE_UPLOAD_ERROR`: File upload failed
- `DATABASE_ERROR`: Database operation failed
- `STEP_OUT_OF_ORDER`: Attempting to access step out of sequence

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own onboarding data
3. **File Security**: Implement file type validation and virus scanning
4. **Rate Limiting**: Implement rate limiting on file uploads
5. **Data Sanitization**: Sanitize all user inputs
6. **CORS**: Configure appropriate CORS policies

## Implementation Notes

1. Use transactions for multi-step operations
2. Implement proper indexing on frequently queried fields
3. Set up monitoring and logging for all API calls
4. Implement backup and recovery procedures
5. Consider implementing real-time progress updates using WebSockets
6. Add comprehensive testing for all endpoints
7. Implement proper error tracking and alerting

## Sample Implementation (Node.js/Express)

```javascript
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');

const app = express();

// Models
const Project = require('./models/Project');
const Requirement = require('./models/Requirement');
const Milestone = require('./models/Milestone');
const Client = require('./models/Client');
const OnboardingProgress = require('./models/OnboardingProgress');

// Middleware
app.use(express.json());
app.use('/api/onboarding', authenticateToken);

// Routes
app.post('/api/onboarding/start', startOnboarding);
app.post('/api/onboarding/project', saveProjectDetails);
app.post('/api/onboarding/requirements', uploadFiles, saveRequirements);
app.post('/api/onboarding/milestones', saveMilestones);
app.post('/api/onboarding/client', saveClientInfo);
app.post('/api/onboarding/complete', completeOnboarding);
app.get('/api/onboarding/progress/:userId', getProgress);
app.get('/api/onboarding/:projectId', getOnboardingData);

module.exports = app;
```</content>
<parameter name="filePath">c:\Users\LENOVO\Desktop\HotelBuzz\HotelBuzz-BookingEngine\Techsol\ONBOARDING_API_DOCS.md
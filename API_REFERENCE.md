# API Reference

This document provides detailed specifications for all available API endpoints in the TechSol Backend.

## Base URL
- **Local Development**: `http://localhost:5000`
- **Production**: Your deployed URL (e.g., Vercel)

## Authentication
Most endpoints require JWT authentication. Include the token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Health Check

### GET /
Check if the server is running.

**Request:**
- **Method**: GET
- **Headers**: None
- **Body**: None

**Response:**
- **Success (200)**:
  ```json
  {
    "message": "Server is running",
    "timestamp": "2025-09-14T18:00:00.000Z"
  }
  ```

---

## 2. User Signup

### POST /api/auth/signup
Register a new user account.

**Request:**
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

**Response:**
- **Success (201)**:
  ```json
  {
    "message": "User created",
    "user": {
      "id": 1,
      "username": "string"
    }
  }
  ```
- **Error (400)**:
  ```json
  {
    "error": "Username already exists"
  }
  ```
- **Error (500)**:
  ```json
  {
    "error": "Internal Server Error"
  }
  ```

---

## 3. User Login

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request:**
- **Method**: POST
- **Headers**:
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

**Response:**
- **Success (200)**:
  ```json
  {
    "token": "jwt_token_string"
  }
  ```
- **Error (400)**:
  ```json
  {
    "error": "Invalid credentials"
  }
  ```
- **Error (500)**:
  ```json
  {
    "error": "Internal Server Error"
  }
  ```

---

## 4. Get User Profile

### GET /api/protected/profile
Retrieve the authenticated user's profile information.

**Request:**
- **Method**: GET
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Body**: None

**Response:**
- **Success (200)**:
  ```json
  {
    "message": "This is a protected route",
    "user": {
      "id": 1,
      "username": "string"
    }
  }
  ```
- **Error (401)**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **Error (500)**:
  ```json
  {
    "error": "Internal Server Error"
  }
  ```

---

## 5. Check Authentication

### GET /api/protected/check-auth
Verify if the provided token is valid.

**Request:**
- **Method**: GET
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
- **Body**: None

**Response:**
- **Success (200)**:
  ```json
  {
    "valid": true,
    "user": {
      "id": 1,
      "username": "string"
    }
  }
  ```
- **Error (401)**:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **Error (500)**:
  ```json
  {
    "error": "Internal Server Error"
  }
  ```

---

## Error Response Format
All error responses follow this structure:
```json
{
  "error": "Error message string"
}
```

## Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **500**: Internal Server Error

## Notes
- All requests should use JSON content type where applicable
- JWT tokens expire after 1 hour
- CORS is enabled for configured origins
- Database operations are handled asynchronously
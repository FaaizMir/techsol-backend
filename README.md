# TechSol Backend

A professional Node.js/Express backend API built with MVC architecture, following best practices for scalability, maintainability, and deployment readiness.

## Features

- **MVC Architecture**: Separated Models, Views (API responses), Controllers for clean code organization
- **Authentication**: JWT-based auth with signup/login
- **Database**: MySQL with Sequelize ORM
- **Error Handling**: Global error middleware
- **Logging**: Custom logger for debugging
- **CORS**: Configured for frontend integration
- **Deployment Ready**: Compatible with Vercel (serverless) and local development

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/FaaizMir/techsol-backend.git
   cd techsol-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.development` and update with your database credentials
   - For local MySQL: Use DB_HOST=localhost, DB_NAME=ahmad, DB_PASS= (empty), etc.

4. Ensure MySQL is running locally or update `.env.development` for remote DB.

## Database Management

The project uses Sequelize ORM with CLI for migrations and seeders.

### Install Sequelize CLI (if not already installed globally)
```bash
npm install -g sequelize-cli
```

### Available Commands
- **Create Migration**: `npx sequelize-cli migration:generate --name create-users`
- **Run Migrations**: `npm run db:migrate`
- **Undo Last Migration**: `npm run db:migrate:undo`
- **Create Seeder**: `npx sequelize-cli seed:generate --name seed-users`
- **Run Seeders**: `npm run db:seed`
- **Undo Seeders**: `npm run db:seed:undo`

### Migration Example
1. Generate migration: `npx sequelize-cli migration:generate --name add-email-to-users`
2. Edit the generated file in `migrations/`
3. Run: `npm run db:migrate`

## Running the Server

### Local Development
```bash
npm run dev
```
This starts the server on `http://localhost:5000` with database sync.

### Production
```bash
npm start
```
For Vercel deployment, push to repo.

## API Documentation

Base URL: `http://localhost:5000` (local) or your Vercel URL.

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "User created",
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

#### POST /api/auth/login
Login and get JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_token_here"
}
```

### Protected Endpoints
Require `Authorization: Bearer <token>` header.

#### GET /api/protected/profile
Get user profile.

**Response:**
```json
{
  "message": "This is a protected route",
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

#### GET /api/protected/check-auth
Check if token is valid.

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

### Health Check

#### GET /
Check server status.

**Response:**
```json
{
  "message": "Server is running",
  "timestamp": "2025-09-14T18:00:00.000Z"
}
```

## Frontend Integration Guide

### 1. Base URL
Set your frontend's API base URL:
```javascript
const API_BASE = 'http://localhost:5000'; // or your production URL
```

### 2. Authentication Flow
- **Signup/Login**: Send POST requests to `/api/auth/signup` or `/api/auth/login`
- **Store Token**: Save the JWT token in localStorage or secure storage
- **Include Token**: For protected routes, add header:
  ```javascript
  headers: {
    'Authorization': `Bearer ${token}`
  }
  ```

### 3. Example Frontend Code (JavaScript)

#### Signup
```javascript
async function signup(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    console.log('User created:', data.user);
  } else {
    console.error('Error:', data.error);
  }
}
```

#### Login
```javascript
async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.token);
    console.log('Logged in');
  } else {
    console.error('Error:', data.error);
  }
}
```

#### Protected Request
```javascript
async function getProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}/api/protected/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  if (response.ok) {
    console.log('Profile:', data.user);
  } else {
    console.error('Error:', data.error);
  }
}
```

### 4. Error Handling
- Check `response.ok` for success
- Handle 400/500 errors with user-friendly messages
- For 401 (Unauthorized), redirect to login

### 5. CORS
The backend allows requests from `http://localhost:3000` and `https://techsol-five.vercel.app`. Update `config/index.js` if needed.

## Project Structure

```
techsol-backend/
├── api/index.js          # Vercel entry point
├── server.js             # Local server
├── config/
│   ├── database.js       # DB config
│   └── index.js          # App config
├── controllers/          # Business logic
├── middleware/           # Auth & error handling
├── models/               # Sequelize models
├── routes/               # API routes
├── migrations/           # DB migrations
├── seeders/              # DB seeders
├── utils/                # Helpers (logger)
├── .env.development      # Environment vars
├── .sequelizerc          # Sequelize CLI config
├── package.json          # Dependencies & scripts
├── vercel.json           # Vercel config
└── README.md             # This file
```

## Deployment

### Vercel
1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms
- Ensure `NODE_ENV=production`
- Use `npm start` for production server

## Contributing

1. Follow MVC pattern
2. Add tests for new features
3. Update README for API changes
4. Never commit `.env` files - use `.env.example` as template

## License

ISC
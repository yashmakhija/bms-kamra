# BMS API

The backend API server for the Book My Show (BMS) application. This API provides a complete authentication system with multiple login methods, user profile management, and secure endpoints for booking tickets.

## Features

- **Multi-method Authentication**
  - Email/Password registration and login
  - Google OAuth integration
  - Phone OTP verification via Twilio
- **User Management**
  - Profile retrieval and updates
  - Secure password changing
  - Account deletion with cascading data cleanup
- **Security**
  - JWT-based authentication
  - Request validation and sanitization
  - Secure password hashing via bcrypt
- **Clean Architecture**
  - Controller-Service-Repository pattern
  - Middleware for auth, validation, and error handling
  - TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js v18 or higher
- pnpm v9.0.0 or higher
- PostgreSQL database (or Neon.tech account)

### Environment Setup

1. Copy the `.env.example` file to `.env`
2. Fill in the required environment variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET` and `JWT_EXPIRES_IN`: JWT configuration
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`: Twilio credentials for SMS OTP

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Push database schema changes (if needed)
pnpm db:push

# Run database seed (optional)
pnpm db:seed

# Start development server
pnpm dev
```

## API Documentation

The API server runs on port 3091 by default.

### Authentication Endpoints

#### Register User

- **URL**: `/api/auth/register`
- **Method**: POST
- **Body**:
  ```json
  {
    "name": "Test User",
    "email": "testuser@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: User object with authentication token

#### Login

- **URL**: `/api/auth/login`
- **Method**: POST
- **Body**:
  ```json
  {
    "email": "testuser@example.com",
    "password": "Password123!"
  }
  ```
- **Response**: User object with authentication token

#### Google Login

- **URL**: `/api/auth/google`
- **Method**: POST
- **Body**:
  ```json
  {
    "idToken": "GOOGLE_ID_TOKEN"
  }
  ```
- **Response**: User object with authentication token
- **Note**: Automatically creates a new account if the email doesn't exist

#### Request Phone OTP

- **URL**: `/api/auth/phone/request-otp`
- **Method**: POST
- **Body**:
  ```json
  {
    "phone": "+919876543210"
  }
  ```
- **Response**: Success message with OTP code (in development)

#### Verify Phone OTP

- **URL**: `/api/auth/phone/verify-otp`
- **Method**: POST
- **Body**:
  ```json
  {
    "phone": "+919876543210",
    "code": "123456"
  }
  ```
- **Response**: User object with authentication token

### User Endpoints

All user endpoints require authentication via Bearer token.

#### Get Current User

- **URL**: `/api/users/me`
- **Method**: GET
- **Headers**:
  - Authorization: `Bearer YOUR_JWT_TOKEN`
- **Response**: Complete user profile information

#### Update Profile

- **URL**: `/api/users/profile`
- **Method**: PUT
- **Headers**:
  - Authorization: `Bearer YOUR_JWT_TOKEN`
- **Body**:
  ```json
  {
    "name": "Updated Name",
    "image": "https://example.com/profile.jpg"
  }
  ```
- **Response**: Updated user profile

#### Change Password

- **URL**: `/api/users/change-password`
- **Method**: POST
- **Headers**:
  - Authorization: `Bearer YOUR_JWT_TOKEN`
- **Body**:
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Response**: Success message

#### Delete Account

- **URL**: `/api/users/account`
- **Method**: DELETE
- **Headers**:
  - Authorization: `Bearer YOUR_JWT_TOKEN`
- **Body**:
  ```json
  {
    "password": "Password123!"
  }
  ```
- **Response**: Success message

### Health Check

- **URL**: `/api/health`
- **Method**: GET
- **Response**: API status

## Project Structure

```
src/
├── config/           # Configuration settings
├── controllers/      # Request handlers
├── middlewares/      # Auth, validation and error handling
├── routes/           # API routes definition
├── services/         # Business logic
├── types/            # TypeScript type definitions
├── utils/            # Helper functions
└── index.ts          # Entry point
```

## Testing with Postman

A Postman collection is included in the project for easy testing:

1. Import the `postman_collection.json` file into Postman
2. Create an environment with a variable `base_url` set to `http://localhost:3091/api`
3. The collection is configured to automatically save auth tokens from login responses

## Development Notes

- In development mode, OTP codes are returned in the API response for testing
- JWT tokens expire after 7 days by default
- For Twilio SMS to work properly, verify phone numbers in the Twilio console or upgrade from a trial account
- API logs all database queries in development mode for debugging

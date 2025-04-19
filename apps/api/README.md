# Book My Show API

The backend API service for the Kunal Kamra (BMS) application, providing endpoints for venue, show, booking management, user authentication, and payment processing.

## Features

- **Authentication & Authorization**

  - JWT-based authentication
  - Role-based access control (SUPER_ADMIN, EDITOR, USER)
  - Multiple authentication methods (email/password, Google OAuth, phone OTP)

- **Core Functionality**

  - Venue management
  - Show and event management
  - Booking and ticketing system
  - User profile management
  - Payment processing with Razorpay

- **Production-Ready Features**
  - Redis-based caching for high performance
  - Distributed locking for concurrent operations
  - Rate limiting to prevent abuse
  - Request logging and monitoring
  - Background job processing with Redis queues
  - Comprehensive error handling

## Tech Stack

- **Core**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis/IORedis
- **Queue System**: BullMQ
- **Authentication**: JWT, bcrypt, Google OAuth, Twilio for SMS
- **Payment Gateway**: Razorpay
- **Logging**: Winston
- **Security**: Helmet, CORS, Express Rate Limit
- **Others**: Compression, HTTP Status Codes

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Redis (for caching and queues)
- pnpm package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and update the configuration
4. Start the development server:
   ```bash
   pnpm dev
   ```

## Environment Variables

See `.env.example` for a list of required environment variables. Key configurations include:

- **Server**: `PORT`, `NODE_ENV`, `BASE_URL`
- **Authentication**: `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Database**: `DATABASE_URL`
- **Redis**: `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_CLUSTER_ENABLED`, etc.
- **Rate Limiting**: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- **Logging**: `LOG_LEVEL`
- **External Services**: Google OAuth and Twilio credentials
- **Razorpay**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`

## API Structure

The API follows a structured approach:

- **Routes**: Define API endpoints and middleware
- **Controllers**: Handle request/response logic
- **Services**: Implement business logic and database operations
- **Middlewares**: Handle cross-cutting concerns (auth, validation, caching)
- **Utils**: Utility functions and helpers

## Caching Strategy

The API uses Redis for caching with the following strategies:

- **Public Data Caching**: Venues, shows, categories cached with TTL (1-24 hours)
- **User Data Caching**: User profiles and bookings cached with short TTL (5 minutes)
- **Seat Availability**: Near real-time caching with very short TTL (1 minute)

Cache invalidation is handled automatically when data is modified.

## Rate Limiting

Multiple rate limiting strategies are implemented:

- **General API Rate Limit**: 100 requests per minute per IP
- **Authentication Endpoints**: 30 requests per 15 minutes per IP
- **Public Endpoints**: 200 requests per minute per IP

## Background Processing

The API uses Redis-backed queues for:

- **Email Sending**: Transactional emails for bookings, account changes
- **Notifications**: User notifications for various events
- **Reports**: Generation of administrative reports
- **Booking Cleanup**: Automatic cleanup of expired/unpaid bookings

## Monitoring and Logging

- **Request Logging**: All API requests are logged with request ID, method, path, timing
- **Error Logging**: Structured error logging with context
- **Performance Tracking**: Slow responses are flagged

## Deployment

The API is designed for deployment in containerized environments:

- Graceful shutdown handling
- Health check endpoint at `/health`
- Configurable via environment variables

## License

This project is licensed under the ISC License.

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

#### Verify Authentication

- **URL**: `/api/auth/verify`
- **Method**: GET
- **Headers**:
  - Authorization: `Bearer YOUR_JWT_TOKEN`
- **Response**:
  ```json
  {
    "authenticated": true,
    "user": {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "image": "https://example.com/profile.jpg",
      "isAdmin": false
    }
  }
  ```
- **Error Response**: Returns 401 Unauthorized if the token is invalid or missing
- **Note**: This endpoint is useful for frontend protected routes to verify authentication status

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

## Payment Processing

The API uses Razorpay for processing payments with the following features:

- Secure payment processing
- Order creation and validation
- Payment verification with cryptographic signatures
- Webhook processing for payment confirmations
- Automatic ticket status updates on successful payment

### Razorpay Integration

To use Razorpay:

1. Create a Razorpay account and obtain API keys
2. Set environment variables:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```
3. Configure webhook URL in Razorpay dashboard to point to:
   ```
   https://your-api-domain.com/api/razorpay/webhook
   ```

### Payment Endpoints

#### Create Razorpay Order

- **URL**: `/api/razorpay/orders/:bookingId`
- **Method**: POST
- **Authentication**: Required
- **Response**:
  ```json
  {
    "orderId": "order_12345abcdef",
    "amount": 100000,
    "currency": "INR",
    "keyId": "rzp_test_your_key_id"
  }
  ```

#### Verify Razorpay Payment

- **URL**: `/api/razorpay/verify/:bookingId`
- **Method**: POST
- **Authentication**: Required
- **Body**:
  ```json
  {
    "razorpayPaymentId": "pay_12345abcdef",
    "razorpayOrderId": "order_12345abcdef",
    "razorpaySignature": "generated_signature_from_razorpay"
  }
  ```
- **Response**: Booking object with updated payment status

#### Razorpay Webhook (Server-to-Server)

- **URL**: `/api/razorpay/webhook`
- **Method**: POST
- **Headers**: `x-razorpay-signature` (provided by Razorpay)
- **Body**: Webhook payload from Razorpay
- **Response**: Success message

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

# Kunal-BMS (Book My Show Clone)

A comprehensive monorepo containing a full-stack Book My Show clone application with a Next.js frontend and Express.js API backend.

## Project Overview

This project is a modern ticket booking platform similar to BookMyShow, featuring:

- Show/movie browsing and discovery
- Real-time seat selection and booking
- Secure payment processing
- User authentication with multiple methods
- Admin dashboard for content management

## Tech Stack

### Frontend

- Next.js 14 with App Router
- React Server Components
- TypeScript
- Tailwind CSS & Shadcn UI
- Zustand for state management

### Backend

- Express.js with TypeScript
- PostgreSQL with Prisma ORM
- Redis for caching, queues and locks
- JWT authentication
- BullMQ for background jobs

### Infrastructure

- Turborepo for monorepo management
- PNPM workspace

## Applications & Packages

- `apps/web`: Main Next.js customer-facing application
- `apps/api`: Express.js backend API
- `apps/admin`: Admin dashboard (Next.js)
- `packages/database`: Shared database schema and Prisma client
- `packages/ui`: Shared UI components
- `packages/eslint-config`: ESLint configuration
- `packages/typescript-config`: TypeScript configuration

## Backend Architecture & Implementation

The backend (`apps/api`) is the core of the application, handling all business logic, data persistence, and integration with external services.

### Authentication System

- **Multiple Auth Methods**:

  - Email/password with bcrypt encryption
  - Google OAuth integration
  - Phone OTP via Twilio SMS
  - JWT token-based sessions

- **Role-Based Access Control**:
  - User roles: SUPER_ADMIN, EDITOR, USER
  - Middleware-based permission checks
  - Protected routes for administrative functions

### Core Business Logic

#### Venue Management

- Complete CRUD operations for venues
- Location-based filtering and search
- Support for complex seating arrangements
- Analytics for venue performance

#### Show & Event Management

- Multi-level categorization (Standup Show)
- Flexible showtime scheduling
- Dynamic pricing models
- Media management (posters, trailers)

#### Ticketing System

- Real-time seat availability tracking
- Distributed locking for concurrent bookings
- Transaction-safe booking process
- Automatic expiration of unpaid bookings
- E-ticket generation with QR codes

#### Payment Processing

- Integration with payment gateways
- Secure payment flow
- Refund processing
- Receipt generation

### Performance Optimizations

#### Redis Caching System

- **Multi-Level Caching**:

  - Long-term caching (24h) for static data like categories
  - Medium-term caching (1-2h) for venues and shows
  - Short-term caching (1m) for seat availability
  - Request-based caching for API responses

- **Cache Invalidation**:
  - Pattern-based invalidation for related resources
  - Automatic invalidation on data mutations
  - User-specific cache namespacing

#### Distributed Locking

- Redis-based distributed locking mechanism
- Prevents race conditions during concurrent bookings
- Lock acquisition with timeouts to prevent deadlocks
- Used in combination with database transactions

#### Job Queue System

- Background processing with BullMQ
- Dedicated queues for different job types:
  - Email notifications
  - SMS delivery
  - Report generation
  - Booking cleanup
- Retry strategies with exponential backoff
- Concurrency control
- Dead letter queues for failed jobs

### API Security & Reliability

#### Rate Limiting

- Redis-backed rate limiting
- Tiered limits based on endpoint sensitivity:
  - Stricter limits for auth endpoints (30 req/15min)
  - Standard limits for general API (100 req/min)
  - Higher limits for public endpoints (200 req/min)
- Custom key generation based on user/IP

#### Error Handling

- Comprehensive error middleware
- Structured error responses
- Error logging with context
- Client-safe error messages

#### Monitoring & Logging

- Request/response logging
- Performance tracking
- Structured logging format
- Error alerting for critical issues

## API Documentation

Detailed API documentation can be found in the [API README](apps/api/README.md).

### Key Endpoints

#### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/google` - Login with Google
- `POST /api/auth/phone/request-otp` - Request phone OTP
- `POST /api/auth/phone/verify-otp` - Verify phone OTP

#### User Management

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `DELETE /api/users/account` - Delete account

#### Venues

- `GET /api/venues` - List all venues
- `GET /api/venues/:id` - Get venue details
- `POST /api/venues` - Create a venue (admin)
- `PUT /api/venues/:id` - Update venue (admin)
- `DELETE /api/venues/:id` - Delete venue (admin)

#### Shows & Events

- `GET /api/shows` - List all shows
- `GET /api/shows/:id` - Get show details
- `POST /api/shows` - Create a show (admin)
- `PUT /api/shows/:id` - Update show (admin)
- `DELETE /api/shows/:id` - Delete show (admin)
- `GET /api/shows/:id/showtimes` - Get showtimes for a show

#### Bookings

- `GET /api/bookings` - List user's bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create a booking
- `PUT /api/bookings/:id/pay` - Mark booking as paid
- `DELETE /api/bookings/:id` - Cancel a booking

## Development Setup

### Prerequisites

- Node.js v18+
- PostgreSQL
- Redis
- PNPM

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/kunal-bms.git
cd kunal-bms
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

4. Start development servers

```bash
pnpm dev
```

## Building for Production

```bash
pnpm build
```

## Additional Resources

- [API Documentation](apps/api/README.md)
- [Frontend Documentation](apps/web/README.md)
- [Database Schema](packages/database/README.md)

## License

This project is licensed under the ISC License.

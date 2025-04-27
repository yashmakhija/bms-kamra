# Kunal Kamra API: Complete Architecture & Technical Guide

## System Overview

The Kunal Kamra API is a scalable, high-performance backend powering the entire ticketing platform. Built with TypeScript and Node.js, it handles event management, ticket sales, payment processing, and user authentication with enterprise-grade reliability.

## Tech Stack

### Core Technologies

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (strictly typed)
- **Framework**: Express.js with middleware architecture
- **API Style**: RESTful with JSON

### Database & Data Access

- **Primary Database**: PostgreSQL (v14+)
- **ORM**: Prisma with type-safe queries
- **Migrations**: Prisma Migrate for version-controlled schema changes
- **Connection Pooling**: PgBouncer for high-concurrency handling

### Caching & Performance

- **Cache Store**: Redis
- **Caching Strategy**: Multi-level with invalidation patterns
- **Queue System**: Bull.js backed by Redis
- **Rate Limiting**: Redis-based token bucket algorithm

### Infrastructure Components

- **Containerization**: Docker
- **Orchestration**: Kubernetes-ready
- **Logging**: Winston with structured JSON logs
- **Monitoring**: Prometheus metrics and Grafana dashboards

### External Integrations

- **Payment Gateway**: Razorpay
- **Communication**: Twilio for SMS OTP
- **Authentication**: Google OAuth, JWT

## Architecture Design

### Layered Structure

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer (Routes)                    │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 Controllers (Request/Response)           │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                 Services (Business Logic)                │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                Data Access Layer (Prisma)                │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                   PostgreSQL Database                    │
└─────────────────────────────────────────────────────────┘
```

### Cross-Cutting Concerns

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────┐  │
│  │ Logging │    │  Auth   │    │ Error   │    │ Rate │  │
│  │         │    │         │    │ Handling│    │ Limit│  │
│  └─────────┘    └─────────┘    └─────────┘    └──────┘  │
│                                                         │
│              Middleware Pipeline                        │
└─────────────────────────────────────────────────────────┘
```

## Key Components

### Security & Authentication System

The API implements a comprehensive security system:

1. **Authentication Flow**:

   - JWT-based token authentication with refresh token rotation
   - Password hashing with bcrypt and per-user salt
   - Phone OTP verification via Twilio
   - Social login with Google OAuth

2. **Authorization System**:

   - Role-based access control (RBAC) with three tiers:
     - `SUPER_ADMIN`: Complete system access
     - `EDITOR`: Content management
     - `USER`: Regular permissions
   - Resource-based permissions (users can only access their own data)
   - Fine-grained admin capabilities controlled through role system

3. **Request Security**:
   - CORS protection with whitelisted origins
   - CSRF token protection for session-based endpoints
   - Comprehensive input validation with express-validator
   - Protection against common attacks (XSS, injection)

### Database Schema & Models

The database uses a relational structure with optimized relationships:

```
┌──────────┐     ┌──────────┐     ┌───────────┐
│  Users   │     │  Venues  │     │ Categories │
└────┬─────┘     └────┬─────┘     └─────┬─────┘
     │                │                 │
     │                ▼                 │
┌────▼─────┐     ┌──────────┐     ┌─────▼─────┐
│  Admin   │     │  Shows   │◄────┤PriceTiers │
└──────────┘     └────┬─────┘     └───────────┘
                      │
                      ▼
┌──────────┐     ┌──────────┐     ┌───────────┐
│ Bookings │◄────┤  Events  │     │ TicketLock │
└────┬─────┘     └────┬─────┘     └─────┬─────┘
     │                │                 │
     │                ▼                 │
     │           ┌──────────┐          │
     │           │Showtimes │          │
     │           └────┬─────┘          │
     │                │                │
     │                ▼                │
     │          ┌───────────┐         │
     │          │SeatSection│         │
     │          └─────┬─────┘         │
     │                │               │
     └───────────┐    ▼    ┌──────────┘
                 │┌──────┐│
                 └┤Ticket◄┘
                  └──────┘
```

1. **Core Entities**:

   - `User`: Stores user profiles, authentication details
   - `Venue`: Physical locations with capacity information
   - `Show`: Main event with metadata, images, pricing
   - `Event`: Date-specific instance of a show
   - `Showtime`: Specific time slot for an event
   - `SeatSection`: Physical seating area with capacity
   - `Ticket`: Individual units for sale with status tracking
   - `Booking`: Reserved or completed purchase of tickets

2. **Key Relationships**:
   - Shows occur at Venues (many-to-one)
   - Events belong to Shows (many-to-one)
   - Showtimes belong to Events (many-to-one)
   - SeatSections belong to Showtimes (many-to-one)
   - Tickets belong to SeatSections (many-to-one)
   - Bookings contain multiple Tickets (many-to-many)
   - Users own Bookings (one-to-many)

### Concurrency & Race Condition Handling

The API employs a sophisticated system to prevent double-booking and handle high concurrency:

1. **Ticket Locking Mechanism**:

   - Two-phase locking strategy:
     1. Temporary hold (15 minutes) during checkout
     2. Permanent status change after payment
   - Explicit `TicketLock` model with expiration timestamps
   - Background jobs to release expired locks automatically

2. **Database-Level Protection**:

   - Transaction isolation levels (SERIALIZABLE for critical operations)
   - Optimistic concurrency control with version columns
   - Row-level locking for critical resources

3. **Distributed Locking**:

   - Redis-based locks for cross-server consistency
   - Lock acquisition with retry strategies
   - Atomic lock operations with expiration

4. **Example Ticket Reservation Flow**:

```typescript
// Atomic ticket reservation within a transaction
await prisma.$transaction(async (tx) => {
  // Find available tickets with FOR UPDATE locking
  const availableTickets = await tx.ticket.findMany({
    where: {
      sectionId,
      status: "AVAILABLE",
    },
    take: quantity,
    // This locks the rows until transaction completes
    ...forUpdate(),
  });

  if (availableTickets.length < quantity) {
    throw new AppError("Not enough tickets available", 400);
  }

  const ticketIds = availableTickets.map((t) => t.id);

  // Lock tickets
  await tx.ticket.updateMany({
    where: { id: { in: ticketIds } },
    data: { status: "LOCKED" },
  });

  // Create explicit locks with expiration
  await tx.ticketLock.createMany({
    data: ticketIds.map((id) => ({
      ticketId: id,
      userId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })),
  });

  return ticketIds;
});
```

5. **Background Lock Management**:
   - Worker processes scan for expired locks every minute
   - Automatic ticket status rollback for abandoned carts
   - Transaction-based lock cleanup to prevent partial state

### Payment Processing System

The payment system integrates with Razorpay through a type-safe singleton client:

1. **Client Architecture**:

   - Singleton pattern for consistent configuration
   - Interface-based communication with Razorpay API
   - Error handling with custom AppError types

2. **Payment Flow**:

   - Order creation with idempotency guarantees
   - Client-side checkout integration
   - Server-side verification with cryptographic signature checking
   - Webhook handling for asynchronous updates

3. **Refund Handling**:

   - Comprehensive refund processing with audit trail
   - Dedicated database fields for refund tracking
   - Automatic ticket status updates
   - Notification system for refund status

4. **Razorpay Client Implementation**:

```typescript
// Singleton client pattern
class RazorpayClient {
  private static instance: RazorpayClient;
  private client: Razorpay;

  private constructor() {
    // Initialize with configuration
  }

  public static getInstance(): RazorpayClient {
    if (!RazorpayClient.instance) {
      RazorpayClient.instance = new RazorpayClient();
    }
    return RazorpayClient.instance;
  }

  // Type-safe methods for Razorpay operations
  public async createOrder(options): Promise<RazorpayOrder> {
    // Implementation
  }

  public verifyPayment(orderId, paymentId, signature): boolean {
    // Implementation
  }

  public async refundPayment(paymentId, options): Promise<RazorpayRefund> {
    // Implementation
  }
}
```

### Caching Strategy

The API implements a sophisticated multi-level caching strategy:

1. **Cache Hierarchy**:

   - Memory cache for ultra-fast lookups (node-cache)
   - Redis for distributed caching (cross-server consistency)
   - Database as the source of truth

2. **TTL (Time To Live) Strategy**:

   - Public content (venues, shows): 10 minutes
   - User-specific data: 5 minutes
   - Seat availability: 30 seconds
   - Different TTLs based on data volatility

3. **Cache Invalidation Patterns**:

   - Key-based invalidation for direct updates
   - Pattern-based invalidation for related entities
   - Automatic TTL expiration for less critical data

4. **Example Cache Implementation**:

```typescript
// Multi-level cache with Redis and in-memory
export async function getCache<T>(key: string): Promise<T | null> {
  // Try memory cache first (fastest)
  const memoryResult = memoryCache.get<T>(key);
  if (memoryResult) {
    return memoryResult;
  }

  // Try Redis cache next
  const redisResult = await redisClient.get(key);
  if (redisResult) {
    // Populate memory cache for future requests
    const parsed = JSON.parse(redisResult);
    memoryCache.set(key, parsed, 60); // 1 minute in memory
    return parsed;
  }

  return null;
}

export async function setCache<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  // Set in Redis
  await redisClient.set(key, JSON.stringify(data), "EX", ttlSeconds);

  // Also set in memory cache with shorter TTL
  memoryCache.set(key, data, Math.min(ttlSeconds, 60));
}

export async function invalidateCache(key: string): Promise<void> {
  // Remove from both caches
  memoryCache.del(key);
  await redisClient.del(key);
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  // Get all matching keys
  const keys = await redisClient.keys(pattern);

  // Delete from Redis
  if (keys.length > 0) {
    await redisClient.del(keys);
  }

  // Also clear memory cache (simplified)
  memoryCache.flushAll();
}
```

### Background Job Processing

The API uses Bull.js for reliable asynchronous processing:

1. **Queue Structure**:

   - `bookingQueue`: Handle booking lifecycle events
   - `paymentQueue`: Process payments and refunds
   - `notificationQueue`: Send emails, SMS, and notifications
   - `maintenanceQueue`: Handle system tasks like cleanup

2. **Worker Architecture**:

   - Separate worker processes for each queue
   - Retry logic with exponential backoff
   - Dead letter queues for failed jobs
   - Error handling and monitoring

3. **Example Queue Implementation**:

```typescript
// Payment queue processing
paymentQueue.process("verify-payment", async (job: Job) => {
  const { bookingId, paymentId, paymentMethod, paymentData } = job.data;

  try {
    // 1. Get booking details
    const booking = await getBookingById(bookingId);

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // 2. Verify payment with Razorpay
    const razorpay = RazorpayClient.getInstance();
    const isVerified = await razorpay.verifyPayment(
      paymentData.orderId,
      paymentId,
      paymentData.signature
    );

    if (!isVerified) {
      throw new AppError("Payment verification failed", 400);
    }

    // 3. Update booking status
    await updateBookingStatus(bookingId, "PAID");

    // 4. Add notification job
    await notificationQueue.add("send-booking-confirmation", {
      bookingId,
      userId: booking.userId,
    });

    return { success: true };
  } catch (error) {
    // Log error and rethrow for retry mechanism
    logger.error(`Payment verification failed: ${error.message}`);
    throw error;
  }
});
```

### Error Handling Strategy

The API implements a centralized error handling approach:

1. **Error Hierarchy**:

   - Base `AppError` class with HTTP status codes
   - Specialized error types (AuthError, ValidationError, etc.)
   - Consistent error response format

2. **Global Error Handler**:

   - Central middleware for catching all errors
   - Error transformation to API-friendly format
   - Detailed logging with context preservation

3. **Example Implementation**:

```typescript
// Base error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Already an AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
    });
  }

  // Database errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma errors
    // ...
  }

  // Default error response
  const statusCode = 500;
  logger.error(`Unhandled error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  return res.status(statusCode).json({
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};
```

## API Design Patterns

### RESTful Resource Structure

1. **Consistent Resource URLs**:

   - `/api/venues` - Venue collection
   - `/api/venues/:id` - Specific venue
   - `/api/shows` - Show collection
   - `/api/shows/:id` - Specific show
   - `/api/bookings` - User's bookings
   - `/api/bookings/:id` - Specific booking

2. **HTTP Methods**:

   - `GET`: Retrieve resources
   - `POST`: Create resources
   - `PUT`/`PATCH`: Update resources
   - `DELETE`: Remove resources

3. **Query Parameters**:
   - Pagination: `?page=1&limit=10`
   - Filtering: `?status=active&category=concert`
   - Sorting: `?sort=date:desc`
   - Field selection: `?fields=id,name,date`

### Request Validation

All incoming data is validated using express-validator middleware:

```typescript
// Example validation chain
export const createShowValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("venueId")
    .notEmpty()
    .withMessage("Venue ID is required")
    .isUUID()
    .withMessage("Invalid venue ID format"),

  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isInt({ min: 10, max: 300 })
    .withMessage("Duration must be between 10 and 300 minutes"),

  // Validate the entire request
  validateRequest,
];
```

## Optimizations for Scale

### Database Optimization

1. **Index Strategy**:

   - Strategic indexes on frequently queried columns
   - Composite indexes for common query patterns
   - JSONB indexes for flexible data

2. **Query Optimization**:

   - Optimized SQL generation with Prisma
   - Batch operations for bulk updates
   - Pagination for large result sets
   - Selective field retrieval

3. **Connection Management**:
   - Connection pooling with PgBouncer
   - Separate read/write pools for scaling
   - Transaction isolation level tuning

### Horizontal Scaling

The API is designed for horizontal scaling:

1. **Stateless Architecture**:

   - No local state (all state in Redis/Database)
   - Session data stored in Redis
   - Load balancer ready

2. **Resource Utilization**:

   - Worker processes for CPU-intensive tasks
   - Connection pool sizing based on available resources
   - Memory limits for Node.js processes

3. **Microservices Readiness**:
   - Clean separation of concerns
   - Domain-driven design principles
   - Event-based communication patterns

## Deployment Architecture

The API is deployed using a containerized approach:

```
┌────────────────────┐  ┌────────────────────┐
│   Load Balancer    │  │   API Gateway      │
└──────────┬─────────┘  └──────────┬─────────┘
           │                       │
┌──────────▼───────────────────────▼─────────┐
│                                            │
│  ┌────────────────┐    ┌────────────────┐  │
│  │  API Servers   │    │  API Servers   │  │
│  │    (Pod 1)     │    │    (Pod N)     │  │
│  └────────┬───────┘    └────────┬───────┘  │
│           │                     │          │
└───────────┼─────────────────────┼──────────┘
            │                     │
┌───────────▼─────────────────────▼──────────┐
│                                            │
│  ┌────────────────┐    ┌────────────────┐  │
│  │ Worker Servers │    │ Worker Servers │  │
│  │    (Pod 1)     │    │    (Pod N)     │  │
│  └────────────────┘    └────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
            │                     │
┌───────────▼─────────┐ ┌─────────▼───────────┐
│      Redis          │ │      PostgreSQL     │
│   (Cluster Mode)    │ │      (Primary)      │
└─────────────────────┘ └─────────────┬───────┘
                                      │
                        ┌─────────────▼───────┐
                        │     PostgreSQL      │
                        │       (Read         │
                        │      Replicas)      │
                        └─────────────────────┘
```

1. **Container Strategy**:

   - Multi-stage Docker builds for smaller images
   - Separate containers for API and workers
   - Health checks for container orchestration

2. **Kubernetes Components**:

   - Deployments for API and worker processes
   - Services for internal communication
   - Ingress for external access
   - ConfigMaps and Secrets for configuration

3. **Scalability Rules**:
   - Horizontal pod autoscaling based on CPU/memory
   - Separate scaling for API and worker pods
   - Database connection pool sizing based on pod count

## Development Workflow

### Local Development

Local setup is streamlined for developer productivity:

1. **Environment Setup**:

   - Docker Compose for local dependencies
   - Environment variable management with dotenv
   - Local development database with sample data

2. **Development Workflow**:

   - Hot reloading with nodemon
   - Type checking with TypeScript
   - Linting with ESLint
   - Testing with Jest

3. **Command Reference**:

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with local configuration

# Start database and Redis
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Start development server
pnpm dev

# Run tests
pnpm test
```

## Conclusion

The Kunal Kamra API is built with scalability, performance, and developer experience in mind. Its layered architecture, comprehensive security measures, and sophisticated concurrency handling make it a robust foundation for high-traffic ticketing operations.

This architecture successfully handles:

- Thousands of concurrent users
- Millions of tickets
- Peak booking periods
- Real-time inventory management
- Secure payment processing

The modular design ensures maintainability while allowing the system to evolve as requirements change.

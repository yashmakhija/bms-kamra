# Book My Show API

The backend API service for the Kunal Kamra (BMS) application, providing a comprehensive platform for venue management, show ticketing, secure payments, and user experience.

## Core System Architecture

The API follows a robust layered architecture:

- **API Layer**: Express routes and controllers handling HTTP requests/responses
- **Service Layer**: Business logic isolated from transport protocols
- **Data Access Layer**: Prisma ORM with transaction support and optimized queries
- **Infrastructure Layer**: Caching, queuing, and external service integrations

## Key Features

### Authentication & Authorization

- **Multi-factor Authentication**:

  - JWT-based authentication with refresh token rotation
  - Social login (Google OAuth) with account linking
  - Phone number verification via OTP
  - Session management with device tracking

- **Advanced Authorization**:
  - Role-based access control (SUPER_ADMIN, EDITOR, USER)
  - Resource-based permissions with ownership checks
  - Fine-grained access control for admin operations

### Event & Venue Management

- **Venue System**:

  - Complete venue information management
  - Seating arrangement configuration
  - Capacity management with dynamic availability
  - Venue-specific settings and rules

- **Show Management**:
  - Hierarchical structure: Shows → Events → Showtimes
  - Configurable price tiers with category mapping
  - Custom seating sections with allocated capacities
  - Show metadata and promotional content management

### Booking & Ticketing

- **Reservation System**:

  - Secure ticket reservation with anti-double booking
  - Distributed locking for concurrent booking attempts
  - Ticket status lifecycle management (AVAILABLE → RESERVED → SOLD/CANCELED)
  - Time-limited booking holds with automatic expiration

- **Ticket Management**:
  - Multi-ticket purchase in single transaction
  - Order history and ticket retrieval
  - Cancellation with automatic inventory update
  - Admin override capabilities for special cases

### Payment Processing

- **Razorpay Integration**:

  - Singleton client pattern for consistent API interaction
  - Type-safe payment processing with proper interfaces
  - Secure payment flow with order creation and verification
  - Cryptographic signature validation for transactions
  - Webhook processing for automated payment status updates
  - Payment metadata and tracking for reconciliation
  - Comprehensive refund processing with full audit trail

- **Transaction Safety**:
  - Atomic database transactions for payment-related operations
  - Idempotent API design to prevent duplicate payments
  - Consistent error handling with appropriate status codes
  - Comprehensive logging for audit trails

### Performance Optimization

- **Multi-level Caching**:

  - Redis-based caching with optimized TTL strategies
  - Public data caching (venues, shows) with short TTLs (1-10 minutes)
  - User data caching (profile, bookings) with shorter TTLs (5 minutes)
  - Near real-time seat availability with very short TTLs (30 seconds)
  - Automatic cache invalidation for data consistency

- **Concurrency Control**:
  - Redis-based distributed locking mechanism
  - Lock acquisition with configurable retry strategies
  - Transaction isolation levels for database operations
  - Rate limiting to manage API load and prevent abuse

### Resilience & Reliability

- **Error Handling**:

  - Centralized error management with typed error classes
  - Consistent error responses with appropriate HTTP status codes
  - Detailed error logging with contextual information
  - Graceful degradation for non-critical service failures

- **State Management**:
  - Transactional state changes to ensure data consistency
  - Automated cleanup of stale/abandoned bookings
  - Background processing for non-critical operations
  - Idempotent API design for safe retries

## Technical Architecture

### Database Schema

The database schema is designed for performance and integrity:

- **Core Entities**: Users, Venues, Shows, Events, Showtimes, Tickets, Bookings
- **Supporting Entities**: Categories, PriceTiers, SeatSections, PaymentRecords
- **Booking Entity**: Enhanced with dedicated refund fields (refundId, refundDate, refundReason, refundedBy) for comprehensive payment lifecycle management
- **Relationship Optimization**: Strategic use of indexes and foreign keys
- **Data Integrity**: Transaction-based operations for related data
- **Enums as Constants**: BookingStatus, PaymentMethod, and other enums are exported as constant values for consistent usage across the application

### Caching Strategy

The API implements a sophisticated caching approach:

- **Cache Hierarchy**:

  - L1: In-memory application cache for ultra-fast lookups
  - L2: Redis-based distributed cache for cross-instance consistency
  - L3: Database with query optimization

- **Invalidation Patterns**:

  - Event-driven cache invalidation on data mutations
  - Time-based expiration with strategic TTLs
  - Targeted invalidation to minimize cache thrashing
  - Pattern-based invalidation for related entity groups

- **Show Creation Flow**:
  When creating shows and related entities, the system uses:
  - Short TTLs (1 minute) to ensure data freshness
  - Targeted invalidation when updating entities
  - Global invalidation for consistent user experience

### Concurrency Management

The system handles high concurrency through:

- **Ticket Reservation**:

  - Atomic ticket status updates with optimistic locking
  - Distributed Redis locks for cross-server consistency
  - Transaction isolation to prevent race conditions
  - Retry mechanisms with exponential backoff

- **Inventory Management**:
  - Real-time seat availability tracking
  - Pessimistic locking for critical inventory operations
  - Ticket status lifecycle enforcement
  - Automatic inventory release for abandoned bookings

### Security Measures

- **Data Protection**:

  - Password hashing with bcrypt and salt rotation
  - PII (Personally Identifiable Information) handling per regulations
  - HTTPS enforcement with proper CORS configuration
  - Input sanitization against injection attacks

- **API Security**:
  - JWT with appropriate expiration and refresh strategy
  - Rate limiting with IP and user-based throttling
  - CSRF protection for browser-based clients
  - Request validation middleware for all endpoints

## API Integration

### Authentication Flow

The API supports multiple authentication methods:

1. **Email/Password**: Traditional login with secure password handling
2. **Google OAuth**: Social login with automatic account creation/linking
3. **Phone OTP**: Mobile number verification with time-limited codes

Authentication tokens (JWT) provide access to protected resources and include:

- User identity (ID, name, email)
- Role information for authorization
- Token expiration and issuance metadata

### Core Endpoints

#### User Management

- `/api/auth/*`: Authentication endpoints for all login methods
- `/api/users/*`: User profile management, preferences, and history

#### Content Management

- `/api/venues/*`: Venue creation, management, and discovery
- `/api/shows/*`: Show listings, details, and management
- `/api/events/*`: Event scheduling and configuration
- `/api/showtimes/*`: Specific showtime detail and availability

#### Booking Flow

- `/api/seat-sections/*`: Seat availability and section information
- `/api/bookings/*`: Booking creation, retrieval, and management
- `/api/razorpay/*`: Payment processing endpoints

#### Admin Operations

- `/api/admin/*`: Administrative functions for content and user management
- `/api/stats/*`: System statistics and reporting

### Razorpay Integration

The payment flow integrates Razorpay securely using our singleton client implementation:

1. **Order Creation**:

   - Client requests order for a booking
   - Server creates Razorpay order and returns details
   - Order linked to booking with pending status

2. **Payment Processing**:

   - Client completes payment using Razorpay checkout
   - Server verifies payment signature cryptographically
   - Booking status updated based on verification

3. **Webhook Handling**:

   - Razorpay sends webhook notifications for payment events
   - Server validates webhook signature for security
   - Payment status processed asynchronously for reliability
   - Booking and ticket statuses updated accordingly

4. **Refund Processing**:
   - Admin initiates refund through dashboard
   - Server processes refund through Razorpay API using our dedicated Razorpay client
   - Booking updated with refund details (refundId, refundDate, refundReason, refundedBy)
   - Tickets are automatically released back to inventory
   - Notifications sent to user about refund status

## Development & Deployment

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- pnpm package manager

### Environment Configuration

The API requires several environment variables for proper operation:

- **Server**: `PORT`, `NODE_ENV`, `BASE_URL`, `CORS_ORIGIN`
- **Authentication**: `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_TOKEN_SECRET`
- **Database**: `DATABASE_URL`, `DATABASE_POOL_SIZE`
- **Redis**: `REDIS_URL`, `REDIS_PASSWORD`, `REDIS_CLUSTER_ENABLED`
- **External Services**: Google OAuth, Twilio, and Razorpay credentials

See `.env.example` for the complete list of required variables.

### Local Development

```bash
# Install dependencies
pnpm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Production Deployment

The API is designed for containerized deployment:

- Docker-based deployment with multi-stage builds
- Kubernetes-ready with health checks and graceful shutdown
- Stateless architecture for horizontal scaling
- Environment variable configuration for different environments

## Performance Considerations

### Optimization Strategies

The API implements several optimization strategies:

- **Query Optimization**: Strategic use of indexes and query planning
- **Connection Pooling**: Database connection reuse for performance
- **Batch Processing**: Batch operations for multiple records
- **Compression**: HTTP response compression for bandwidth optimization
- **Selective Field Retrieval**: Only retrieve required fields from database

### Scaling Approach

The architecture supports horizontal scaling:

- Stateless design for load balancer compatibility
- Redis for distributed caching and locking
- Database connection pooling for high throughput
- Background job processing for CPU-intensive tasks

## Monitoring & Operations

### Logging Strategy

Comprehensive logging for operational visibility:

- **Request Logging**: All API requests with correlation IDs
- **Error Logging**: Detailed error tracking with stack traces
- **Performance Logging**: Slow query and response time tracking
- **Audit Logging**: Critical operations for security and compliance
- **Payment Logging**: Detailed payment and refund transaction logs

### Health Monitoring

- `/health`: System health endpoint with component status
- Database connectivity checks
- Redis service availability monitoring
- External service dependency status

## Testing

The codebase includes:

- Unit tests for core business logic
- Integration tests for API endpoints
- Load tests for performance verification

## Admin Features

The API provides specialized endpoints for administrative operations:

- Content management for shows, venues, and events
- User management with role assignment
- Manual booking operations (creation, modification, cancellation)
- Payment management including refund processing with detailed tracking
- System statistics and reporting

## Future Enhancements

Areas identified for future development:

- Enhanced analytics and reporting capabilities
- Additional payment gateway integrations
- Advanced seat selection visualization support
- Waitlist functionality for sold-out shows
- Notification system for booking updates and promotions

## Updated Postman Collection

A complete Postman collection is now available for testing all the API endpoints. This collection includes:

- Authentication endpoints (register, login, verify)
- User management
- Admin features and analytics
- Show and event management
- Booking and payment processing
- Razorpay integration

### How to Use

1. Import the collection into Postman:

   - Open Postman
   - Click "Import" in the top left
   - Select the `updated_postman_collection.json` file

2. Set up your environment:

   - Create a new environment in Postman
   - Set the `baseUrl` variable to your API URL (default: `http://localhost:3091/api`)
   - Other variables will be automatically populated as you use the collection

3. Testing flow:
   - Start with the "Health Check" request to verify the API is running
   - Register a user or login with existing credentials
   - Create venues, categories, shows, events, and showtimes as an admin
   - Test booking flow as a regular user
   - Test payment processing

The collection includes test scripts that automatically save IDs and tokens to your Postman environment, making it easy to run through the entire testing sequence.

## License

This project is licensed under the ISC License.

## Contact

For questions or support, please contact the github.com/YashMakhija.

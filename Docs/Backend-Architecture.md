# Backend Architecture Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Concurrency Handling](#concurrency-handling)
4. [Race Conditions and Booking Management](#race-conditions-and-booking-management)
5. [Performance Optimizations](#performance-optimizations)
6. [Scalability Approach](#scalability-approach)
7. [Failure Handling](#failure-handling)

## Overview

The Kunal-BMS backend is designed to support millions of concurrent users, particularly during high-demand events like movie premieres or concert ticket sales. This document outlines how the system architecture handles concurrency, prevents race conditions, and manages the critical issue of double bookings.

## System Architecture

### Core Components

1. **API Layer**

   - Node.js/Express application
   - Horizontally scalable behind a load balancer
   - Stateless design for easy scaling

2. **Data Layer**

   - Primary PostgreSQL database (via Prisma ORM)
   - Redis for caching and distributed locking
   - Message queue for asynchronous processing

3. **Service Structure**
   - Modular services with clear separation of concerns
   - Core services: Venues, Shows, Bookings, Users, Authentication

### Request Flow

```
Client → Load Balancer → API Gateway → Rate Limiting → Auth Middleware → Service Handler → Database
                                                                                         ↑
                                                                                         ↓
                                                                                      Cache Layer
```

## Concurrency Handling

### Distributed Rate Limiting

We implement multi-layered rate limiting to protect the system from being overwhelmed:

1. **IP-based limiting** - Protects against basic brute force attacks
2. **User-based limiting** - Prevents individual users from making too many requests
3. **Endpoint-specific limiting** - More strict limits on critical endpoints like booking

```typescript
// Rate limiting middleware configured with Redis for distributed applications
const bookingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // 10 requests per minute for booking endpoints
  standardHeaders: true, // Return rate limit info in headers
  store: redisStore, // Redis-based store for distributed environments
  keyGenerator: (req) => {
    // Custom key generator using user ID when available
    const userId = req.user?.id || "anonymous";
    return `booking:${userId}:${req.ip}`;
  },
});
```

### Connection Pooling

Database connections are managed through a pool to optimize resource usage:

```typescript
// Sample database connection pool settings
const pool = {
  min: 5, // Minimum connections in pool
  max: 50, // Maximum connections during high load
  idle: 10000, // How long a connection can remain idle (10s)
  acquire: 60000, // Maximum time to get a connection (60s)
  evict: 60000, // Run cleanup every 60s
};
```

## Race Conditions and Booking Management

### The Double Booking Problem

During high-traffic events (movie premieres, popular concerts), thousands of users may attempt to book the same seats simultaneously, creating race conditions where multiple transactions could process the same seats before the database reflects their unavailability.

### Solution: Pessimistic Concurrency Control

We implement a multi-layered approach to prevent double bookings:

#### 1. Distributed Locking with Redis

Before attempting to reserve seats, we acquire a distributed lock on the specific seats:

```typescript
// Pseudocode for Redis-based seat locking
async function lockSeats(sectionId, seatCount, userId) {
  const lockKey = `lock:section:${sectionId}`;

  // Try to acquire lock with expiration (15 seconds)
  const acquired = await redisClient.set(
    lockKey,
    userId,
    "NX", // Only set if key doesn't exist
    "PX", // Set expiration in milliseconds
    15000 // 15 second expiration
  );

  return acquired === "OK";
}
```

#### 2. Database Transactions

All booking operations are wrapped in database transactions with proper isolation levels:

```typescript
// Transaction with SERIALIZABLE isolation level
export const createBooking = async (data) => {
  return prisma.$transaction(
    async (tx) => {
      // 1. Verify seat availability within transaction
      const section = await tx.seatSection.findUnique({
        where: { id: data.sectionId },
      });

      if (section.availableSeats < data.quantity) {
        throw new Error("Not enough seats available");
      }

      // 2. Lock the specific seats
      const availableSeats = await tx.seat.findMany({
        where: {
          sectionId: data.sectionId,
          status: "AVAILABLE",
        },
        take: data.quantity,
        orderBy: { seatNumber: "asc" },
        forUpdate: true, // SQL FOR UPDATE lock
      });

      // 3. Create booking and update seats atomically
      // ... booking creation logic ...

      return booking;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.SERIALIZABLE,
      timeout: 10000, // 10 second transaction timeout
    }
  );
};
```

#### 3. Two-Phase Booking Process

To handle high concurrency, we implement a two-phase booking process:

1. **Temporary Reservation Phase**

   - User selects seats
   - System locks seats temporarily (with expiration)
   - Frontend shows countdown timer

2. **Confirmation Phase**
   - User provides payment info
   - System confirms booking only if lock still valid
   - Seats released automatically if timer expires

### Inventory Management

We maintain an eventually consistent inventory through:

1. **Realtime counters** in Redis for available seats
2. **Periodic reconciliation** between Redis and database
3. **Cleanup job** for expired temporary reservations

```typescript
// Example of Redis-based available seat counter update
async function updateAvailableSeatCount(sectionId, change) {
  const counterKey = `section:${sectionId}:availableCount`;
  await redisClient.incrby(counterKey, change);
}
```

## Performance Optimizations

### Caching Strategy

1. **Multi-level caching**:

   - In-memory cache for request-level data
   - Redis for distributed caching across instances
   - CDN for static assets

2. **Cache categories**:

   - Show details - High caching (1 hour)
   - Available seat counts - Short cache with invalidation (30 seconds)
   - User profile data - Medium cache (10 minutes)

3. **Cache invalidation**:
   - Event-based invalidation
   - Time-based expiration
   - Versioned cache keys

### Connection Optimization

1. **HTTP/2 support** for multiplexed connections
2. **Keepalive connections** to databases and Redis
3. **Connection pooling** at all levels

## Scalability Approach

### Horizontal Scaling

1. **API Tier Scaling**

   - Auto-scaling based on CPU/memory usage
   - Containerized microservices in Kubernetes
   - Blue/green deployment for zero downtime

2. **Database Scaling**
   - Read replicas for heavy read operations
   - Sharding strategy for user data (by user ID)
   - Eventual consistency for non-critical data

### Vertical Scaling For Critical Components

1. **Primary Database**

   - High-performance instances
   - Optimized for write operations
   - Regular performance tuning

2. **Redis Cluster**
   - Memory-optimized instances
   - Clustered deployment for distributed locking
   - Persistence enabled for crash recovery

## Failure Handling

### Graceful Degradation

During extreme load or partial system failure:

1. **Circuit breaker pattern** to prevent cascading failures
2. **Queue throttling** for less critical operations
3. **Feature toggles** to disable non-essential features

### Recovery Procedures

1. **Automated reconciliation jobs** to fix inconsistencies
2. **Expiring locks** to prevent deadlocks
3. **Transaction monitoring** to identify and fix stuck bookings

### Error Response Strategy

1. **User-friendly error messages** with appropriate HTTP status codes
2. **Retry-After headers** for rate limiting
3. **Idempotent API design** for safe retries

## High Availability Considerations

1. **Multi-region deployment** for disaster recovery
2. **Database failover** with automated leader election
3. **Redis sentinel** for Redis high availability
4. **Load balancer health checks** to route away from failing instances

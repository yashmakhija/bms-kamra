# BMS Database - Ticket Booking System

## Overview

This package contains the database schema for the BMS (BookMyShow-style) ticket booking platform. The system is designed to handle high-scale ticket sales for events, shows, and performances with millions of concurrent users while preventing race conditions and double bookings.

## Key Features

- **Admin Management**: Role-based access control (SUPER_ADMIN and EDITOR roles)
- **Show & Event Management**: Hierarchical structure for venues, shows, events, and showtimes
- **Category & Pricing**: Flexible pricing tiers based on category types (VIP, PREMIUM, REGULAR, ECONOMY)
- **Ticket Booking System**: Complete flow from reservation to payment confirmation
- **Race Condition Prevention**: Optimistic locking mechanism to prevent double bookings
- **Scalable Architecture**: Designed for high-volume concurrent transactions

## Data Model

### User Authentication & Authorization

- **User**: Core user entity with authentication details and profile information
- **Account**: Integration with OAuth providers (Google, etc.)
- **Session**: User session management
- **OtpCode**: Phone number verification via OTP
- **Admin**: Administrative access with role-based permissions (SUPER_ADMIN, EDITOR)

### Venue & Show Management

- **Venue**: Physical locations where shows are performed
- **Show**: Live entertainment events with core details (title, description, duration, etc.)
- **Category**: Classification of seats by type (VIP, PREMIUM, REGULAR, ECONOMY)
- **PriceTier**: Pricing structure connecting shows and categories with capacity and pricing
- **Event**: Specific date when a show is performed
- **Showtime**: Specific time slots for an event

### Seating & Ticket Management

- **SeatSection**: Groups of seats with the same category and pricing for a specific showtime
- **Ticket**: Individual tickets with status tracking (AVAILABLE, LOCKED, RESERVED, SOLD, CANCELED)
- **TicketLock**: Temporary reservations to prevent race conditions
- **Booking**: Order management with payment tracking (PENDING, PAID, EXPIRED, CANCELED, REFUNDED)

## Race Condition Prevention

The system prevents double bookings through a sophisticated locking mechanism:

1. When a user selects a ticket, it's temporarily locked for a set duration (e.g., 10 minutes)
2. The TicketLock entry tracks the reservation with an expiration timestamp
3. If payment is completed before expiration, the ticket becomes SOLD
4. If the lock expires without payment, the ticket is automatically returned to the available pool
5. Database indexes ensure high-performance queries for lock checking and cleanup

## Workflow Example

### Ticket Booking Flow

1. User browses available shows and selects a specific showtime
2. User chooses ticket category (VIP, REGULAR, etc.) and quantity
3. System locks selected tickets and creates a pending booking
4. User completes payment within the time limit (e.g., 10 minutes)
5. On successful payment, booking status changes to PAID and tickets to SOLD
6. If payment time expires, locks are released and tickets become available again

### Category Management Flow

1. Admins create categories with specified types (VIP, PREMIUM, REGULAR, ECONOMY)
2. Categories are linked to shows via price tiers that define capacity and pricing
3. SeatSections are created for each showtime using the price tier information
4. Tickets are generated based on seat section capacity with appropriate pricing

### Admin Management Flow

1. Two admin roles manage the system:
   - SUPER_ADMIN: Full access to all operations including deletion of resources
   - EDITOR: Can create and update most resources but with limited deletion rights
2. Admins create and manage venues, shows, categories, events, and showtimes
3. Pricing tiers are configured to connect shows with categories and define seat capacity

## Implementation Guidelines

For high-scale production deployment:

1. Use database transactions for all ticket locking operations
2. Implement a scheduled job to clear expired locks (every 1-5 minutes)
3. Cache available seat counts in Redis to reduce database load
4. Use a queue system for payment processing and lock management
5. Horizontally scale the API layer to handle concurrent requests
6. Implement rate limiting for high-traffic endpoints
7. Monitor lock table size and performance under load

## Database Indexes

Critical indexes for performance:

- Ticket status (for quickly finding available tickets)
- TicketLock expiration time (for cleanup jobs)
- Booking status and expiration (for payment processing)

## Future Enhancements

- Waitlist functionality for sold-out events
- Dynamic pricing based on demand
- Group booking with shared locks
- Reserved seating with seat map visualization
- Loyalty program integration

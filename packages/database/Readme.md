# BMS Database - Ticket Booking System

## Overview

This package contains the database schema for the BMS (BookMyShow-style) ticket booking platform. The system is designed to handle high-scale ticket sales for events, shows, and performances with millions of concurrent users while preventing race conditions and double bookings.

## Key Features

- **Admin Management**: Role-based access control for platform administrators
- **Show & Event Management**: Hierarchical structure for venues, shows, events, and showtimes
- **Ticket Booking System**: Complete flow from reservation to payment confirmation
- **Race Condition Prevention**: Optimistic locking mechanism to prevent double bookings
- **Scalable Architecture**: Designed for high-volume concurrent transactions

## Data Model

### User Authentication & Authorization

- **User**: Core user entity with authentication details and profile information
- **Account**: Integration with OAuth providers (Google, etc.)
- **Session**: User session management
- **OtpCode**: Phone number verification via OTP
- **Admin**: Administrative access with role-based permissions

### Venue & Show Management

- **Venue**: Physical locations where shows are performed
- **Show**: Standup Comediyan Shows with their core details
- **Category**: Classification of show types (VIP, PREMIUM, REGULAR, ECONOMY)
- **Event**: Specific date when a show is performed
- **Showtime**: Specific time slots for an event

### Seating & Ticket Management

- **SeatSection**: Groups of seats with the same category and pricing
- **Ticket**: Individual tickets with status tracking and pricing
- **TicketLock**: Temporary reservations to prevent race conditions
- **Booking**: Order management with payment tracking

## Race Condition Prevention

The system prevents double bookings through a sophisticated locking mechanism:

1. When a user selects a ticket, it's temporarily locked for a set duration (e.g., 10 minutes)
2. The TicketLock entry tracks the reservation with an expiration timestamp
3. If payment is completed before expiration, the ticket becomes SOLD
4. If the lock expires without payment, the ticket is automatically returned to the available pool
5. Database indexes ensure high-performance queries for lock checking and cleanup

This approach ensures that even with millions of concurrent users, no ticket can be sold more than once, while still providing a fair "first come, first served" experience.

## Workflow Example

### Ticket Booking Flow

1. User browses available shows and selects a specific showtime
2. User chooses ticket category (VIP, REGULAR, etc.) and quantity
3. System locks selected tickets and creates a pending booking
4. User completes payment within the time limit (e.g., 10 minutes)
5. On successful payment, booking status changes to PAID and tickets to SOLD
6. If payment time expires, locks are released and tickets become available again

### Admin Management Flow

1. Admins create and manage venues
2. Admins create shows with details (title, description, images)
3. For each show, admins create events (specific dates)
4. For each event, admins create showtimes
5. For each showtime, admins define seat sections with capacity and pricing
6. System automatically generates available tickets based on seating capacity

## Implementation Guidelines

For high-scale production deployment:

1. Use database transactions for all ticket locking operations
2. Implement a scheduled job to clear expired locks (every 1-5 minutes)
3. Cache available seat counts in Redis to reduce database load
4. Use a queue system for payment processing and lock management
5. Horizontally scale the API layer to handle concurrent requests
6. Monitor lock table size and performance under load

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

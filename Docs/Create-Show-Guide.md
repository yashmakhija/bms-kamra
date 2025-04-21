# Complete Guide to Creating Shows

This document provides a step-by-step guide to creating and managing shows in the booking system, including all API endpoints needed for the entire process.

## Overview

The show creation process follows this hierarchy:

```
Venue → Show → Event → Showtime → Price Tier → Seat Section → Tickets
```

Each level has specific API routes and data requirements. This guide will walk you through the entire process.

## 1. Create a Venue

First, you need a venue where the show will take place.

### API Route

```
POST /api/venues
```

### Required Permissions

- Admin role (SUPER_ADMIN or EDITOR)

### Request Body

```json
{
  "name": "Indira Gandhi Stadium",
  "address": "IP Estate, New Delhi",
  "city": "New Delhi",
  "country": "India",
  "capacity": 14000,
  "description": "Popular indoor stadium for major events",
  "imageUrl": "https://example.com/indira-gandhi-stadium.jpg"
}
```

### Response

```json
{
  "id": "venue_id123",
  "name": "Indira Gandhi Stadium",
  "address": "IP Estate, New Delhi",
  "city": "New Delhi",
  "country": "India",
  "capacity": 14000,
  "description": "Popular indoor stadium for major events",
  "imageUrl": "https://example.com/indira-gandhi-stadium.jpg",
  "isActive": true,
  "createdAt": "2023-05-12T12:00:00Z",
  "updatedAt": "2023-05-12T12:00:00Z"
}
```

## 2. Create a Show

Once you have a venue, you can create a show.

### API Route

```
POST /api/shows
```

### Required Permissions

- Admin role (SUPER_ADMIN or EDITOR)

### Request Body

```json
{
  "title": "Kunal Kamra Live",
  "subtitle": "Comedy Tour 2023",
  "description": "Join Kunal Kamra for an evening of hilarious stand-up comedy",
  "venueId": "venue_id123",
  "duration": 120,
  "ageLimit": "18+",
  "language": "English/Hindi",
  "imageUrl": "https://example.com/kunal-kamra-show.jpg",
  "thumbnailUrl": "https://example.com/kunal-kamra-thumb.jpg"
}
```

### Response

```json
{
  "id": "show_id456",
  "title": "Kunal Kamra Live",
  "subtitle": "Comedy Tour 2023",
  "description": "Join Kunal Kamra for an evening of hilarious stand-up comedy",
  "venueId": "venue_id123",
  "venue": {
    "id": "venue_id123",
    "name": "Indira Gandhi Stadium",
    "city": "New Delhi"
  },
  "duration": 120,
  "ageLimit": "18+",
  "language": "English/Hindi",
  "imageUrl": "https://example.com/kunal-kamra-show.jpg",
  "thumbnailUrl": "https://example.com/kunal-kamra-thumb.jpg",
  "isActive": true,
  "createdAt": "2023-05-12T12:15:00Z",
  "updatedAt": "2023-05-12T12:15:00Z"
}
```

## 3. Create an Event

An event represents a specific date for the show.

### API Route

```
POST /api/shows/{showId}/events
```

### Required Permissions

- Admin role (SUPER_ADMIN or EDITOR)

### Request Body

```json
{
  "date": "2023-06-15"
}
```

### Response

```json
{
  "id": "event_id789",
  "date": "2023-06-15T00:00:00Z",
  "showId": "show_id456",
  "isActive": true,
  "createdAt": "2023-05-12T12:30:00Z",
  "updatedAt": "2023-05-12T12:30:00Z"
}
```

## 4. Create a Showtime

A showtime represents a specific time slot for an event.

### API Route

```
POST /api/events/{eventId}/showtimes
```

### Required Permissions

- Admin role (SUPER_ADMIN or EDITOR)

### Request Body

```json
{
  "startTime": "2023-06-15T19:00:00Z",
  "endTime": "2023-06-15T21:00:00Z"
}
```

### Response

```json
{
  "id": "showtime_id101",
  "startTime": "2023-06-15T19:00:00Z",
  "endTime": "2023-06-15T21:00:00Z",
  "eventId": "event_id789",
  "isActive": true,
  "createdAt": "2023-05-12T12:45:00Z",
  "updatedAt": "2023-05-12T12:45:00Z"
}
```

## 5. Create Price Tiers

Price tiers define the pricing structure for different categories of seats.

> **Note**: Our system uses three fixed categories (VIP, PREMIUM, REGULAR). You don't create new categories; instead, you specify the category type when creating price tiers.

### API Route

```
POST /api/price-tiers
```

### Required Permissions

- Admin role (SUPER_ADMIN or EDITOR)

### Request Body

```json
{
  "showId": "show_id456",
  "categoryType": "VIP",
  "capacity": 200,
  "price": 5000,
  "currency": "INR",
  "description": "Premium seats with best view and complimentary refreshments"
}
```

### Create multiple price tiers (one for each category)

Repeat the above request with different category types:

```json
{
  "showId": "show_id456",
  "categoryType": "PREMIUM",
  "capacity": 800,
  "price": 3000,
  "currency": "INR",
  "description": "Great seats with excellent view"
}
```

```json
{
  "showId": "show_id456",
  "categoryType": "REGULAR",
  "capacity": 1000,
  "price": 1500,
  "currency": "INR",
  "description": "Standard seating"
}
```

### Response (for each request)

```json
{
  "id": "price_tier_id202",
  "capacity": 200,
  "price": 5000,
  "currency": "INR",
  "description": "Premium seats with best view and complimentary refreshments",
  "showId": "show_id456",
  "categoryId": "category_id_vip",
  "category": {
    "id": "category_id_vip",
    "name": "VIP",
    "type": "VIP"
  },
  "isActive": true,
  "createdAt": "2023-05-12T13:00:00Z",
  "updatedAt": "2023-05-12T13:00:00Z"
}
```

## 6. Create Seat Sections

Seat sections connect showtimes with price tiers and define available seating.

### API Route

```
POST /api/seat-sections
```

### Required Permissions

- Admin role (SUPER_ADMIN or EDITOR)

### Request Body

```json
{
  "name": "VIP Front Row",
  "showtimeId": "showtime_id101",
  "priceTierId": "price_tier_id202",
  "availableSeats": 200
}
```

### Create multiple seat sections for different price tiers and the same showtime

```json
{
  "name": "Premium Center",
  "showtimeId": "showtime_id101",
  "priceTierId": "price_tier_id203", // PREMIUM price tier
  "availableSeats": 800
}
```

```json
{
  "name": "Regular Seating",
  "showtimeId": "showtime_id101",
  "priceTierId": "price_tier_id204", // REGULAR price tier
  "availableSeats": 1000
}
```

### Response (for each request)

```json
{
  "id": "seat_section_id303",
  "name": "VIP Front Row",
  "showtimeId": "showtime_id101",
  "priceTierId": "price_tier_id202",
  "availableSeats": 200,
  "isActive": true,
  "createdAt": "2023-05-12T13:15:00Z",
  "updatedAt": "2023-05-12T13:15:00Z"
}
```

## 7. Tickets

Tickets are automatically generated for seat sections. You don't need to create them manually. When a booking is made, tickets from the relevant seat section are reserved.

## Complete Example Flow

1. Create a Venue
2. Create a Show at the Venue
3. Create an Event (date) for the Show
4. Create a Showtime for the Event
5. Create Price Tiers for the Show (VIP, PREMIUM, REGULAR)
6. Create Seat Sections for each Price Tier and Showtime
7. The system automatically generates tickets for each Seat Section

## API Routes Summary

| Step | API Route                         | Method | Description                                        |
| ---- | --------------------------------- | ------ | -------------------------------------------------- |
| 1    | `/api/venues`                     | POST   | Create a venue                                     |
| 2    | `/api/shows`                      | POST   | Create a show                                      |
| 3    | `/api/shows/{showId}/events`      | POST   | Create an event for a show                         |
| 4    | `/api/events/{eventId}/showtimes` | POST   | Create a showtime for an event                     |
| 5    | `/api/price-tiers`                | POST   | Create price tiers for a show                      |
| 6    | `/api/seat-sections`              | POST   | Create seat sections for showtimes and price tiers |

## Retrieving Data

### Get all shows

```
GET /api/shows
```

### Get show details with events

```
GET /api/shows/{showId}
```

### Get events for a show

```
GET /api/shows/{showId}/events
```

### Get showtimes for an event

```
GET /api/events/{eventId}/showtimes
```

### Get price tiers for a show

```
GET /api/shows/{showId}/price-tiers
```

### Get seat sections for a showtime

```
GET /api/showtimes/{showtimeId}/seat-sections
```

## Special Considerations

1. **Categories**: Remember that the system uses fixed categories (VIP, PREMIUM, REGULAR). You don't create new categories for each show.

2. **Tickets and Bookings**: Tickets are automatically generated and managed by the system. The booking process is handled separately.

3. **Validation**: All APIs perform validation to ensure data integrity and consistency.

4. **Caching**: Public endpoints like show listings use Redis caching for improved performance.

5. **Updates**: If you need to update information after creation, most resources provide PUT endpoints (e.g., `/api/shows/{showId}`, `/api/events/{eventId}`, etc.).

## Caching and Real-time Updates

The system has been optimized for the show creation flow to ensure all newly created entities are immediately available for subsequent steps:

### Optimized Caching Strategy

- **Short Cache Times**: All show-related entities have short cache durations (1 minute) during creation
- **Automatic Cache Invalidation**: When you create or update an entity, related caches are automatically invalidated
- **Immediate Availability**: This ensures each new entity is immediately available for dependent API calls

This allows you to quickly create a complete show without experiencing delays due to cached data. For example, when you create a show and then try to create an event for that show, the system ensures the show is immediately available in the API responses.

### Technical Implementation

The system uses a combination of:

1. Short TTL values for show creation-related entities
2. Targeted cache invalidation for related entities
3. Global cache invalidation to ensure consistent views for all users

This means you can proceed through the entire show creation flow without any delays or need for manual cache clearing between steps.

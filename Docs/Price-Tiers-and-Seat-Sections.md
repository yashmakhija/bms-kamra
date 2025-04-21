# Price Tiers and Seat Sections Guide

## Overview

This guide explains the two key components of the pricing system:

- **Price Tiers**: Define pricing for show-category combinations
- **Seat Sections**: Create physical seating areas for specific showtimes

## Price Tiers (`/price-tiers`)

### What They Are

- Price templates that define pricing for each category (VIP, PREMIUM, REGULAR) for a specific show
- Each show has its own set of price tiers
- Created once per show per category type

### When to Use

- During initial show setup
- When defining base pricing for a show
- Before creating events and showtimes

### Example API Call

```json
POST /price-tiers
{
  "showId": "show123",
  "categoryType": "VIP", // Must be "VIP", "PREMIUM", or "REGULAR"
  "price": 1500,
  "currency": "INR",
  "description": "Premium seating"
}
```

## Seat Sections (`/shows/sections`)

### What They Are

- Actual seating areas for a specific showtime
- Reference an existing price tier
- Generate tickets for booking

### When to Use

- After creating showtimes
- When defining actual seating layout
- For each individual showtime that needs seats

### Example API Call

```json
POST /shows/sections
{
  "showtimeId": "showtime123",
  "priceTierId": "priceTier123", // ID of the price tier to use
  "name": "Section A",
  "totalSeats": 100,
  "availableSeats": 100
}
```

## Workflow Example

For a new show "Avengers":

1. **Create the show**

   ```
   POST /shows
   ```

2. **Define price tiers for each category**

   ```
   POST /price-tiers (VIP = 1500)
   POST /price-tiers (PREMIUM = 1000)
   POST /price-tiers (REGULAR = 500)
   ```

3. **Create event (date)**

   ```
   POST /shows/events
   ```

4. **Create showtime**

   ```
   POST /shows/showtimes
   ```

5. **Create seat sections for the showtime**
   ```
   POST /shows/sections (reference VIP price tier)
   POST /shows/sections (reference PREMIUM price tier)
   POST /shows/sections (reference REGULAR price tier)
   ```

## Complete Example Flow

Let's see how this would look for multiple shows:

### Show 1: "Avengers"

1. Create show:

   ```json
   POST /shows
   {
     "title": "Avengers",
     "venueId": "venue123",
     "duration": 120
   }
   // Response: { "id": "show1", ... }
   ```

2. Create price tiers:

   ```json
   POST /price-tiers
   {
     "showId": "show1",
     "categoryType": "VIP",
     "price": 1500,
     "currency": "INR"
   }
   // Response: { "id": "priceTier1", ... }

   POST /price-tiers
   {
     "showId": "show1",
     "categoryType": "REGULAR",
     "price": 500,
     "currency": "INR"
   }
   // Response: { "id": "priceTier2", ... }
   ```

3. Create event:

   ```json
   POST /shows/events
   {
     "showId": "show1",
     "date": "2023-06-15"
   }
   // Response: { "id": "event1", ... }
   ```

4. Create showtime:

   ```json
   POST /shows/showtimes
   {
     "eventId": "event1",
     "startTime": "2023-06-15T18:00:00Z",
     "endTime": "2023-06-15T20:00:00Z"
   }
   // Response: { "id": "showtime1", ... }
   ```

5. Create seat sections:

   ```json
   POST /shows/sections
   {
     "showtimeId": "showtime1",
     "priceTierId": "priceTier1",
     "name": "VIP Section",
     "totalSeats": 50,
     "availableSeats": 50
   }

   POST /shows/sections
   {
     "showtimeId": "showtime1",
     "priceTierId": "priceTier2",
     "name": "Regular Section",
     "totalSeats": 150,
     "availableSeats": 150
   }
   ```

### Show 2: "Titanic"

1. Create show:

   ```json
   POST /shows
   {
     "title": "Titanic",
     "venueId": "venue123",
     "duration": 180
   }
   // Response: { "id": "show2", ... }
   ```

2. Create price tiers (different pricing than Avengers):

   ```json
   POST /price-tiers
   {
     "showId": "show2",
     "categoryType": "VIP",
     "price": 2000,
     "currency": "INR"
   }
   // Response: { "id": "priceTier3", ... }

   POST /price-tiers
   {
     "showId": "show2",
     "categoryType": "REGULAR",
     "price": 800,
     "currency": "INR"
   }
   // Response: { "id": "priceTier4", ... }
   ```

## Important Notes

1. Each show has its own price tiers

   - Show 1: VIP could be ₹1500
   - Show 2: VIP could be ₹2000

2. Price tiers handle ONLY pricing information

   - They define price and currency for a category
   - They do NOT define physical seating layout

3. Seat sections handle ONLY seating information

   - They reference a price tier for pricing
   - They add physical allocation details (totalSeats, availableSeats)
   - They generate tickets

4. The system is designed with clear separation:
   - Price tiers: Set pricing once per show
   - Seat sections: Create seating layout per showtime

## Best Practices

1. **Always create price tiers first** before creating seat sections
2. **Reference price tiers by ID** in seat section creation
3. **Use consistent naming** for seat sections across showtimes
4. **Don't modify prices** frequently after tickets have been sold

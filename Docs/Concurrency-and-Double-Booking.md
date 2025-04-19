# Concurrency Control and Double Booking Prevention

## The Challenge

In a high-scale ticket booking system like Kunal-BMS, one of the most critical technical challenges is handling concurrency and preventing double bookings, especially during high-demand events when thousands of users may attempt to book the same seats simultaneously.

## Race Conditions in Ticket Booking

### What is a Race Condition?

A race condition occurs when two or more processes (in our case, user booking requests) attempt to modify the same data concurrently, potentially leading to unexpected results. In a ticket booking system, this can result in:

1. Double bookings (two users getting the same seat)
2. Lost revenue (seats appearing booked but never purchased)
3. Poor user experience (users seeing seats available but unable to book them)

### Example Scenario

Consider this simplified race condition:

1. User A and User B both try to book Seat X at 10:00:00.000
2. System checks if Seat X is available for User A (it is)
3. System checks if Seat X is available for User B (it still is because User A hasn't completed booking)
4. System marks Seat X as booked for User A
5. System marks Seat X as booked for User B
6. Both users have now booked the same seat

## Our Multi-layered Solution

We implement several layers of protection against race conditions:

### 1. Distributed Locking with Redis

Redis provides atomic operations that are perfect for distributed locking mechanisms:

```typescript
// Redis-based seat locking implementation
async function lockSeats(seatIds: string[], userId: string): Promise<boolean> {
  const redisClient = getRedisClient();
  const lockTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
  const pipeline = redisClient.pipeline();
  const lockKeys = seatIds.map((id) => `seat:lock:${id}`);

  // Set locks for all seats with NX (only if not exists)
  lockKeys.forEach((key) => {
    pipeline.set(key, userId, "NX", "PX", lockTimeout);
  });

  const results = await pipeline.exec();

  // All locks must be acquired successfully
  return results.every((result) => result[1] === "OK");
}

// Release locks when booking is completed or abandoned
async function releaseSeats(seatIds: string[], userId: string): Promise<void> {
  const redisClient = getRedisClient();
  const pipeline = redisClient.pipeline();
  const lockKeys = seatIds.map((id) => `seat:lock:${id}`);

  // For each seat, only release if the lock is owned by this user
  for (const key of lockKeys) {
    pipeline.eval(
      `
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else
        return 0
      end
    `,
      1,
      key,
      userId
    );
  }

  await pipeline.exec();
}
```

### 2. Database Transaction Isolation

We use database transactions with the highest isolation level to ensure consistency:

```typescript
// Booking service implementation with transaction isolation
export async function createBooking(
  userId: string,
  showtimeId: string,
  seatIds: string[]
): Promise<Booking> {
  return prisma.$transaction(
    async (tx) => {
      // 1. Verify all seats are available within transaction
      const seats = await tx.seat.findMany({
        where: {
          id: { in: seatIds },
          status: "AVAILABLE",
          showtimeId,
        },
      });

      if (seats.length !== seatIds.length) {
        throw new Error("One or more selected seats are no longer available");
      }

      // 2. Update seats to RESERVED status with FOR UPDATE lock
      await tx.$executeRaw`
      UPDATE "Seat"
      SET "status" = 'RESERVED'
      WHERE "id" IN (${Prisma.join(seatIds)})
      AND "status" = 'AVAILABLE'
      FOR UPDATE`;

      // 3. Count affected rows to ensure we got all seats
      const updatedCount = await tx.$executeRaw`
      SELECT COUNT(*) FROM "Seat"
      WHERE "id" IN (${Prisma.join(seatIds)})
      AND "status" = 'RESERVED'`;

      if (updatedCount !== seatIds.length) {
        throw new Error("Failed to reserve all requested seats");
      }

      // 4. Create booking record
      const booking = await tx.booking.create({
        data: {
          userId,
          showtimeId,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiration
          seats: {
            connect: seatIds.map((id) => ({ id })),
          },
        },
      });

      return booking;
    },
    {
      // Use SERIALIZABLE isolation level to prevent phantom reads
      isolationLevel: Prisma.TransactionIsolationLevel.SERIALIZABLE,
      maxWait: 5000, // Maximum time to wait for a lock (5s)
      timeout: 10000, // Transaction timeout (10s)
    }
  );
}
```

### 3. Two-Phase Booking Process

We implement a two-phase booking process to handle the asynchronous nature of user interactions:

#### Phase 1: Temporary Reservation

```typescript
// Controller for initiating a booking (first phase)
export async function initiateBooking(req: AuthRequest, res: Response) {
  try {
    const { showtimeId, seatIds } = req.body;
    const userId = req.user.id;

    // 1. Try to acquire locks on seats via Redis
    const locksAcquired = await lockSeats(seatIds, userId);

    if (!locksAcquired) {
      return res.status(409).json({
        message: "Some seats are currently being booked by another user",
      });
    }

    // 2. Create temporary booking in database
    const booking = await createBooking(userId, showtimeId, seatIds);

    // 3. Set up auto-expiration job for this booking
    await scheduleBookingExpiration(booking.id, 15 * 60); // 15 minutes

    return res.status(201).json({
      bookingId: booking.id,
      expiresAt: booking.expiresAt,
      seats: booking.seats,
    });
  } catch (error) {
    console.error("Booking initiation error:", error);
    return res.status(500).json({ message: error.message });
  }
}
```

#### Phase 2: Confirmation

```typescript
// Controller for confirming a booking (second phase)
export async function confirmBooking(req: AuthRequest, res: Response) {
  try {
    const { bookingId, paymentMethod, paymentToken } = req.body;
    const userId = req.user.id;

    // 1. Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId },
      include: { seats: true },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Check if booking hasn't expired
    if (booking.status !== "PENDING" || new Date() > booking.expiresAt) {
      // Release seats if booking expired
      await releaseSeats(
        booking.seats.map((s) => s.id),
        userId
      );

      return res.status(410).json({
        message: "Booking has expired, please start over",
      });
    }

    // 3. Process payment
    const paymentResult = await processPayment(
      paymentToken,
      booking.totalAmount
    );

    if (!paymentResult.success) {
      return res.status(400).json({ message: paymentResult.error });
    }

    // 4. Complete booking transaction
    const confirmedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status to CONFIRMED
      const updated = await tx.booking.update({
        where: { id: bookingId, status: "PENDING" },
        data: {
          status: "CONFIRMED",
          paymentId: paymentResult.paymentId,
          paymentMethod,
          confirmedAt: new Date(),
        },
        include: { seats: true },
      });

      // Update seat status from RESERVED to SOLD
      await tx.seat.updateMany({
        where: { id: { in: updated.seats.map((s) => s.id) } },
        data: { status: "SOLD" },
      });

      return updated;
    });

    // Release Redis locks
    await releaseSeats(
      confirmedBooking.seats.map((s) => s.id),
      userId
    );

    return res.status(200).json({
      message: "Booking confirmed successfully",
      booking: confirmedBooking,
    });
  } catch (error) {
    console.error("Booking confirmation error:", error);
    return res.status(500).json({ message: error.message });
  }
}
```

### 4. Cleanup for Abandoned Bookings

```typescript
// Scheduled job to cleanup expired bookings
export async function cleanupExpiredBookings() {
  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: new Date() },
    },
    include: { seats: true },
  });

  for (const booking of expiredBookings) {
    await prisma.$transaction(async (tx) => {
      // Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED" },
      });

      // Release seats
      await tx.seat.updateMany({
        where: {
          id: { in: booking.seats.map((s) => s.id) },
          status: "RESERVED",
        },
        data: { status: "AVAILABLE" },
      });
    });

    // Release Redis locks if they still exist
    await releaseSeats(
      booking.seats.map((s) => s.id),
      booking.userId
    );

    // Update inventory counters
    await updateInventoryCounters(booking.showtimeId);
  }

  console.log(`Cleaned up ${expiredBookings.length} expired bookings`);
}
```

## Inventory Management and Consistency

### Real-time Inventory Tracking

We maintain real-time counters in Redis to provide fast access to seat availability without database queries:

```typescript
// Update available seat count in Redis
async function updateSeatAvailability(showtimeId: string): Promise<void> {
  const redisClient = getRedisClient();

  // Get current counts from database (source of truth)
  const counts = await prisma.$queryRaw`
    SELECT 
      section_id, 
      COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_count,
      COUNT(*) as total_count
    FROM "Seat"
    WHERE showtime_id = ${showtimeId}
    GROUP BY section_id
  `;

  // Update Redis with accurate counts
  const pipeline = redisClient.pipeline();
  for (const row of counts) {
    const key = `showtime:${showtimeId}:section:${row.section_id}:available`;
    pipeline.set(key, row.available_count.toString());
    pipeline.expire(key, 3600); // 1 hour expiration
  }

  await pipeline.exec();
}
```

### Preventing Overselling

To prevent overselling even in high-concurrency scenarios:

```typescript
// Check if enough seats are available with Redis-first approach
async function checkAvailability(
  sectionId: string,
  quantity: number
): Promise<boolean> {
  const redisClient = getRedisClient();
  const key = `section:${sectionId}:available`;

  // Try Redis first for performance
  const cachedCount = await redisClient.get(key);

  if (cachedCount !== null) {
    return parseInt(cachedCount, 10) >= quantity;
  }

  // Fall back to database if Redis doesn't have the data
  const count = await prisma.seat.count({
    where: {
      sectionId,
      status: "AVAILABLE",
    },
  });

  // Cache the result for next time
  await redisClient.set(key, count.toString(), "EX", 30); // 30 sec expiration

  return count >= quantity;
}
```

## Performance Considerations

### Connection Pooling

We optimize database connections through proper pooling:

```typescript
// Database connection pool configuration
const databaseUrl = process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  connectionLimit: {
    min: 5,
    max: 100,
  },
});
```

### Batching Queries

We minimize database round-trips through batching:

```typescript
// Batch seat status update instead of individual updates
async function updateSeatsStatus(
  seatIds: string[],
  status: SeatStatus
): Promise<void> {
  await prisma.seat.updateMany({
    where: { id: { in: seatIds } },
    data: { status },
  });
}
```

## Testing and Verification

We rigorously test our concurrency controls:

1. **Load Testing**: Simulated bookings with thousands of concurrent users
2. **Chaos Testing**: Induced failures in various components during booking process
3. **Data Consistency Checks**: Regular validation of booking records against seat statuses

## Monitoring and Alerting

We implement comprehensive monitoring:

1. **Transaction Success Rate**: Monitor successful vs. failed bookings
2. **Lock Acquisition Rate**: Track Redis lock success/failure rates
3. **Orphaned Locks**: Alert on locks that persist beyond expected timeframes
4. **Database Lock Contentions**: Monitor transaction waiting times

## Emergency Procedures

In case of severe issues:

1. **Read-Only Mode**: Temporarily disable new bookings while maintaining view access
2. **Manual Reconciliation**: Tools to fix inconsistencies in seat or booking status
3. **Circuit Breaking**: Automatic disabling of problematic services

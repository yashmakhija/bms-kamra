# API Client

This package provides a client for interacting with the Kunal Kamara (BMS) API. It handles authentication, error handling, and provides type-safe methods for all endpoints.

## Installation

This package is part of a monorepo using Turborepo. To use it:

```bash
# Install dependencies
pnpm install
```

## Usage

### Basic Usage

```tsx
import { apiClient } from "@repo/api-client";

// Authentication
await apiClient.login({
  email: "user@example.com",
  password: "password123",
});

// Check if user is authenticated
const isLoggedIn = apiClient.isAuthenticated();

// Get current user
const user = await apiClient.getCurrentUser();

// Logout
apiClient.logout();
```

### Booking & Payments

```tsx
import { apiClient } from "@repo/api-client";

// Create a booking
const booking = await apiClient.createBooking({
  showtimeId: "showtime-id",
  sectionId: "section-id",
  quantity: 2,
});

// Get user bookings
const bookings = await apiClient.getUserBookings();

// Get booking details
const bookingDetails = await apiClient.getBookingById("booking-id");

// Cancel booking
await apiClient.cancelBooking("booking-id");

// Process payment
await apiClient.processPayment("booking-id", {
  paymentMethod: "CREDIT_CARD",
  paymentId: "external-payment-id",
});
```

### Razorpay Integration

```tsx
import { RazorpayClient } from "@repo/api-client";

// Check if Razorpay is configured
const isConfigured = await RazorpayClient.isConfigured();

// Initialize payment
await RazorpayClient.initializePayment("booking-id", {
  name: "BookMyShow",
  description: "Payment for movie tickets",
  prefill: {
    name: "John Doe",
    email: "john@example.com",
    contact: "+919876543210",
  },
  theme: {
    color: "#3399cc",
  },
  onSuccess: (data) => {
    console.log("Payment successful", data);
  },
  onError: (error) => {
    console.error("Payment failed", error);
  },
});
```

## Configuration

The API client is configured with base URL and default headers. You can modify these in the `config.ts` file.

The default base URL is set to use environment variables:

- In browser: `window.ENV_VITE_API_URL`
- In Node.js: `process.env.VITE_API_URL`

## Types

All types are exported from the package:

```tsx
import { User, Booking, PaymentMethod } from "@repo/api-client";
```

## Error Handling

The API client handles errors with appropriate status codes and error messages. You can catch these errors as follows:

```tsx
try {
  await apiClient.login({
    email: "user@example.com",
    password: "wrong-password",
  });
} catch (error) {
  console.error("Login failed:", error.message);
}
```

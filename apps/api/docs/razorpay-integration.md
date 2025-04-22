# Razorpay Integration Guide

This document explains how the Razorpay payment gateway is integrated into the Ticket Booking System.

## Configuration

The Razorpay integration requires the following environment variables:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
```

These are set in the `.env` file at the root of the API application.

## Integration Flow

1. **Creating a Payment Order**

   - When a user proceeds to payment, the frontend calls `POST /api/razorpay/orders/:bookingId`
   - The backend creates a Razorpay order using the booking details
   - The order details (orderId, amount, currency, keyId) are returned to the client

2. **Processing Payment**

   - The client loads the Razorpay checkout using the orderId and other details
   - User completes payment through Razorpay's interface
   - Razorpay sends back payment details to the client

3. **Verifying Payment**

   - Client sends payment verification details to `POST /api/razorpay/verify/:bookingId`
   - Backend verifies the signature to ensure the payment is legitimate
   - Backend updates the booking status to PAID if verification is successful

4. **Webhook Handling**
   - Razorpay sends payment status updates to the webhook endpoint
   - Webhook endpoint processes payment status updates asynchronously
   - This acts as a fallback if client-side verification fails

## API Endpoints

| Endpoint                          | Method | Description                              |
| --------------------------------- | ------ | ---------------------------------------- |
| `/api/razorpay/status`            | GET    | Check if Razorpay is properly configured |
| `/api/razorpay/orders/:bookingId` | POST   | Create a Razorpay order for a booking    |
| `/api/razorpay/verify/:bookingId` | POST   | Verify a Razorpay payment                |
| `/api/razorpay/webhook`           | POST   | Webhook endpoint for Razorpay callbacks  |
| `/api/razorpay/refund/:paymentId` | POST   | Initiate a refund (admin only)           |

## Implementation Details

The Razorpay integration is implemented in the following files:

- `src/routes/razorpayRoutes.ts`: API routes for Razorpay integration
- `src/controllers/razorpayController.ts`: Request handling and response formatting
- `src/services/razorpayService.ts`: Core business logic for Razorpay integration

## Troubleshooting

Common issues:

1. **Payment verification fails**:

   - Check if RAZORPAY_KEY_SECRET is correct
   - Ensure the signature calculation uses the right string format

2. **Webhook isn't working**:

   - Verify RAZORPAY_WEBHOOK_SECRET is correctly set
   - Make sure the webhook URL is publicly accessible
   - Check Razorpay dashboard for webhook delivery status

3. **Order creation fails**:
   - Check API logs for specific error messages
   - Verify that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are valid
   - Ensure the booking total amount is valid

## Testing Razorpay Integration

For testing in development mode:

1. Use Razorpay test credentials
2. Use Razorpay test card numbers: `4111 1111 1111 1111`
3. Use any future date for the expiry
4. Use any 3-digit number for CVV
5. Use `success@razorpay.com` for email
6. Use any password for the OTP screen

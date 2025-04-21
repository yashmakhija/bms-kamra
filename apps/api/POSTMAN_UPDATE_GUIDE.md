# Postman Collection Update Guide

This document provides guidance on how to update your existing Postman collection to fully test your backend API.

## Overview of Updates Needed

Based on my analysis of your backend code, I've identified several endpoints and features that should be added to your Postman collection for comprehensive testing:

1. **Missing Showtime Endpoints**: Added endpoints to get, update, and test showtimes
2. **Analytics & Admin Dashboard**: Added endpoints for testing admin analytics features
3. **Price Tier Management**: Added endpoints for creating and updating price tiers
4. **Environment Variables**: Enhanced environment variable recommendations

## How to Apply Updates

I've created a file called `postman_collection_updates.json` which contains all the new endpoints and environment variables that should be added to your collection.

### Method 1: Manual Addition (Recommended)

1. Open your Postman application
2. Import your existing collection if not already present
3. For each section in the `updates` array in the JSON file:
   - Find the corresponding folder in your collection
   - For each endpoint, create a new request in that folder with the provided configuration
   - Update the request details (method, URL, headers, body, etc.)

### Method 2: Programmatic Update

If you're comfortable with scripting, you can use the Postman API or a custom script to merge the updates with your existing collection.

## Testing Strategy

When testing your backend, I recommend the following approach:

1. **Start with basic authentication**:

   - Register a new user
   - Login to get a token
   - Test token verification

2. **Test admin capabilities**:

   - Create venues, categories, shows
   - Set up events and showtimes
   - Configure pricing

3. **Test booking flow as a user**:

   - View shows and available seats
   - Create bookings
   - Process payments
   - Cancel bookings

4. **Test edge cases**:
   - Expired bookings
   - Invalid inputs
   - Authentication failures

## Environment Variables

Make sure your Postman environment includes all the variables listed in the `environment_variables` section of the updates file. These are crucial for the tests to work properly.

## Webhook Testing

For testing Razorpay webhooks, you might need to:

1. Use a service like ngrok to expose your local server
2. Configure the webhook URL in Razorpay dashboard
3. Set appropriate headers in your requests

## Final Verification

After updating your collection:

1. Run a complete flow from authentication to booking
2. Verify that all endpoints return expected responses
3. Check that environment variables are being set correctly by test scripts

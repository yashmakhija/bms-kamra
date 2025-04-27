# API Test Suite

This directory contains comprehensive tests for the API backend service.

## Structure

- `fixtures/`: Test data factories for creating mock objects
- `middlewares/`: Tests for Express middlewares
- `utils/`: Helper utilities for testing
- `workers/`: Tests for Bull queue workers

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage report
pnpm test:coverage
```

## Test Coverage

The test suite aims to cover:

- Queue worker logic
- Authentication and authorization
- Data validation
- Business logic edge cases
- Concurrency handling

## Mocking Strategy

The tests use the following mocking strategies:

1. **Database**: Using `jest-mock-extended` to mock Prisma client
2. **Redis & Bull**: Mocking queue interfaces to test job processing logic
3. **External Services**: Mocking Razorpay and other external APIs

## Adding New Tests

When adding new tests:

1. Add fixtures in `fixtures/` if needed
2. Follow the existing test patterns for consistency
3. Test both happy paths and edge cases
4. Ensure proper cleanup after tests

## Testing Workers

Worker tests extract the process handlers registered with Bull queues and test them directly, allowing us to verify:

- Proper data validation
- Error handling
- Business logic execution
- Integration with other services

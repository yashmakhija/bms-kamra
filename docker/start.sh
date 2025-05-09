#!/bin/sh
set -e

# Navigate to database package
cd /app/packages/database

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Navigate back to app root
cd /app

# Wait for Redis to be fully available
echo "Waiting for Redis to be fully available..."
sleep 5

# Run the queue configuration helper
echo "Configuring Bull queues..."
node /app/docker/queue-fix.js

# Start the API server
echo "Starting API server with queue fix in place..."
REDIS_HOST=redis REDIS_PORT=6379 BULL_REDIS_HOST=redis BULL_REDIS_PORT=6379 node apps/api/dist/index.js 
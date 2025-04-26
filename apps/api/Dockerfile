FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files for dependency installation
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY packages/database/package.json ./packages/database/package.json
COPY packages/api-client/package.json ./packages/api-client/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN cd packages/database && npx prisma generate

# Build the project
RUN yarn build

# Production image, copy all the files and run node
FROM base AS runner
WORKDIR /app

# Set environment variables
ENV NODE_ENV production
ENV PORT 3000

# Create app directory
RUN mkdir -p /app/logs

# Copy build and necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/packages/database/package.json ./packages/database/package.json
COPY --from=builder /app/packages/api-client/package.json ./packages/api-client/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./package.json

# Install PM2 for process management
RUN npm install pm2 -g

# Create a non-root user and set permissions
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser
RUN chown -R appuser:nodejs /app
USER appuser

# Create a separate process file for worker/scheduler
COPY <<EOF /app/pm2.config.js
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: './apps/api/dist/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'ticket-worker',
      script: './apps/api/dist/workers/ticketWorker.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
    },
    {
      name: 'booking-worker',
      script: './apps/api/dist/workers/bookingWorker.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
    },
    {
      name: 'payment-worker',
      script: './apps/api/dist/workers/paymentWorker.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
    },
    {
      name: 'notification-worker',
      script: './apps/api/dist/workers/notificationWorker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
    },
    {
      name: 'scheduler',
      script: './apps/api/dist/workers/schedulerWorker.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
    },
  ],
};
EOF

EXPOSE 3000

# Start the server and workers using PM2
CMD ["pm2-runtime", "start", "pm2.config.js"] 
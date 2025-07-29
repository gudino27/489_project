# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for SQLite
RUN apk add --no-cache python3 py3-pip py3-setuptools make g++ sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .
# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create necessary directories and set permissions
RUN mkdir -p uploads database

# Copy and make entrypoint executable
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Set proper permissions
RUN chmod -R 755 /app

# Change ownership to node user (uid 1000)
RUN chown -R node:node /app

USER node

EXPOSE 3001

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for SQLite
RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .
RUN node init-database.js
RUN chmod 664 database/cabinet_photos.db
# Production stage
FROM node:20-alpine

# Install runtime dependencies
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create necessary directories
RUN mkdir -p uploads 

RUN chmod -R 755 /app
RUN chmod 644 /app/db-helpers.js

# Create non-root user
#RUN addgroup -g 1000 -S nodejs && \
 #   adduser -S nodejs -u 1000

# Change ownership
#RUN chown -R nodejs:nodejs /app
RUN chown -R node:node /app
USER node
#USER nodejs

EXPOSE 3001

CMD ["node", "server.js"]

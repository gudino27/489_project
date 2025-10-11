# Build stage
FROM node:20-alpine AS builder

# Install build dependencies for SQLite
RUN apk add --no-cache python3 py3-pip py3-setuptools make g++ sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (npm ci is faster and more reliable than npm install)
RUN npm ci --only=production

# Copy application files
COPY . .
# Production stage
FROM node:20-alpine

# Install runtime dependencies including Chromium for Puppeteer
RUN apk add --no-cache sqlite chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

WORKDIR /app

# Copy from builder with ownership set (fast - single operation vs 30k+ file operations)
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app .

# Create necessary directories with proper ownership
RUN mkdir -p uploads database && chown -R node:node uploads database

# Copy entrypoint and make executable (only file that needs +x)
COPY --chown=node:node docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

USER node

EXPOSE 3001

ENTRYPOINT ["/app/docker-entrypoint.sh"]

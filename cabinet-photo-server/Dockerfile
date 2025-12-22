# Build stage
FROM node:20-alpine AS builder

# Add fallback Alpine repositories to handle DNS issues
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.20/main" > /etc/apk/repositories && \
    echo "https://dl-cdn.alpinelinux.org/alpine/v3.20/community" >> /etc/apk/repositories && \
    echo "http://dl-4.alpinelinux.org/alpine/v3.20/main" >> /etc/apk/repositories && \
    echo "http://dl-4.alpinelinux.org/alpine/v3.20/community" >> /etc/apk/repositories && \
    apk update

# Install build dependencies for SQLite
RUN apk add --no-cache python3 py3-pip py3-setuptools make g++ sqlite-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (npm install will auto-generate package-lock.json)
RUN npm install --omit=dev

# Copy application files
COPY . .
# Production stage
FROM node:20-alpine

# Add fallback Alpine repositories to handle DNS issues
RUN echo "https://dl-cdn.alpinelinux.org/alpine/v3.20/main" > /etc/apk/repositories && \
    echo "https://dl-cdn.alpinelinux.org/alpine/v3.20/community" >> /etc/apk/repositories && \
    echo "http://dl-4.alpinelinux.org/alpine/v3.20/main" >> /etc/apk/repositories && \
    echo "http://dl-4.alpinelinux.org/alpine/v3.20/community" >> /etc/apk/repositories && \
    apk update

# Install runtime dependencies including Chromium for Puppeteer and FFmpeg for video processing
RUN apk add --no-cache sqlite chromium ffmpeg \
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
RUN mkdir -p uploads database data/geolite2 && chown -R node:node uploads database data

# Copy entrypoint and make executable (only file that needs +x)
COPY --chown=node:node docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

USER node

EXPOSE 3001

ENTRYPOINT ["/app/docker-entrypoint.sh"]

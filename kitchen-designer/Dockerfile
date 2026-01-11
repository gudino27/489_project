# Build stage
FROM node:20-alpine AS builder

# Accept git commit as build arg for cache versioning
ARG GIT_COMMIT=dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (npm install will auto-generate package-lock.json)
RUN npm install

# Copy application files
COPY . .

# Inject git commit into service worker cache name for automatic cache busting
RUN sed -i "s/gudino-admin-v[0-9]*/gudino-admin-${GIT_COMMIT}/" public/sw.js

# Build the React app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built app from builder with ownership (single operation)
COPY --from=builder --chown=nginx:nginx /app/build /usr/share/nginx/html

# Set ownership on nginx runtime directories
RUN chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

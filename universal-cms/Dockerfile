# Universal CMS Platform - Production Docker Image
FROM node:18-alpine AS base

# Install dependencies for sharp (image processing)
RUN apk add --no-cache libc6-compat vips-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
FROM base AS deps
RUN npm ci

# Build admin panel and themes
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build admin panel
RUN npm run build:admin

# Build themes
RUN npm run build:themes

# Remove devDependencies for production image
RUN npm prune --production

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 cmsuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy built assets
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/core ./core
COPY --from=builder /app/api ./api
COPY --from=builder /app/services ./services
COPY --from=builder /app/models ./models
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/themes ./themes
COPY --from=builder /app/plugins ./plugins
COPY --from=builder /app/config ./config
COPY --from=builder /app/admin/dist ./admin/dist
COPY --from=builder /app/storage ./storage
COPY --from=builder /app/server.js ./
COPY --from=builder /app/index.js ./
COPY --from=builder /app/package.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown -R cmsuser:nodejs /app/logs

# Switch to non-root user
USER cmsuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]

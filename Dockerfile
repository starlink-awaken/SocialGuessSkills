# Stage 1: Base image with Bun
FROM oven/bun:1.1.30 AS base
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Stage 3: Build
FROM base AS builder
COPY package.json bun.lockb* ./
COPY tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src/ ./src/
RUN bun run build

# Stage 4: Production image
FROM base AS runner
ENV NODE_ENV=production
RUN mkdir -p /app/logs /app/data

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 bun
RUN chown -R bun:nodejs /app
USER bun

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --version || exit 1

# Expose port (MCP server runs on stdio, but we can add HTTP server later)
EXPOSE 3000

CMD ["bun", "run", "src/server.ts"]

# Stage 1: Dependencies
FROM oven/bun:1.1.30 AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Stage 2: Builder
FROM oven/bun:1.1.30 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Stage 3: Development server
FROM oven/bun:1.1.30 AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
RUN mkdir -p /app/src /app/public

ENV NODE_ENV=development
EXPOSE 5173
CMD ["bun", "--hot", "run", "index.ts"]

# Stage 4: Production build
FROM oven/bun:1.1.30 AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
RUN bun install --frozen-lockfile --production

ENV NODE_ENV=production
EXPOSE 5173
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD test -f /app/dist/index.html || exit 1

CMD ["bun", "run", "preview"]

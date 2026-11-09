# syntax=docker/dockerfile:1
# NOF DİJİTAL — standalone Next.js production imajı (docs/09-PORTABILITY)
FROM node:22-alpine AS base
WORKDIR /app

# 1) Bağımlılıklar
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json bun.lock* package-lock.json* ./
RUN corepack enable && (bun install --frozen-lockfile 2>/dev/null || npm ci)

# 2) Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && (bun run build 2>/dev/null || npm run build)

# 3) Runtime — non-root
FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nof && adduser -S nof -G nof
COPY --from=builder --chown=nof:nof /app/.next/standalone ./
COPY --from=builder --chown=nof:nof /app/.next/static ./.next/static
COPY --from=builder --chown=nof:nof /app/public ./public
USER nof
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "server.js"]

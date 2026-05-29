FROM node:jod-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ── deps: install workspace dependencies for the api ─────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

COPY packages/env/package.json ./packages/env/
COPY packages/jobs/package.json ./packages/jobs/
COPY packages/events/package.json ./packages/events/

COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter @mora/api...

# ── builder: compile TypeScript ───────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY --from=deps /app/packages/env/node_modules ./packages/env/node_modules
COPY --from=deps /app/packages/jobs/node_modules ./packages/jobs/node_modules
COPY --from=deps /app/packages/events/node_modules ./packages/events/node_modules

COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# NOTE: schema.prisma must include binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
RUN pnpm --filter @mora/env build
RUN pnpm --filter @mora/jobs build
RUN pnpm --filter @mora/events build
RUN pnpm --filter @mora/api exec prisma generate
RUN pnpm --filter @mora/api build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:jod-alpine AS runner
ENV NODE_ENV=production

# Copy root node_modules first (provides the pnpm .pnpm store)
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules

# Run from apps/api so Node resolution walks up into the pnpm store correctly
# apps/api/node_modules/@nestjs/common → ../../node_modules/.pnpm/... ✓
COPY --from=builder /app/packages/env/dist /app/packages/env/dist
COPY --from=builder /app/packages/env/package.json /app/packages/env/package.json
COPY --from=builder /app/packages/env/node_modules /app/packages/env/node_modules

# Copy jobs package files
COPY --from=builder /app/packages/jobs/dist /app/packages/jobs/dist
COPY --from=builder /app/packages/jobs/package.json /app/packages/jobs/package.json
COPY --from=builder /app/packages/jobs/node_modules /app/packages/jobs/node_modules

# Copy events package files
COPY --from=builder /app/packages/events/dist /app/packages/events/dist
COPY --from=builder /app/packages/events/package.json /app/packages/events/package.json
COPY --from=builder /app/packages/events/node_modules /app/packages/events/node_modules

WORKDIR /app/apps/api
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3000
USER node
CMD ["node", "dist/main"]

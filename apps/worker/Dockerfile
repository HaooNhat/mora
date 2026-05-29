FROM node:jod-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ── deps: install both api and worker deps (shared pnpm store for prisma client) ─
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/env/package.json ./packages/env/
COPY packages/jobs/package.json ./packages/jobs/
COPY packages/events/package.json ./packages/events/

COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/

RUN pnpm install --frozen-lockfile --filter @mora/api... --filter @mora/worker...

# ── builder: compile TypeScript ───────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json ./

COPY --from=deps /app/node_modules ./node_modules

COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules

COPY --from=deps /app/packages/env/node_modules ./packages/env/node_modules
COPY --from=deps /app/packages/jobs/node_modules ./packages/jobs/node_modules
COPY --from=deps /app/packages/events/node_modules ./packages/events/node_modules

COPY packages/ ./packages/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/worker/ ./apps/worker/

# Generate prisma client using the worker's prisma.config.ts (no DATABASE_URL needed at build time)
# worker/prisma.config.ts → schema: '../api/prisma/schema.prisma' → populates worker's @prisma/client entry
RUN pnpm --filter @mora/env build
RUN pnpm --filter @mora/jobs build
RUN pnpm --filter @mora/events build
RUN cd /app/apps/worker && node_modules/.bin/prisma generate
RUN pnpm --filter @mora/worker build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:jod-alpine AS runner
ENV NODE_ENV=production

# Copy root node_modules first (provides the pnpm .pnpm store with generated prisma client)
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules

# Run from apps/worker so Node resolution walks up into the pnpm store correctly
WORKDIR /app/apps/worker
COPY --from=builder /app/packages/env/dist /app/packages/env/dist
COPY --from=builder /app/packages/env/package.json /app/packages/env/package.json
COPY --from=builder /app/packages/env/node_modules /app/packages/env/node_modules

COPY --from=builder /app/packages/jobs/dist /app/packages/jobs/dist
COPY --from=builder /app/packages/jobs/package.json /app/packages/jobs/package.json
COPY --from=builder /app/packages/jobs/node_modules /app/packages/jobs/node_modules

COPY --from=builder /app/packages/events/dist /app/packages/events/dist
COPY --from=builder /app/packages/events/package.json /app/packages/events/package.json
COPY --from=builder /app/packages/events/node_modules /app/packages/events/node_modules

COPY --from=builder /app/apps/worker/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist

USER node
CMD ["node", "dist/main"]

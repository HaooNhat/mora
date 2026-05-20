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
COPY packages/ ./packages/
COPY apps/api/prisma ./apps/api/prisma
COPY apps/worker/ ./apps/worker/
# Generate prisma client using the worker's prisma.config.ts (no DATABASE_URL needed at build time)
# worker/prisma.config.ts → schema: '../api/prisma/schema.prisma' → populates worker's @prisma/client entry
RUN pnpm --filter @mora/env build
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
COPY --from=builder /app/apps/worker/node_modules ./node_modules
COPY --from=builder /app/apps/worker/dist ./dist

USER node
CMD ["node", "dist/main"]

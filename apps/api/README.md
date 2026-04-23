# Mora API

NestJS backend for the Mora procure-to-pay platform.

## Stack

- NestJS + TypeScript
- PostgreSQL via Prisma ORM
- Redis (rate limiting, OAuth state, session)
- JWT authentication (httpOnly cookies) + Google OAuth (OpenID Connect)
- Resend for transactional email

## Structure

```
src/
├── common/          # Guards, decorators, interceptors, filters, state-machine engine
├── modules/         # Domain modules: auth, organization, requisitions, purchase-orders,
│                    #   invoices, goods-receipts, payments
└── services/        # Shared services: prisma, redis, oidc, user
```

## Auth Flow

1. **Register** `POST /auth/register` — creates user, sends email verification
2. **Verify email** `GET /auth/verify-email?token=...`
3. **Login** `POST /auth/login` — validates credentials, sets `accessToken` + `refreshToken` httpOnly cookies
4. **Google OAuth** `GET /auth/google/login` → Google → `GET /auth/google/callback` → sets cookies → redirects to frontend
5. **Refresh** `POST /auth/refresh` — rotates tokens using the refresh cookie
6. **Me** `GET /auth/me` — returns current user
7. **Logout** `POST /auth/logout` — revokes refresh token, clears cookies

## Running Locally

See the root README for full setup. From this directory:

```bash
# copy env and fill in values
cp .env.example .env

# run migrations
pnpm prisma migrate dev

# start in watch mode
pnpm start:dev
```

Swagger docs are available at `http://localhost:3001/api` when running in development.

## Environment Variables

See `.env.example` for all required variables and where to get them.

## Tests

```bash
pnpm test          # unit tests
pnpm test:e2e      # e2e tests
pnpm test:cov      # coverage
```

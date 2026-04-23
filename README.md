# Mora

**Mora is a simple procure-to-pay platform for small and medium businesses.**

It covers the full procurement lifecycle — from purchase requests through to supplier payments.

> Built by a solo dev. A personal project to explore what a lightweight P2P tool might look like for teams that need real procurement workflow.

---

## What Mora Does

Mora enforces a structured procurement chain:

```
Request → Approve → Order → Receive → Invoice → Pay
```

Every step is tracked. Every document is linked.

---

## Core Flow

### 1. Purchase Requisition (PR)

An employee requests to buy something. The request goes through an approval workflow based on amount thresholds and roles.

- Under $500 → auto-approved
- $500–$5,000 → requires manager approval
- Over $5,000 → requires manager + finance approval

### 2. Purchase Order (PO)

An approved PR generates a PO that is sent to the supplier. The PO tracks confirmation and shipment status.

### 3. Goods Receipt

When goods arrive, the receiving team logs what was actually received — quantity, condition, notes. This feeds into 3-way matching.

### 4. Invoice

The supplier submits an invoice. The system runs a **3-way match**:

| Check    | Rule                                             |
| -------- | ------------------------------------------------ |
| Price    | Invoice unit price ≈ PO unit price (within 2%)   |
| Quantity | Invoice quantity ≈ received quantity (within 5%) |

- All checks pass → invoice auto-approved
- Any check fails → flagged as an exception for manual review

### 5. Payment

Approved invoices are marked for payment. Payment records are tracked against invoices.

---

## Document Status Lifecycles

**Purchase Requisition**
`DRAFT → SUBMITTED → APPROVED / REJECTED → ORDERED`

**Purchase Order**
`DRAFT → SENT → CONFIRMED → PARTIALLY_RECEIVED → RECEIVED → INVOICED → CLOSED`

**Invoice**
`DRAFT → SUBMITTED → PENDING_MATCH → MATCHED / EXCEPTION → APPROVED / REJECTED → PAID`

**Payment**
`PENDING → SUCCESS / FAILED`

---

## Data Model

```
Organization       (buyer or supplier)
User               (org member with a role)
PurchaseRequisition + items
PurchaseOrder      + items
GoodsReceipt       + items
Invoice            + items
Payment
```

---

## Roles

| Role                  | Can Do                                    |
| --------------------- | ----------------------------------------- |
| `OWNER` / `ADMIN`     | Everything                                |
| `PROCUREMENT_MANAGER` | Manage POs, suppliers, approvals          |
| `BUYER`               | Create and manage POs                     |
| `APPROVER`            | Approve requisitions and invoices         |
| `FINANCE_MANAGER`     | Approve high-value items, manage payments |
| `SUPPLIER_MANAGER`    | Manage supplier org profiles              |
| `VIEWER`              | Read-only                                 |

---

## Tech Stack

- **Backend:** NestJS + TypeScript, PostgreSQL via Prisma ORM
- **Auth:** JWT (httpOnly cookies) + Google OAuth (OpenID Connect)
- **Cache / rate limiting:** Redis
- **Frontend:** Next.js 15 (App Router) + TypeScript, TanStack Query, Zustand
- **Monorepo:** Turborepo + pnpm

---

## Project Structure

```
mora/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   ├── ui/           # Shared React components (Radix UI + Tailwind)
│   ├── eslint-config/
│   └── typescript-config/
└── docker-compose.yml
```

Backend modules live under `apps/api/src/modules/` — one folder per domain (auth, requisitions, purchase-orders, etc.). Shared utilities (guards, interceptors, decorators) are in `apps/api/src/common/`.

Frontend features live under `apps/web/features/` — each feature has its own components, hooks, and service layer.

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL and Redis)

### 1. Clone and install

```bash
git clone https://github.com/HaooNhat/mora.git
cd mora
pnpm install
```

### 2. Start infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 and Redis on port 6379.

### 3. Set up environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in the values in `apps/api/.env`. At minimum you need:

- A Resend API key for email verification (<https://resend.com>)
- Google OAuth credentials (<https://console.cloud.google.com/apis/credentials>)
- Random strings for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`

### 4. Run database migrations

```bash
cd apps/api
pnpm prisma migrate dev
```

### 5. Start the dev servers

From the repo root:

```bash
pnpm dev
```

This starts both the API (port 3001) and the web app (port 3000) via Turborepo.

---

## What's Not Here (By Design)

Mora deliberately skips enterprise features that SMBs don't need:

- Supplier catalogs / punchout
- UNSPSC commodity codes
- EDI / cXML integrations
- Contract lifecycle management
- Supplier risk scoring
- ERP integration

The focus is on getting the core P2P chain working cleanly first.

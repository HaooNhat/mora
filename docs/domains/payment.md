# Payment

## What It Is

A Payment record tracks that **money was sent** against an approved invoice. It is a **record-keeping entry**, not an automated transfer.

Mora does not move money. The actual bank transfer, check, or wire happens outside the system. Finance records the payment here after the fact, which closes the invoice and completes the procurement chain.

---

## Actors

| Actor                       | Role                                                                     |
| --------------------------- | ------------------------------------------------------------------------ |
| **Finance Manager** / Admin | Records the payment after the transfer is made externally                |
| **System**                  | Marks the linked invoice as `PAID` when a successful payment is recorded |

---

## States

| State     | What it means                                                                     |
| --------- | --------------------------------------------------------------------------------- |
| `PENDING` | Payment entry created but not yet confirmed. Optional holding state.              |
| `SUCCESS` | Payment confirmed. The linked invoice is automatically marked `PAID`.             |
| `FAILED`  | Payment attempt failed (e.g., wrong account, returned). Invoice stays `APPROVED`. |

---

## Transitions

```
PENDING ──[confirm]──► SUCCESS  → invoice marked PAID
        └──[fail]───► FAILED   → invoice stays APPROVED, can retry
```

For most cases, a payment will be created directly as `SUCCESS` in a single action — no need to pass through `PENDING` unless you want a two-step confirm flow.

---

## Business Rules

- A payment **must** reference an `APPROVED` invoice. You cannot pay an invoice that hasn't been cleared.
- Multiple payments can reference one invoice (partial payments), but the sum must not exceed the invoice total.
- When `payment.status = SUCCESS` and `sum(payments.amount) >= invoice.totalAmount`, the invoice is marked `PAID`.
- A `FAILED` payment does not block a new payment attempt — create a new payment record.
- `payerOrgId` must be the buyer organization. `payeeOrgId` must be the supplier.
- `currency` must match the invoice currency (no FX conversion in this version).

---

## Payment Methods

The `method` field is a free-text string. Suggested values (not enforced):

- `bank_transfer`
- `check`
- `wire`
- `credit_card`
- `cash`

---

## File Locations

| Concern                         | File                                          |
| ------------------------------- | --------------------------------------------- |
| Business logic + invoice update | `src/modules/payments/payments.service.ts`    |
| HTTP endpoints                  | `src/modules/payments/payments.controller.ts` |

---

## API Endpoints

| Method  | Path                 | Description                         | Auth                  |
| ------- | -------------------- | ----------------------------------- | --------------------- |
| `POST`  | `/payments`          | Record a payment against an invoice | JWT + Finance Manager |
| `GET`   | `/payments?orgId=`   | List payments for an org            | JWT + org member      |
| `GET`   | `/payments/:id`      | Get a single payment record         | JWT + org member      |
| `PATCH` | `/payments/:id/fail` | Mark a PENDING payment as FAILED    | JWT + Finance Manager |

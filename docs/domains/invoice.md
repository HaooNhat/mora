# Invoice

## What It Is

An Invoice is a **payment request from the supplier** against a specific Purchase Order. The supplier creates it; the buyer's AP team processes it.

Once submitted, the system automatically runs a **3-way match** (Invoice vs. PO vs. Goods Receipt). If everything aligns within tolerance, the invoice is auto-approved. If not, it enters an exception queue for manual review.

---

## Actors

| Actor                               | Role                                              |
| ----------------------------------- | ------------------------------------------------- |
| **Supplier**                        | Creates and submits the invoice                   |
| **System**                          | Runs the 3-way match automatically on submission  |
| **AP Specialist** / Finance Manager | Resolves exceptions, manually approves or rejects |
| **Finance Manager**                 | Records payment once invoice is approved          |

---

## States

| State           | What it means                                                                             |
| --------------- | ----------------------------------------------------------------------------------------- |
| `DRAFT`         | Supplier is building the invoice. Not visible to buyer yet.                               |
| `SUBMITTED`     | Supplier has locked and sent the invoice. Match process starts.                           |
| `PENDING_MATCH` | System is running the 3-way match. Transient — resolves quickly.                          |
| `MATCHED`       | All checks passed within tolerance. Ready to be approved. Auto-transitions to `APPROVED`. |
| `EXCEPTION`     | One or more checks failed. Requires AP review before it can proceed.                      |
| `APPROVED`      | Cleared for payment — either auto (from `MATCHED`) or manual (AP resolved exceptions).    |
| `REJECTED`      | Sent back to supplier. Rejection reason recorded. Supplier must resubmit.                 |
| `PAID`          | Payment has been recorded against this invoice. Terminal state.                           |

---

## Transitions

```
DRAFT ──[SUBMIT]──► SUBMITTED ──[system runs match]──► PENDING_MATCH
                                                              │
                                        ┌─────────────────────┴──────────────────┐
                                        │                                          │
                                   [all pass]                              [any fail]
                                        │                                          │
                                    MATCHED                                   EXCEPTION
                                        │                                          │
                                [auto-approve]                          [AP reviews]
                                        │                               ┌──────────┴──────────┐
                                        │                          [approve]              [reject]
                                        └──────────────┬────────────────┘                   │
                                                       ▼                                    ▼
                                                   APPROVED                            REJECTED
                                                       │
                                            [payment recorded]
                                                       │
                                                     PAID
```

| From            | Event               | To                     | Triggered by                     | Notes                        |
| --------------- | ------------------- | ---------------------- | -------------------------------- | ---------------------------- |
| `DRAFT`         | `SUBMIT`            | `SUBMITTED`            | Supplier                         | Locks invoice                |
| `SUBMITTED`     | _(auto)_            | `PENDING_MATCH`        | System                           | Immediate on submit          |
| `PENDING_MATCH` | _(match passes)_    | `MATCHED` → `APPROVED` | System                           | Auto-approves if matched     |
| `PENDING_MATCH` | _(match fails)_     | `EXCEPTION`            | System                           | Routes to AP queue           |
| `EXCEPTION`     | `APPROVE`           | `APPROVED`             | AP Specialist, Finance Manager   | Manual override after review |
| `EXCEPTION`     | `REJECT`            | `REJECTED`             | AP Specialist, Finance Manager   | `rejectedReason` required    |
| `APPROVED`      | _(payment created)_ | `PAID`                 | System, when Payment is recorded | —                            |

---

## 3-Way Match Logic

The match engine compares three documents line by line:

```
For each invoice line item:
  1. Find the linked PO line item
  2. Aggregate quantityReceived from all GoodsReceiptItems for that PO line
  3. Run checks:

     PRICE CHECK:
       variance = abs(invoiceUnitPrice - poUnitPrice) / poUnitPrice
       pass if variance <= 0.02  (2% tolerance)

     QUANTITY CHECK:
       variance = abs(invoiceQty - totalReceivedQty) / totalReceivedQty
       pass if variance <= 0.05  (5% tolerance)

     RECEIPT CHECK:
       fail with NO_RECEIPT if totalReceivedQty == 0

If all line items pass all checks → MATCHED
If any line item fails any check → EXCEPTION (with details per line)
```

### Exception Types

| Type                | Meaning                                                         |
| ------------------- | --------------------------------------------------------------- |
| `PRICE_VARIANCE`    | Invoice unit price differs from PO price by more than 2%        |
| `QUANTITY_VARIANCE` | Invoice quantity differs from received quantity by more than 5% |
| `NO_RECEIPT`        | No Goods Receipt exists for the PO line item                    |

### Tolerances

Defined in `matching.engine.ts` as constants:

```
PRICE_TOLERANCE  = 0.02   (2%)
QTY_TOLERANCE    = 0.05   (5%)
```

These are the single source of truth. Change them there, they apply everywhere.

---

## Business Rules

- An invoice **must** reference a PO. Invoices without a PO reference are not supported in this version.
- The PO must be in `CONFIRMED`, `PARTIALLY_RECEIVED`, or `RECEIVED` state for an invoice to be submitted.
- A supplier can only invoice against their own POs.
- The `MATCHED` state auto-transitions to `APPROVED` immediately — it is not a resting state.
- Partial invoicing is allowed: a supplier can submit an invoice for a subset of PO line items.
- Total invoiced amount across all invoices for a PO should not exceed the PO total (enforced at submit time).

---

## File Locations

| Concern                 | File                                           |
| ----------------------- | ---------------------------------------------- |
| State transitions       | `src/modules/invoices/invoices.transitions.ts` |
| Match engine (isolated) | `src/modules/matching/matching.engine.ts`      |
| Business logic          | `src/modules/invoices/invoices.service.ts`     |
| HTTP endpoints          | `src/modules/invoices/invoices.controller.ts`  |

---

## API Endpoints

| Method  | Path                    | Description                            | Auth                  |
| ------- | ----------------------- | -------------------------------------- | --------------------- |
| `POST`  | `/invoices`             | Create invoice draft                   | JWT + Supplier member |
| `GET`   | `/invoices?orgId=`      | List invoices (buyer or supplier view) | JWT + org member      |
| `GET`   | `/invoices/:id`         | Get a single invoice with match result | JWT + org member      |
| `PATCH` | `/invoices/:id`         | Update a DRAFT invoice                 | JWT + Supplier        |
| `POST`  | `/invoices/:id/submit`  | DRAFT → SUBMITTED → match runs         | JWT + Supplier        |
| `POST`  | `/invoices/:id/approve` | EXCEPTION → APPROVED                   | JWT + AP/Finance role |
| `POST`  | `/invoices/:id/reject`  | EXCEPTION → REJECTED                   | JWT + AP/Finance role |

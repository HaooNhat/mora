# Purchase Order (PO)

## What It Is

A Purchase Order is the **external commitment sent to a supplier**. It is the legal agreement to buy specific items at specific prices. A PO is always created from an approved Purchase Requisition.

Once sent, a PO cannot be silently changed — any modification requires a change order (amendment), which the supplier must re-confirm.

---

## Actors

| Actor                           | Role in this domain                                  |
| ------------------------------- | ---------------------------------------------------- |
| **Buyer** / Procurement Manager | Creates PO from an approved PR, sends it to supplier |
| **Supplier**                    | Confirms the PO, logs shipment                       |
| **Receiver** / Warehouse        | Logs goods receipt when delivery arrives             |
| **System**                      | Auto-updates PO status based on receipt totals       |

---

## States

| State                | What it means                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| `DRAFT`              | Being built by the buyer. Not yet sent to supplier. Still editable.                                          |
| `SENT`               | Transmitted to the supplier. Now a legal commitment. Buyer cannot silently change it.                        |
| `CONFIRMED`          | Supplier has acknowledged the PO and agreed to fulfill it.                                                   |
| `PARTIALLY_RECEIVED` | At least one delivery has been logged, but not all items are accounted for. **Set automatically by system.** |
| `RECEIVED`           | All ordered quantities have been received. **Set automatically by system.** 3-way match can now run.         |
| `INVOICED`           | A supplier invoice has been submitted against this PO.                                                       |
| `CLOSED`             | Fully complete — received, invoiced, and paid. Terminal state.                                               |
| `CANCELLED`          | Terminated before fulfillment. Record is kept.                                                               |

---

## Transitions

```
DRAFT ──[SEND]──► SENT ──[CONFIRM]──► CONFIRMED
                                          │
                              ┌───────────┘
                              │
                  [goods receipt created]  ← system-triggered
                              │
                   ┌──────────┴──────────┐
                   │                     │
          PARTIALLY_RECEIVED          RECEIVED
                   │                     │
                   └──────────┬──────────┘
                              │
                    [invoice submitted]
                              │
                          INVOICED
                              │
                    [invoice paid]
                              │
                           CLOSED

DRAFT / SENT / CONFIRMED ──[CANCEL]──► CANCELLED
```

| From                               | Event                 | To                                 | Triggered by                                    | Notes                                             |
| ---------------------------------- | --------------------- | ---------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `DRAFT`                            | `SEND`                | `SENT`                             | Buyer (manual)                                  | Locks line items                                  |
| `SENT`                             | `CONFIRM`             | `CONFIRMED`                        | Supplier (manual)                               | —                                                 |
| `CONFIRMED` / `PARTIALLY_RECEIVED` | _(receipt created)_   | `PARTIALLY_RECEIVED` or `RECEIVED` | System, on GoodsReceipt save                    | Calculated from receipt totals vs. ordered totals |
| `RECEIVED`                         | _(invoice submitted)_ | `INVOICED`                         | System, when Invoice is created against this PO | —                                                 |
| `INVOICED`                         | _(invoice paid)_      | `CLOSED`                           | System, when Payment is recorded                | —                                                 |
| Any pre-receipt state              | `CANCEL`              | `CANCELLED`                        | Buyer, Procurement Manager                      | Cannot cancel after goods received                |

---

## Auto-Status Calculation (Receipt Logic)

When a `GoodsReceipt` is saved for a PO, the system recalculates PO status:

```
totalOrdered  = sum of all PO line item quantities
totalReceived = sum of all GoodsReceiptItem.quantityReceived for this PO

if totalReceived == 0:
  → no change (stays CONFIRMED)
if 0 < totalReceived < totalOrdered:
  → PARTIALLY_RECEIVED
if totalReceived >= totalOrdered:
  → RECEIVED
```

The receiving team only logs what arrived — they do not manually pick a PO status.

---

## Business Rules

- A PO **must** reference an approved PR (`APPROVED` status). The PR is then marked `ORDERED`.
- A PO **must** reference exactly one supplier organization.
- Once `SENT`, line items are locked. Changing quantity or price requires a new amendment flow (future feature).
- A PO cannot be cancelled after it has moved to `PARTIALLY_RECEIVED` or beyond.
- Multiple `GoodsReceipt` records can exist for one PO (supplier ships in batches).
- Multiple `Invoice` records can exist for one PO (partial invoicing), but total invoiced amount must not exceed PO total.

---

## File Locations

| Concern                     | File                                                                             |
| --------------------------- | -------------------------------------------------------------------------------- |
| State transitions           | `src/modules/purchase-orders/purchase-orders.transitions.ts`                     |
| Receipt-driven status logic | `src/modules/purchase-orders/purchase-orders.service.ts` → `recalculateStatus()` |
| HTTP endpoints              | `src/modules/purchase-orders/purchase-orders.controller.ts`                      |

---

## API Endpoints

| Method | Path                           | Description                   | Auth                  |
| ------ | ------------------------------ | ----------------------------- | --------------------- |
| `POST` | `/purchase-orders`             | Create PO from an approved PR | JWT + Buyer role      |
| `GET`  | `/purchase-orders?orgId=`      | List POs for an org           | JWT + org member      |
| `GET`  | `/purchase-orders/:id?orgId=`  | Get a single PO               | JWT + org member      |
| `POST` | `/purchase-orders/:id/send`    | DRAFT → SENT                  | JWT + Buyer           |
| `POST` | `/purchase-orders/:id/confirm` | SENT → CONFIRMED              | JWT + Supplier member |
| `POST` | `/purchase-orders/:id/cancel`  | → CANCELLED                   | JWT + Buyer           |

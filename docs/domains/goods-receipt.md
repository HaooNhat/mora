# Goods Receipt (GR)

## What It Is

A Goods Receipt records **what was physically received** when a delivery arrives. It is created by the buyer's receiving team — not the supplier.

The Goods Receipt is the third leg of the **3-way match**: PO → Receipt → Invoice. Without a receipt, an invoice cannot be auto-approved.

There is no status lifecycle on a Goods Receipt itself — it is created once and is immutable. Its existence and quantities drive the PO status and invoice matching logic.

---

## Actors

| Actor                          | Role                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| **Receiver** / Warehouse staff | Creates the receipt when goods arrive                          |
| **System**                     | Uses receipt data to update PO status and run invoice matching |

Suppliers do **not** create receipts. They send ship notices (future feature), but the buyer-side receiver confirms actual arrival.

---

## Data Captured

| Field        | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| `orderId`    | Which PO this receipt is for                               |
| `receivedBy` | Who logged the receipt                                     |
| `receivedAt` | When the delivery was logged                               |
| `notes`      | Any delivery notes (damaged items, partial shipment, etc.) |
| **Items**    | Line-level detail (see below)                              |

### Receipt Item Fields

| Field              | Purpose                                              |
| ------------------ | ---------------------------------------------------- |
| `orderItemId`      | Links back to the specific PO line item              |
| `description`      | Description of what was received                     |
| `quantityOrdered`  | What the PO said should arrive (for reference)       |
| `quantityReceived` | What **actually** arrived — the authoritative number |
| `notes`            | Item-level notes (e.g., "2 units damaged, rejected") |

`quantityReceived` is the only field that matters for matching. `quantityOrdered` is stored for display convenience.

---

## How It Affects the PO

Creating a Goods Receipt immediately triggers a PO status recalculation:

```
on save → compare totalReceived vs totalOrdered across all receipts for this PO
        → update PO to PARTIALLY_RECEIVED or RECEIVED
```

See `purchase-order.md` for the full calculation logic.

---

## How It Affects Invoice Matching

When an invoice is submitted, the matching engine aggregates all `GoodsReceiptItem.quantityReceived` records for the PO to determine the total received quantity per line item.

If **no receipt exists** for a PO line item, the matching engine flags it as a `NO_RECEIPT` exception.

---

## Business Rules

- A receipt must reference a PO in `CONFIRMED`, `PARTIALLY_RECEIVED`, or `RECEIVED` state. You cannot receive goods against a `DRAFT` or `CANCELLED` PO.
- Multiple receipts are allowed per PO (batch deliveries).
- `quantityReceived` can exceed `quantityOrdered` (over-delivery). The PO moves to `RECEIVED`. The over-delivery is noted; it does not block anything but will show up in matching.
- Receipts are **immutable** once created. If a mistake is made, a corrective receipt with negative quantity is not supported in this version — the receiver must note it and AP resolves it manually during invoice matching.

---

## File Locations

| Concern                           | File                                                      |
| --------------------------------- | --------------------------------------------------------- |
| HTTP endpoints                    | `src/modules/goods-receipts/goods-receipts.controller.ts` |
| Business logic + PO status update | `src/modules/goods-receipts/goods-receipts.service.ts`    |

---

## API Endpoints

| Method | Path                       | Description                | Auth                |
| ------ | -------------------------- | -------------------------- | ------------------- |
| `POST` | `/goods-receipts`          | Log a new delivery receipt | JWT + Receiver role |
| `GET`  | `/goods-receipts?orderId=` | List receipts for a PO     | JWT + org member    |
| `GET`  | `/goods-receipts/:id`      | Get a single receipt       | JWT + org member    |

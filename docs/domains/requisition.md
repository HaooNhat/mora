# Purchase Requisition (PR)

## What It Is

A Purchase Requisition is an **internal request to buy something**. It is the starting point of every procurement action. No Purchase Order can exist without an approved PR.

The PR never leaves the organization — it is not sent to suppliers. It is purely an internal authorization document.

---

## Actors

| Actor                           | Role in this domain                                  |
| ------------------------------- | ---------------------------------------------------- |
| **Requester**                   | Creates and submits the PR                           |
| **Approver** / Finance Manager  | Approves or rejects submitted PRs                    |
| **Buyer** / Procurement Manager | Converts an approved PR into a PO (marks it ORDERED) |
| **System**                      | Auto-approves PRs under the $500 threshold           |

---

## States

| State       | What it means                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| `DRAFT`     | Being written. Only the requester can see and edit it. Not yet in any approval queue.                  |
| `SUBMITTED` | Locked and sent to the approval queue. Requester can no longer edit.                                   |
| `APPROVED`  | Approved but not yet acted on. A buyer still needs to create a PO from it.                             |
| `REJECTED`  | Closed. A rejection reason is required. The requester can see why.                                     |
| `ORDERED`   | A PO has been created from this PR. It is done. Prevents duplicate POs being created from the same PR. |

---

## Transitions

```
DRAFT ──[SUBMIT]──► SUBMITTED ──[APPROVE]──► APPROVED ──[ORDER]──► ORDERED
                        │
                        └──[REJECT]──► REJECTED
```

| From        | Event     | To          | Who can trigger                          | Guards                                             | Side effects                                       |
| ----------- | --------- | ----------- | ---------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `DRAFT`     | `SUBMIT`  | `SUBMITTED` | The requester only                       | `actor.id === pr.requestedBy`                      | If amount < $500, system immediately auto-approves |
| `SUBMITTED` | `APPROVE` | `APPROVED`  | Approver, Finance Manager, Admin, Owner  | Cannot be the requester; role must match threshold | —                                                  |
| `SUBMITTED` | `REJECT`  | `REJECTED`  | Approver, Finance Manager, Admin, Owner  | Cannot be the requester; `rejectedReason` required | —                                                  |
| `APPROVED`  | `ORDER`   | `ORDERED`   | Buyer, Procurement Manager, Admin, Owner | —                                                  | Called internally when a PO is created             |

---

## Business Rules

### Approval Thresholds

Who must approve depends on the total amount of the requisition:

| Total Amount     | Required Approver Roles        | Behavior                                                 |
| ---------------- | ------------------------------ | -------------------------------------------------------- |
| Under $500       | _(none)_                       | Auto-approved by system on submit                        |
| $500 – $4,999    | `APPROVER`                     | Waits for manual approval                                |
| $5,000 and above | `APPROVER` + `FINANCE_MANAGER` | Both roles must approve (or one user holding both roles) |

Thresholds are defined in `requisitions.policy.ts` — one place to change.

### Self-Approval Prevention

A user cannot approve their own PR, regardless of their role.

### Immutability After Submit

Once a PR is `SUBMITTED`, it cannot be edited. The requester must ask the approver to reject it if changes are needed, then resubmit.

### Deletion

Only `DRAFT` PRs can be deleted, and only by the requester.

---

## File Locations

| Concern                  | File                                                   |
| ------------------------ | ------------------------------------------------------ |
| State transitions        | `src/modules/requisitions/requisitions.transitions.ts` |
| Approval threshold rules | `src/modules/requisitions/requisitions.policy.ts`      |
| HTTP endpoints           | `src/modules/requisitions/requisitions.controller.ts`  |
| Business logic           | `src/modules/requisitions/requisitions.service.ts`     |
| Tests                    | `src/modules/requisitions/tests/`                      |

---

## API Endpoints

| Method   | Path                        | Description                       | Auth                 |
| -------- | --------------------------- | --------------------------------- | -------------------- |
| `POST`   | `/requisitions`             | Create a new PR (starts as DRAFT) | JWT                  |
| `GET`    | `/requisitions?orgId=`      | List all PRs for an org           | JWT + org member     |
| `GET`    | `/requisitions/:id?orgId=`  | Get a single PR                   | JWT + org member     |
| `PATCH`  | `/requisitions/:id?orgId=`  | Update a DRAFT PR                 | JWT + requester only |
| `DELETE` | `/requisitions/:id?orgId=`  | Delete a DRAFT PR                 | JWT + requester only |
| `POST`   | `/requisitions/:id/submit`  | DRAFT → SUBMITTED                 | JWT + requester      |
| `POST`   | `/requisitions/:id/approve` | SUBMITTED → APPROVED              | JWT + approver role  |
| `POST`   | `/requisitions/:id/reject`  | SUBMITTED → REJECTED              | JWT + approver role  |

`ORDER` transition is not a public endpoint — it is called internally by the Purchase Order service when a PO is created.

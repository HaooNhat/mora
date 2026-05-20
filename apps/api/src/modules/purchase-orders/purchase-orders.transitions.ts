import { TransitionMap } from '@mora/api/common/state-machine/types';
import { PurchaseOrder, PurchaseOrderStatus } from '@prisma/client';
import { BUYER_ROLES, SUPPLIER_ROLES } from './purchase-orders.policy';

/**
 * User-facing events only.
 * System-triggered status changes (receipt, invoice, payment) are handled
 * directly by their respective service methods — they compute status from
 * aggregated data, not from a single event.
 */
export type PurchaseOrderEvent = 'SEND' | 'CONFIRM' | 'CANCEL';

/**
 * Declarative state machine for Purchase Orders.
 *
 * Read as: "from state X, event Y is allowed if guard passes, moving to state Z".
 *
 * Guards are pure synchronous functions — no DB calls, no side effects.
 * All DB writes happen in the service after the transition is validated.
 */
export const PURCHASE_ORDER_TRANSITIONS: TransitionMap<
  PurchaseOrderStatus,
  PurchaseOrderEvent,
  PurchaseOrder
> = {
  [PurchaseOrderStatus.SUBMITTED]: {
    SEND: {
      to: PurchaseOrderStatus.SENT,
      guard: ({ actor }) => BUYER_ROLES.includes(actor.role),
    },
    CANCEL: {
      to: PurchaseOrderStatus.CANCELLED,
      guard: ({ actor }) => BUYER_ROLES.includes(actor.role),
    },
  },

  [PurchaseOrderStatus.SENT]: {
    CONFIRM: {
      to: PurchaseOrderStatus.CONFIRMED,
      // The actor must be from the supplier org — verified by matching actor.orgId
      guard: ({ doc, actor }) =>
        actor.orgId === doc.supplierOrgId &&
        SUPPLIER_ROLES.includes(actor.role),
    },
    CANCEL: {
      to: PurchaseOrderStatus.CANCELLED,
      guard: ({ actor }) => BUYER_ROLES.includes(actor.role),
    },
  },

  [PurchaseOrderStatus.CONFIRMED]: {
    CANCEL: {
      to: PurchaseOrderStatus.CANCELLED,
      guard: ({ actor }) => BUYER_ROLES.includes(actor.role),
    },
  },
};

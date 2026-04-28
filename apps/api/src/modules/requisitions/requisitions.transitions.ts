import { TransitionMap } from '@mora/api/common/state-machine/types';
import {
  OrganizationRole,
  PurchaseRequisition,
  RequisitionStatus,
} from '@prisma/client';
import { canApprove } from './requisitions.policy';

export type RequisitionEvent = 'SUBMIT' | 'APPROVE' | 'REJECT' | 'ORDER';

/** Roles that can create and manage POs from approved PRs */
const BUYER_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.PROCUREMENT_MANAGER,
  OrganizationRole.BUYER,
];

/**
 * Declarative state machine for Purchase Requisitions.
 *
 * Read this as: "from state X, event Y is allowed if guard passes, moving to state Z".
 * Any (state, event) pair not listed here is automatically an invalid transition.
 *
 * Guards are pure synchronous functions — no DB calls, no side effects.
 * All effects (saving status, auto-approval, notifications) happen in the service.
 */
export const REQUISITION_TRANSITIONS: TransitionMap<
  RequisitionStatus,
  RequisitionEvent,
  PurchaseRequisition
> = {
  [RequisitionStatus.DRAFT]: {
    SUBMIT: {
      to: RequisitionStatus.SUBMITTED,
      // Only the requester can submit their own PR
      guard: ({ doc, actor }) => actor.id === doc.requestedBy,
    },
  },

  [RequisitionStatus.SUBMITTED]: {
    APPROVE: {
      to: RequisitionStatus.APPROVED,
      // Must have the right role AND cannot approve your own PR
      guard: ({ doc, actor }) =>
        actor.id !== doc.requestedBy &&
        canApprove(actor.role, Number(doc.totalAmount)),
    },
    REJECT: {
      to: RequisitionStatus.REJECTED,
      guard: ({ doc, actor }) =>
        actor.id !== doc.requestedBy &&
        canApprove(actor.role, Number(doc.totalAmount)),
      // Rejection reason must be provided in the payload
      requires: ['rejectedReason'],
    },
  },

  [RequisitionStatus.APPROVED]: {
    ORDER: {
      to: RequisitionStatus.ORDERED,
      // Called internally by the PO service when a PO is created from this PR
      guard: ({ actor }) => BUYER_ROLES.includes(actor.role),
    },
  },
};

import {
  ForbiddenTransitionException,
  InvalidTransitionException,
  MissingRequiredFieldException,
} from '@mora/api/common/state-machine/exceptions';
import { applyTransition } from '@mora/api/common/state-machine/state-machine';
import { Actor } from '@mora/api/common/state-machine/types';
import { OrganizationRole, RequisitionStatus } from '@prisma/client';
import { REQUISITION_TRANSITIONS } from '../requisitions.transitions';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(
  overrides: Partial<{
    status: RequisitionStatus;
    requestedBy: string;
    totalAmount: number;
  }> = {},
) {
  return {
    id: 'pr-1',
    status: RequisitionStatus.DRAFT,
    requestedBy: 'user-requester',
    totalAmount: 1000,
    organizationId: 'org-1',
    title: 'Test PR',
    description: null,
    approvedBy: null,
    approvedAt: null,
    rejectedReason: null,
    currency: 'USD',
    requestedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeActor(role: OrganizationRole, id = 'user-actor'): Actor {
  return { id, role, orgId: 'org-1' };
}

function run(
  doc: ReturnType<typeof makeDoc>,
  event: string,
  actor: Actor,
  payload?: Record<string, unknown>,
) {
  return applyTransition(
    REQUISITION_TRANSITIONS as any,
    doc as any,
    event as any,
    {
      doc: doc as any,
      actor,
      payload,
    },
  );
}

// ---------------------------------------------------------------------------
// SUBMIT
// ---------------------------------------------------------------------------

describe('SUBMIT', () => {
  it('transitions DRAFT → SUBMITTED when the requester submits', () => {
    const doc = makeDoc({
      status: RequisitionStatus.DRAFT,
      requestedBy: 'user-actor',
    });
    const actor = makeActor(OrganizationRole.VIEWER, 'user-actor');
    expect(run(doc, 'SUBMIT', actor)).toBe(RequisitionStatus.SUBMITTED);
  });

  it('throws ForbiddenTransitionException when a different user tries to submit', () => {
    const doc = makeDoc({
      status: RequisitionStatus.DRAFT,
      requestedBy: 'user-requester',
    });
    const actor = makeActor(OrganizationRole.ADMIN, 'user-other');
    expect(() => run(doc, 'SUBMIT', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws InvalidTransitionException when already SUBMITTED', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-actor',
    });
    const actor = makeActor(OrganizationRole.VIEWER, 'user-actor');
    expect(() => run(doc, 'SUBMIT', actor)).toThrow(InvalidTransitionException);
  });
});

// ---------------------------------------------------------------------------
// APPROVE
// ---------------------------------------------------------------------------

describe('APPROVE', () => {
  it('transitions SUBMITTED → APPROVED when an approver approves', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
    expect(run(doc, 'APPROVE', actor)).toBe(RequisitionStatus.APPROVED);
  });

  it('allows ADMIN to approve', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.ADMIN, 'user-admin');
    expect(run(doc, 'APPROVE', actor)).toBe(RequisitionStatus.APPROVED);
  });

  it('allows FINANCE_MANAGER to approve a high-value PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 6000,
    });
    const actor = makeActor(OrganizationRole.FINANCE_MANAGER, 'user-finance');
    expect(run(doc, 'APPROVE', actor)).toBe(RequisitionStatus.APPROVED);
  });

  it('throws ForbiddenTransitionException when requester tries to approve their own PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-actor',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-actor');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws ForbiddenTransitionException when VIEWER tries to approve', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.VIEWER, 'user-viewer');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws ForbiddenTransitionException when BUYER tries to approve (not an approver role)', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.BUYER, 'user-buyer');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws InvalidTransitionException when approving a DRAFT PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.DRAFT,
      requestedBy: 'user-requester',
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      InvalidTransitionException,
    );
  });

  it('throws InvalidTransitionException when approving an already APPROVED PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.APPROVED,
      requestedBy: 'user-requester',
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      InvalidTransitionException,
    );
  });
});

// ---------------------------------------------------------------------------
// REJECT
// ---------------------------------------------------------------------------

describe('REJECT', () => {
  it('transitions SUBMITTED → REJECTED when rejectedReason is provided', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
    expect(
      run(doc, 'REJECT', actor, { rejectedReason: 'Budget exceeded' }),
    ).toBe(RequisitionStatus.REJECTED);
  });

  it('throws MissingRequiredFieldException when rejectedReason is absent', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
    expect(() => run(doc, 'REJECT', actor)).toThrow(
      MissingRequiredFieldException,
    );
  });

  it('throws MissingRequiredFieldException when rejectedReason is empty string', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-approver');
    expect(() => run(doc, 'REJECT', actor, { rejectedReason: '' })).toThrow(
      MissingRequiredFieldException,
    );
  });

  it('throws ForbiddenTransitionException when requester rejects their own PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-actor',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.APPROVER, 'user-actor');
    expect(() => run(doc, 'REJECT', actor, { rejectedReason: 'nope' })).toThrow(
      ForbiddenTransitionException,
    );
  });
});

// ---------------------------------------------------------------------------
// ORDER
// ---------------------------------------------------------------------------

describe('ORDER', () => {
  it('transitions APPROVED → ORDERED when a BUYER calls it', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.BUYER, 'user-buyer');
    expect(run(doc, 'ORDER', actor)).toBe(RequisitionStatus.ORDERED);
  });

  it('allows PROCUREMENT_MANAGER to order', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.PROCUREMENT_MANAGER, 'user-pm');
    expect(run(doc, 'ORDER', actor)).toBe(RequisitionStatus.ORDERED);
  });

  it('throws ForbiddenTransitionException when VIEWER tries to order', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.VIEWER, 'user-viewer');
    expect(() => run(doc, 'ORDER', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws InvalidTransitionException when ordering a DRAFT PR', () => {
    const doc = makeDoc({ status: RequisitionStatus.DRAFT });
    const actor = makeActor(OrganizationRole.BUYER, 'user-buyer');
    expect(() => run(doc, 'ORDER', actor)).toThrow(InvalidTransitionException);
  });
});

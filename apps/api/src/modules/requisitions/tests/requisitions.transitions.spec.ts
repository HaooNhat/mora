import {
  ForbiddenTransitionException,
  InvalidTransitionException,
  MissingRequiredFieldException,
} from '@mora/api/common/state-machine/exceptions';
import { applyTransition } from '@mora/api/common/state-machine/state-machine';
import { Actor } from '@mora/api/common/state-machine/types';
import { OrganizationRole, RequisitionStatus } from '@prisma/client';
import { REQUISITION_TRANSITIONS } from '../requisitions.transitions';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDoc(
  overrides: Partial<{
    status: RequisitionStatus;
    requestedBy: string;
    totalAmount: number;
  }> = {},
) {
  return {
    id: 'pr-1',
    status: RequisitionStatus.SUBMITTED,
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
    { doc: doc as any, actor, payload },
  );
}

// ── APPROVE ───────────────────────────────────────────────────────────────────

describe('APPROVE', () => {
  it('transitions SUBMITTED → APPROVED when MANAGER approves (mid-value $1,000)', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(run(doc, 'APPROVE', actor)).toBe(RequisitionStatus.APPROVED);
  });

  it('allows OWNER to approve any amount (elevated role, bypasses tiers)', () => {
    const highValue = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 50_000,
    });
    expect(
      run(
        highValue,
        'APPROVE',
        makeActor(OrganizationRole.OWNER, 'user-owner'),
      ),
    ).toBe(RequisitionStatus.APPROVED);
  });

  it('allows OWNER to approve mid-value too', () => {
    const mid = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    expect(
      run(mid, 'APPROVE', makeActor(OrganizationRole.OWNER, 'user-owner')),
    ).toBe(RequisitionStatus.APPROVED);
  });

  it('throws ForbiddenTransitionException when MANAGER tries to approve a high-value PR ($5,000+)', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 6000,
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws ForbiddenTransitionException when FINANCE tries to approve', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.FINANCE, 'user-finance');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws ForbiddenTransitionException when STAFF tries to approve', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.STAFF, 'user-staff');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws ForbiddenTransitionException when requester tries to approve their own PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-actor',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-actor');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws InvalidTransitionException when approving an ORDERED PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.ORDERED,
      requestedBy: 'user-requester',
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      InvalidTransitionException,
    );
  });

  it('throws InvalidTransitionException when approving an already APPROVED PR', () => {
    const doc = makeDoc({
      status: RequisitionStatus.APPROVED,
      requestedBy: 'user-requester',
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(() => run(doc, 'APPROVE', actor)).toThrow(
      InvalidTransitionException,
    );
  });
});

// ── REJECT ────────────────────────────────────────────────────────────────────

describe('REJECT', () => {
  it('transitions SUBMITTED → REJECTED when rejectedReason is provided', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(
      run(doc, 'REJECT', actor, { rejectedReason: 'Budget exceeded' }),
    ).toBe(RequisitionStatus.REJECTED);
  });

  it('OWNER can reject any amount', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 50_000,
    });
    const actor = makeActor(OrganizationRole.OWNER, 'user-owner');
    expect(
      run(doc, 'REJECT', actor, { rejectedReason: 'Deferred to next quarter' }),
    ).toBe(RequisitionStatus.REJECTED);
  });

  it('throws MissingRequiredFieldException when rejectedReason is absent', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(() => run(doc, 'REJECT', actor)).toThrow(
      MissingRequiredFieldException,
    );
  });

  it('throws MissingRequiredFieldException when rejectedReason is an empty string', () => {
    const doc = makeDoc({
      status: RequisitionStatus.SUBMITTED,
      requestedBy: 'user-requester',
      totalAmount: 1000,
    });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
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
    const actor = makeActor(OrganizationRole.MANAGER, 'user-actor');
    expect(() => run(doc, 'REJECT', actor, { rejectedReason: 'nope' })).toThrow(
      ForbiddenTransitionException,
    );
  });
});

// ── ORDER ─────────────────────────────────────────────────────────────────────

describe('ORDER', () => {
  it('transitions APPROVED → ORDERED when FINANCE triggers it (PO creation)', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.FINANCE, 'user-finance');
    expect(run(doc, 'ORDER', actor)).toBe(RequisitionStatus.ORDERED);
  });

  it('allows OWNER to order', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.OWNER, 'user-owner');
    expect(run(doc, 'ORDER', actor)).toBe(RequisitionStatus.ORDERED);
  });

  it('throws ForbiddenTransitionException when MANAGER tries to order (not a PO role)', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.MANAGER, 'user-manager');
    expect(() => run(doc, 'ORDER', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws ForbiddenTransitionException when STAFF tries to order', () => {
    const doc = makeDoc({ status: RequisitionStatus.APPROVED });
    const actor = makeActor(OrganizationRole.STAFF, 'user-staff');
    expect(() => run(doc, 'ORDER', actor)).toThrow(
      ForbiddenTransitionException,
    );
  });

  it('throws InvalidTransitionException when ordering a SUBMITTED PR', () => {
    const doc = makeDoc({ status: RequisitionStatus.SUBMITTED });
    const actor = makeActor(OrganizationRole.FINANCE, 'user-finance');
    expect(() => run(doc, 'ORDER', actor)).toThrow(InvalidTransitionException);
  });
});

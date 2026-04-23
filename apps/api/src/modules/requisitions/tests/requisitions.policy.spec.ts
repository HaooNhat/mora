import { OrganizationRole } from '@prisma/client';
import {
  canApprove,
  isAutoApproved,
  resolveRequiredApproverRoles,
} from '../requisitions.policy';

describe('resolveRequiredApproverRoles', () => {
  it('returns empty array for amounts under $500 (auto-approve tier)', () => {
    expect(resolveRequiredApproverRoles(0)).toEqual([]);
    expect(resolveRequiredApproverRoles(1)).toEqual([]);
    expect(resolveRequiredApproverRoles(499)).toEqual([]);
    expect(resolveRequiredApproverRoles(499.99)).toEqual([]);
  });

  it('returns [APPROVER] for amounts from $500 to $4,999', () => {
    expect(resolveRequiredApproverRoles(500)).toEqual([
      OrganizationRole.APPROVER,
    ]);
    expect(resolveRequiredApproverRoles(1000)).toEqual([
      OrganizationRole.APPROVER,
    ]);
    expect(resolveRequiredApproverRoles(4999)).toEqual([
      OrganizationRole.APPROVER,
    ]);
    expect(resolveRequiredApproverRoles(4999.99)).toEqual([
      OrganizationRole.APPROVER,
    ]);
  });

  it('returns [APPROVER, FINANCE_MANAGER] for amounts $5,000 and above', () => {
    expect(resolveRequiredApproverRoles(5000)).toEqual([
      OrganizationRole.APPROVER,
      OrganizationRole.FINANCE_MANAGER,
    ]);
    expect(resolveRequiredApproverRoles(10_000)).toEqual([
      OrganizationRole.APPROVER,
      OrganizationRole.FINANCE_MANAGER,
    ]);
    expect(resolveRequiredApproverRoles(999_999)).toEqual([
      OrganizationRole.APPROVER,
      OrganizationRole.FINANCE_MANAGER,
    ]);
  });
});

describe('isAutoApproved', () => {
  it('returns true for amounts under $500', () => {
    expect(isAutoApproved(0)).toBe(true);
    expect(isAutoApproved(499)).toBe(true);
  });

  it('returns false for amounts $500 and above', () => {
    expect(isAutoApproved(500)).toBe(false);
    expect(isAutoApproved(5000)).toBe(false);
  });
});

describe('canApprove', () => {
  describe('auto-approve tier (under $500)', () => {
    it('returns true for any role', () => {
      expect(canApprove(OrganizationRole.VIEWER, 100)).toBe(true);
      expect(canApprove(OrganizationRole.BUYER, 100)).toBe(true);
    });
  });

  describe('mid tier ($500–$4,999)', () => {
    it('returns true for APPROVER', () => {
      expect(canApprove(OrganizationRole.APPROVER, 1000)).toBe(true);
    });

    it('returns true for elevated roles (OWNER, ADMIN, PROCUREMENT_MANAGER)', () => {
      expect(canApprove(OrganizationRole.OWNER, 1000)).toBe(true);
      expect(canApprove(OrganizationRole.ADMIN, 1000)).toBe(true);
      expect(canApprove(OrganizationRole.PROCUREMENT_MANAGER, 1000)).toBe(true);
    });

    it('returns false for FINANCE_MANAGER on mid-tier (not in required roles)', () => {
      expect(canApprove(OrganizationRole.FINANCE_MANAGER, 1000)).toBe(false);
    });

    it('returns false for BUYER', () => {
      expect(canApprove(OrganizationRole.BUYER, 1000)).toBe(false);
    });

    it('returns false for VIEWER', () => {
      expect(canApprove(OrganizationRole.VIEWER, 1000)).toBe(false);
    });
  });

  describe('high-value tier ($5,000+)', () => {
    it('returns true for FINANCE_MANAGER', () => {
      expect(canApprove(OrganizationRole.FINANCE_MANAGER, 6000)).toBe(true);
    });

    it('returns true for APPROVER', () => {
      expect(canApprove(OrganizationRole.APPROVER, 6000)).toBe(true);
    });

    it('returns false for BUYER', () => {
      expect(canApprove(OrganizationRole.BUYER, 6000)).toBe(false);
    });

    it('returns false for VIEWER', () => {
      expect(canApprove(OrganizationRole.VIEWER, 6000)).toBe(false);
    });
  });
});

import { OrganizationRole } from '@prisma/client';
import {
  canApprove,
  resolveRequiredApproverRoles,
} from '../requisitions.policy';

describe('resolveRequiredApproverRoles', () => {
  it('returns [] for amounts under $500 (auto-approve tier)', () => {
    expect(resolveRequiredApproverRoles(0)).toEqual([]);
    expect(resolveRequiredApproverRoles(1)).toEqual([]);
    expect(resolveRequiredApproverRoles(499)).toEqual([]);
    expect(resolveRequiredApproverRoles(499.99)).toEqual([]);
  });

  it('returns [MANAGER] for amounts $500–$4,999', () => {
    expect(resolveRequiredApproverRoles(500)).toEqual([
      OrganizationRole.MANAGER,
    ]);
    expect(resolveRequiredApproverRoles(1000)).toEqual([
      OrganizationRole.MANAGER,
    ]);
    expect(resolveRequiredApproverRoles(4999)).toEqual([
      OrganizationRole.MANAGER,
    ]);
    expect(resolveRequiredApproverRoles(4999.99)).toEqual([
      OrganizationRole.MANAGER,
    ]);
  });

  it('returns [OWNER] for amounts $5,000 and above', () => {
    expect(resolveRequiredApproverRoles(5000)).toEqual([
      OrganizationRole.OWNER,
    ]);
    expect(resolveRequiredApproverRoles(10_000)).toEqual([
      OrganizationRole.OWNER,
    ]);
    expect(resolveRequiredApproverRoles(999_999)).toEqual([
      OrganizationRole.OWNER,
    ]);
  });
});

describe('canApprove', () => {
  describe('auto-approve tier (under $500)', () => {
    it('returns true for any role since no approval is required', () => {
      expect(canApprove(OrganizationRole.STAFF, 100)).toBe(true);
      expect(canApprove(OrganizationRole.FINANCE, 100)).toBe(true);
      expect(canApprove(OrganizationRole.MANAGER, 100)).toBe(true);
    });
  });

  describe('mid tier ($500–$4,999)', () => {
    it('returns true for MANAGER', () => {
      expect(canApprove(OrganizationRole.MANAGER, 1000)).toBe(true);
    });

    it('returns true for OWNER (elevated — bypasses all tiers)', () => {
      expect(canApprove(OrganizationRole.OWNER, 1000)).toBe(true);
    });

    it('returns false for FINANCE (not an approver role)', () => {
      expect(canApprove(OrganizationRole.FINANCE, 1000)).toBe(false);
    });

    it('returns false for STAFF', () => {
      expect(canApprove(OrganizationRole.STAFF, 1000)).toBe(false);
    });
  });

  describe('high-value tier ($5,000+)', () => {
    it('returns true for OWNER (elevated + required role)', () => {
      expect(canApprove(OrganizationRole.OWNER, 6000)).toBe(true);
    });

    it('returns false for MANAGER (mid-tier approver, not elevated)', () => {
      expect(canApprove(OrganizationRole.MANAGER, 6000)).toBe(false);
    });

    it('returns false for FINANCE', () => {
      expect(canApprove(OrganizationRole.FINANCE, 6000)).toBe(false);
    });

    it('returns false for STAFF', () => {
      expect(canApprove(OrganizationRole.STAFF, 6000)).toBe(false);
    });
  });
});

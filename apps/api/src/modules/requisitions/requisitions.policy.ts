import { OrganizationRole } from '@prisma/client';

/**
 * Approval threshold configuration.
 *
 * Each tier defines:
 *   - `below`  — the exclusive upper bound for this tier (use Infinity for the last tier)
 *   - `roles`  — which roles must approve a PR in this tier
 *
 * An empty `roles` array means the PR is auto-approved by the system.
 *
 * To change thresholds, edit this array — nothing else needs to change.
 */
export const APPROVAL_THRESHOLDS: {
  below: number;
  roles: OrganizationRole[];
}[] = [
  { below: 500, roles: [] }, // auto-approved by the system
  { below: 5_000, roles: [OrganizationRole.MANAGER] }, // MANAGER approves mid-range
  { below: Infinity, roles: [OrganizationRole.OWNER] }, // only OWNER for high-value
];

/**
 * Returns the roles required to approve a PR of the given amount.
 * Returns an empty array if the PR should be auto-approved.
 */
export function resolveRequiredApproverRoles(
  amount: number,
): OrganizationRole[] {
  const tier = APPROVAL_THRESHOLDS.find((t) => amount < t.below);
  return tier?.roles ?? [OrganizationRole.OWNER];
}

/**
 * Roles that can approve any PR regardless of amount.
 * These bypass threshold checks entirely.
 */
const ELEVATED_APPROVER_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER, // full access + payment approval — bypasses all tiers
];

/**
 * Returns true if the given role is sufficient to approve a PR
 * of the given amount.
 */
export function canApprove(role: OrganizationRole, amount: number): boolean {
  if (ELEVATED_APPROVER_ROLES.includes(role)) return true;
  const required = resolveRequiredApproverRoles(amount);
  if (required.length === 0) return true;
  return required.includes(role);
}

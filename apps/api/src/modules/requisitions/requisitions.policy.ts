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
  { below: 500, roles: [] },
  { below: 5_000, roles: [OrganizationRole.APPROVER] },
  {
    below: Infinity,
    roles: [OrganizationRole.APPROVER, OrganizationRole.FINANCE_MANAGER],
  },
];

/**
 * Returns the roles required to approve a PR of the given amount.
 * Returns an empty array if the PR should be auto-approved.
 */
export function resolveRequiredApproverRoles(
  amount: number,
): OrganizationRole[] {
  const tier = APPROVAL_THRESHOLDS.find((t) => amount < t.below);
  return (
    tier?.roles ?? [OrganizationRole.APPROVER, OrganizationRole.FINANCE_MANAGER]
  );
}

/**
 * Returns true if the PR amount qualifies for automatic approval
 * (no human approver required).
 */
export function isAutoApproved(amount: number): boolean {
  return resolveRequiredApproverRoles(amount).length === 0;
}

/**
 * Roles that can approve any PR regardless of amount.
 * These bypass threshold checks entirely.
 */
const ELEVATED_APPROVER_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER,
  OrganizationRole.ADMIN,
  OrganizationRole.PROCUREMENT_MANAGER,
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

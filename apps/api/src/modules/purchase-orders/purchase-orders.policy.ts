import { OrganizationRole } from '@prisma/client';

/**
 * Roles that can create, send, and cancel POs on behalf of the buying org.
 */
export const BUYER_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER, // full access
  OrganizationRole.FINANCE, // creates POs, sends POs
];

/**
 * Roles that can confirm a PO on behalf of the supplier org.
 */
export const SUPPLIER_ROLES: OrganizationRole[] = [
  OrganizationRole.OWNER, // full access
  OrganizationRole.FINANCE, // manages supplier-side financial transactions
];

export function canCreateOrder(role: OrganizationRole): boolean {
  return BUYER_ROLES.includes(role);
}

export function canConfirmOrder(role: OrganizationRole): boolean {
  return SUPPLIER_ROLES.includes(role);
}

export function canCancelOrder(role: OrganizationRole): boolean {
  return BUYER_ROLES.includes(role);
}

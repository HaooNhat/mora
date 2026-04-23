import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrganizationType = "BUYER" | "SUPPLIER" | "BOTH";

export type OrganizationRole =
  | "OWNER"
  | "ADMIN"
  | "PROCUREMENT_MANAGER"
  | "BUYER"
  | "APPROVER"
  | "FINANCE_MANAGER"
  | "SUPPLIER_MANAGER"
  | "VIEWER";

export interface Organization {
  id: string;
  name: string;
  legalName: string | null;
  type: OrganizationType;
  logo: string | null;
  role: OrganizationRole;
  createdAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  legalName?: string;
}

interface DataResponse<T> {
  data: T;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const organizationsService = {
  /** List organizations the current user belongs to, with their role. */
  getMyOrganizations: () =>
    api.get<DataResponse<Organization[]>>("/organizations/me"),

  /** Create a new organization — current user becomes OWNER. */
  create: (input: CreateOrganizationInput) =>
    api.post<DataResponse<Organization>>("/organizations", input),
};

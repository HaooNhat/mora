"use client";

import type { Organization } from "@/features/organizations/services/organizations.service";
import { createContext, useContext } from "react";

interface OrgContextValue {
  activeOrg: Organization | null;
  organizations: Organization[];
  setActiveOrg: (org: Organization) => void;
}

// TODO: Change this to using zustand
export const OrgContext = createContext<OrgContextValue>({
  activeOrg: null,
  organizations: [],
  setActiveOrg: () => {},
});

export function useOrgContext() {
  return useContext(OrgContext);
}

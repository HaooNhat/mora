"use client";

import { useOrgContext } from "@/features/dashboard/context/org-context";
import { RequisitionList } from "@/features/requisitions/components/requisition-list";

export default function RequisitionsPage() {
  const { activeOrg } = useOrgContext();
  return <RequisitionList orgId={activeOrg?.id ?? ""} />;
}

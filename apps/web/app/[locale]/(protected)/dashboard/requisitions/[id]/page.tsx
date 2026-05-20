"use client";

import { useOrgContext } from "@/features/dashboard/context/org-context";
import { RequisitionDetail } from "@/features/requisitions/components/requisition-detail";
import { useParams } from "next/navigation";

export default function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeOrg } = useOrgContext();
  return (
    <RequisitionDetail
      id={id}
      orgId={activeOrg?.id ?? ""}
      orgRole={activeOrg?.role ?? null}
    />
  );
}

"use client";

import { useOrgContext } from "@/features/dashboard/context/org-context";
import { PurchaseOrderDetail } from "@/features/purchase-orders/components/purchase-order-detail";
import { useParams } from "next/navigation";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { activeOrg } = useOrgContext();
  return (
    <PurchaseOrderDetail
      id={id}
      orgId={activeOrg?.id ?? ""}
      orgRole={activeOrg?.role ?? null}
    />
  );
}

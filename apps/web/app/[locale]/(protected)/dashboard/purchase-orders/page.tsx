"use client";

import { useOrgContext } from "@/features/dashboard/context/org-context";
import { PurchaseOrderList } from "@/features/purchase-orders/components/purchase-order-list";

export default function PurchaseOrdersPage() {
  const { activeOrg } = useOrgContext();
  return <PurchaseOrderList orgId={activeOrg?.id ?? ""} />;
}

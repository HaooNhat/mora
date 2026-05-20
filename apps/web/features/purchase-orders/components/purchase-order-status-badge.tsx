"use client";

import { useTranslations } from "next-intl";
import type { PurchaseOrderStatus } from "../services/purchase-orders.service";

const styles: Record<PurchaseOrderStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONFIRMED:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  PARTIALLY_RECEIVED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  RECEIVED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INVOICED:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  CLOSED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PurchaseOrderStatusBadge({
  status,
}: {
  status: PurchaseOrderStatus;
}) {
  const t = useTranslations("purchaseOrders.status");
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {t(status)}
    </span>
  );
}

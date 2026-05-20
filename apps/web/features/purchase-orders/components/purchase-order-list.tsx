"use client";

import { Button } from "@mora/ui/components/button";
import { format } from "date-fns";
import { Loader2, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { usePurchaseOrders } from "../hooks/use-purchase-orders";
import type { PurchaseOrderStatus } from "../services/purchase-orders.service";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";

interface PurchaseOrderListProps {
  orgId: string;
}

const STATUSES: { value: PurchaseOrderStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PARTIALLY_RECEIVED", label: "Part. Received" },
  { value: "RECEIVED", label: "Received" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "CLOSED", label: "Closed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function PurchaseOrderList({ orgId }: PurchaseOrderListProps) {
  const t = useTranslations("purchaseOrders");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [selected, setSelected] = useState<Set<PurchaseOrderStatus>>(new Set());

  const { data, isLoading, isError } = usePurchaseOrders(orgId || null);

  function toggle(status: PurchaseOrderStatus) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-16 text-destructive text-sm">{tCommon("error")}</div>;
  }

  const all = data?.data ?? [];
  const filtered = selected.size === 0 ? all : all.filter((po) => selected.has(po.status as PurchaseOrderStatus));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t("title")}</h2>
        <Link href={`/${locale}/dashboard/requisitions`}>
          <Button variant="outline" className="text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            From Requisitions
          </Button>
        </Link>
      </div>

      {/* Multi-select filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground mr-1">Show:</span>
        {STATUSES.map(({ value, label }) => {
          const count = all.filter((po) => po.status === value).length;
          const isOn = selected.has(value);
          return (
            <button
              key={value}
              onClick={() => toggle(value)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                isOn
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {label}
              <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
        {selected.size > 0 && (
          <button
            onClick={() => setSelected(new Set())}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-5 mb-4">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{t("noOrders")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {selected.size > 0 ? "No items match the selected filters." : t("noOrdersHint")}
          </p>
          <Link href={`/${locale}/dashboard/requisitions`} className="mt-4">
            <Button variant="outline" className="text-sm">Go to Requisitions →</Button>
          </Link>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Supplier</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">{t("totalAmount")}</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">{t("orderDate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((po) => (
                <tr
                  key={po.id}
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => (window.location.href = `/${locale}/dashboard/purchase-orders/${po.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono font-medium text-foreground text-xs">{po.id.slice(0, 8).toUpperCase()}</div>
                    {po.requisitionId && (
                      <div className="text-xs text-muted-foreground mt-0.5">PR: {po.requisitionId.slice(0, 8).toUpperCase()}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                      {po.supplierOrgId.slice(0, 12)}…
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground hidden sm:table-cell">
                    {new Intl.NumberFormat(undefined, { style: "currency", currency: po.currency }).format(po.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PurchaseOrderStatusBadge status={po.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                    {format(new Date(po.orderDate), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

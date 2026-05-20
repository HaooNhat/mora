"use client";

import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { usePayments } from "@/features/payments/hooks/use-payments";
import { usePurchaseOrders } from "@/features/purchase-orders/hooks/use-purchase-orders";
import { useRequisitions } from "@/features/requisitions/hooks/use-requisitions";
import { CreditCard, FileText, Receipt, ShoppingCart } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

interface SummaryCardsProps {
  orgId: string;
}

export function SummaryCards({ orgId }: SummaryCardsProps) {
  const locale = useLocale();

  const { data: reqData, isLoading: reqLoading } = useRequisitions(orgId);
  const { data: poData, isLoading: poLoading } = usePurchaseOrders(orgId);
  const { data: invData, isLoading: invLoading } = useInvoices(orgId);
  const { data: payData, isLoading: payLoading } = usePayments(orgId);

  const cards = [
    {
      label: "Requisitions",
      icon: FileText,
      total: reqData?.total,
      loading: reqLoading,
      href: `/${locale}/dashboard/requisitions`,
    },
    {
      label: "Purchase Orders",
      icon: ShoppingCart,
      total: poData?.total,
      loading: poLoading,
      href: `/${locale}/dashboard/purchase-orders`,
    },
    {
      label: "Invoices",
      icon: Receipt,
      total: invData?.total,
      loading: invLoading,
      href: `/${locale}/dashboard/invoices`,
    },
    {
      label: "Payments",
      icon: CreditCard,
      total: payData?.total,
      loading: payLoading,
      href: `/${locale}/dashboard/payments`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, icon: Icon, total, loading, href }) => (
        <Link key={label} href={href}>
          <div className="bg-card border border-border rounded-lg p-4 hover:bg-secondary/30 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {label}
              </span>
              <div className="p-1.5 rounded-md bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">
              {loading ? "—" : (total ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">
              View all →
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

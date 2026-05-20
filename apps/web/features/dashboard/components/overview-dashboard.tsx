"use client";

import { useAuth } from "@/features/auth";
import { useOrgContext } from "@/features/dashboard/context/org-context";
import { useInvoices } from "@/features/invoices/hooks/use-invoices";
import { usePayments } from "@/features/payments/hooks/use-payments";
import { usePurchaseOrders } from "@/features/purchase-orders/hooks/use-purchase-orders";
import { useRequisitions } from "@/features/requisitions/hooks/use-requisitions";
import { format, isPast } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  FileText,
  Receipt,
  ShoppingCart,
} from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

export function OverviewDashboard() {
  const locale = useLocale();
  const { user } = useAuth();
  const { activeOrg } = useOrgContext();
  const orgId = activeOrg?.id ?? null;

  const { data: reqData } = useRequisitions(orgId);
  const { data: poData } = usePurchaseOrders(orgId);
  const { data: invData } = useInvoices(orgId ?? "");
  const { data: payData } = usePayments(orgId ?? "");

  const requisitions = reqData?.data ?? [];
  const orders = poData?.data ?? [];
  const invoices = invData?.data ?? [];
  const payments = payData?.data ?? [];

  const pendingApproval = requisitions.filter((r) => r.status === "SUBMITTED");
  const exceptionInvoices = invoices.filter((i) => i.status === "EXCEPTION");
  const pendingPayments = payments.filter((p) => p.status === "PENDING");
  const overdueInvoices = invoices.filter(
    (i) =>
      i.status !== "PAID" &&
      i.status !== "REJECTED" &&
      isPast(new Date(i.dueDate)),
  );

  const urgentCount =
    pendingApproval.length + exceptionInvoices.length + overdueInvoices.length;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "";

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}
          {firstName ? `, ${firstName}` : ""}.
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeOrg?.name} ·{" "}
          {urgentCount > 0
            ? `${urgentCount} item${urgentCount > 1 ? "s" : ""} need your attention`
            : "Everything is up to date"}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          href={`/${locale}/dashboard/requisitions`}
          icon={FileText}
          label="Requisitions"
          total={reqData?.total}
          sub={
            pendingApproval.length > 0
              ? `${pendingApproval.length} pending approval`
              : undefined
          }
          subUrgent={pendingApproval.length > 0}
        />
        <MetricCard
          href={`/${locale}/dashboard/purchase-orders`}
          icon={ShoppingCart}
          label="Purchase Orders"
          total={poData?.total}
          sub={
            orders.filter((o) => o.status === "SENT").length > 0
              ? `${orders.filter((o) => o.status === "SENT").length} awaiting confirmation`
              : undefined
          }
        />
        <MetricCard
          href={`/${locale}/dashboard/invoices`}
          icon={Receipt}
          label="Invoices"
          total={invData?.total}
          sub={
            exceptionInvoices.length > 0
              ? `${exceptionInvoices.length} exception`
              : undefined
          }
          subUrgent={exceptionInvoices.length > 0}
        />
        <MetricCard
          href={`/${locale}/dashboard/payments`}
          icon={CreditCard}
          label="Payments"
          total={payData?.total}
          sub={
            pendingPayments.length > 0
              ? `${pendingPayments.length} pending`
              : undefined
          }
          subUrgent={pendingPayments.length > 0}
        />
      </div>

      {/* Needs attention */}
      {urgentCount > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-foreground">
              Needs attention
            </h2>
          </div>
          <div className="space-y-2">
            {pendingApproval.length > 0 && (
              <AttentionBlock
                href={`/${locale}/dashboard/requisitions`}
                label={`${pendingApproval.length} requisition${pendingApproval.length > 1 ? "s" : ""} awaiting approval`}
                color="amber"
              >
                {pendingApproval.slice(0, 3).map((r) => (
                  <AttentionRow
                    key={r.id}
                    href={`/${locale}/dashboard/requisitions/${r.id}`}
                    title={r.title}
                    meta={new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: r.currency,
                    }).format(r.totalAmount)}
                    date={format(new Date(r.createdAt), "MMM d")}
                  />
                ))}
              </AttentionBlock>
            )}

            {exceptionInvoices.length > 0 && (
              <AttentionBlock
                href={`/${locale}/dashboard/invoices`}
                label={`${exceptionInvoices.length} invoice${exceptionInvoices.length > 1 ? "s" : ""} failed 3-way match`}
                color="red"
              >
                {exceptionInvoices.slice(0, 3).map((inv) => (
                  <AttentionRow
                    key={inv.id}
                    href={`/${locale}/dashboard/invoices/${inv.id}`}
                    title={`INV-${inv.id.slice(0, 8).toUpperCase()}`}
                    meta={new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: inv.currency,
                    }).format(inv.totalAmount)}
                    date={`Due ${format(new Date(inv.dueDate), "MMM d")}`}
                  />
                ))}
              </AttentionBlock>
            )}

            {overdueInvoices.length > 0 && (
              <AttentionBlock
                href={`/${locale}/dashboard/invoices`}
                label={`${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}`}
                color="red"
              >
                {overdueInvoices.slice(0, 3).map((inv) => (
                  <AttentionRow
                    key={inv.id}
                    href={`/${locale}/dashboard/invoices/${inv.id}`}
                    title={`INV-${inv.id.slice(0, 8).toUpperCase()}`}
                    meta={new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: inv.currency,
                    }).format(inv.totalAmount)}
                    date={`Due ${format(new Date(inv.dueDate), "MMM d")}`}
                  />
                ))}
              </AttentionBlock>
            )}
          </div>
        </section>
      )}

      {/* Recent activity — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentSection
          title="Recent Requisitions"
          href={`/${locale}/dashboard/requisitions`}
          empty={requisitions.length === 0}
          emptyText="No requisitions yet."
        >
          {requisitions.slice(0, 5).map((r) => (
            <Link
              key={r.id}
              href={`/${locale}/dashboard/requisitions/${r.id}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/40 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(r.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm tabular-nums text-foreground">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: r.currency,
                  }).format(r.totalAmount)}
                </span>
                <StatusDot status={r.status} />
              </div>
            </Link>
          ))}
        </RecentSection>

        <RecentSection
          title="Recent Purchase Orders"
          href={`/${locale}/dashboard/purchase-orders`}
          empty={orders.length === 0}
          emptyText="No purchase orders yet."
        >
          {orders.slice(0, 5).map((po) => (
            <Link
              key={po.id}
              href={`/${locale}/dashboard/purchase-orders/${po.id}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-secondary/40 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground font-mono">
                  {po.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(po.orderDate), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm tabular-nums text-foreground">
                  {new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: po.currency,
                  }).format(po.totalAmount)}
                </span>
                <StatusDot status={po.status} />
              </div>
            </Link>
          ))}
        </RecentSection>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  href,
  icon: Icon,
  label,
  total,
  sub,
  subUrgent,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  total?: number;
  sub?: string;
  subUrgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group bg-card border border-border rounded-xl p-4 hover:-translate-y-0.5 hover:border-foreground/30 transition-transform duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-semibold text-foreground tabular-nums">
        {total ?? "—"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {sub && (
        <p
          className={`text-xs mt-1.5 font-medium ${subUrgent ? "text-amber-500 dark:text-amber-400" : "text-muted-foreground"}`}
        >
          {sub}
        </p>
      )}
    </Link>
  );
}

function AttentionBlock({
  href,
  label,
  color,
  children,
}: {
  href: string;
  label: string;
  color: "amber" | "red";
  children: React.ReactNode;
}) {
  const dot = color === "amber" ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-xs font-medium text-foreground">{label}</span>
        </div>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

function AttentionRow({
  href,
  title,
  meta,
  date,
}: {
  href: string;
  title: string;
  meta: string;
  date: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-secondary/40 transition-colors"
    >
      <span className="text-sm text-foreground truncate max-w-[200px]">
        {title}
      </span>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        <span className="text-sm tabular-nums text-foreground">{meta}</span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>
    </Link>
  );
}

function RecentSection({
  title,
  href,
  empty,
  emptyText,
  children,
}: {
  title: string;
  href: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link
          href={href}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all →
        </Link>
      </div>
      {empty ? (
        <p className="text-xs text-muted-foreground px-4 py-6 text-center">
          {emptyText}
        </p>
      ) : (
        <div className="px-1 py-1">{children}</div>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-400",
  SUBMITTED: "bg-amber-400",
  APPROVED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  ORDERED: "bg-teal-500",
  SENT: "bg-amber-400",
  CONFIRMED: "bg-emerald-500",
  PARTIALLY_RECEIVED: "bg-sky-400",
  RECEIVED: "bg-teal-500",
  INVOICED: "bg-violet-400",
  CLOSED: "bg-zinc-400",
  CANCELLED: "bg-red-500",
  DRAFT_INV: "bg-zinc-400",
  EXCEPTION: "bg-red-500",
  MATCHED: "bg-emerald-500",
  PENDING_MATCH: "bg-amber-400",
  PAID: "bg-teal-500",
  PENDING: "bg-amber-400",
  SUCCESS: "bg-emerald-500",
  FAILED: "bg-red-500",
};

function StatusDot({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? "bg-zinc-400";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

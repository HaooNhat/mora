"use client";

import { useAuth } from "@/features/auth";
import { useOrgContext } from "@/features/dashboard/context/org-context";
import { useRequisitions } from "@/features/requisitions/hooks/use-requisitions";
import type { OrganizationRole } from "@/features/organizations/services/organizations.service";
import { format } from "date-fns";
import { CheckCircle2, Clock, ShieldCheck, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";

// ─── Role metadata ────────────────────────────────────────────────────────────

const ROLE_META: Record<
  OrganizationRole,
  {
    label: string;
    tier: "elevated" | "approver" | "operational" | "supplier" | "viewer";
    authority: string;
    capabilities: string[];
  }
> = {
  OWNER: {
    label: "Owner",
    tier: "elevated",
    authority: "Unlimited — can approve any amount",
    capabilities: [
      "Approve requisitions of any amount",
      "Create and manage purchase orders",
      "Resolve invoice exceptions",
      "Record and manage payments",
      "Manage organization members and settings",
    ],
  },
  ADMIN: {
    label: "Admin",
    tier: "elevated",
    authority: "Unlimited — can approve any amount",
    capabilities: [
      "Approve requisitions of any amount",
      "Create and manage purchase orders",
      "Resolve invoice exceptions",
      "Record and manage payments",
      "Manage organization members",
    ],
  },
  PROCUREMENT_MANAGER: {
    label: "Procurement Manager",
    tier: "elevated",
    authority: "Unlimited — can approve any amount",
    capabilities: [
      "Approve requisitions of any amount",
      "Create and manage purchase orders",
      "Oversee full procurement workflow",
    ],
  },
  APPROVER: {
    label: "Approver",
    tier: "approver",
    authority: "Up to $4,999 per requisition",
    capabilities: [
      "Approve requisitions between $500 and $4,999",
      "Cannot approve own requisitions",
      "Cannot approve requisitions above $5,000",
    ],
  },
  FINANCE_MANAGER: {
    label: "Finance Manager",
    tier: "approver",
    authority: "$5,000 and above (jointly with Approver)",
    capabilities: [
      "Approve high-value requisitions ($5,000+)",
      "Resolve invoice exceptions (3-way match failures)",
      "Record payments against approved invoices",
    ],
  },
  BUYER: {
    label: "Buyer",
    tier: "operational",
    authority: "No approval authority",
    capabilities: [
      "Create purchase requisitions",
      "Create and send purchase orders to suppliers",
      "Cannot approve requisitions",
    ],
  },
  SUPPLIER_MANAGER: {
    label: "Supplier Manager",
    tier: "supplier",
    authority: "Supplier-side operations only",
    capabilities: [
      "Confirm purchase orders (as supplier)",
      "Create and submit invoices against purchase orders",
    ],
  },
  VIEWER: {
    label: "Viewer",
    tier: "viewer",
    authority: "No approval authority",
    capabilities: ["Read-only access to all documents"],
  },
};

const TIER_BADGE: Record<string, string> = {
  elevated:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  approver:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  operational: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  supplier:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  viewer: "bg-secondary text-muted-foreground",
};

// ─── Approval thresholds (mirrors API policy) ─────────────────────────────────

const THRESHOLDS = [
  {
    label: "Under $500",
    range: "< $500",
    roles: [] as OrganizationRole[],
    description: "Auto-approved",
  },
  {
    label: "$500 – $4,999",
    range: "$500–$4,999",
    roles: ["APPROVER"] as OrganizationRole[],
    description: "Requires Approver",
  },
  {
    label: "$5,000 and above",
    range: "$5,000+",
    roles: ["APPROVER", "FINANCE_MANAGER"] as OrganizationRole[],
    description: "Requires Approver + Finance Manager",
  },
];

const ELEVATED: OrganizationRole[] = ["OWNER", "ADMIN", "PROCUREMENT_MANAGER"];

function canHandleTier(
  role: OrganizationRole,
  tierRoles: OrganizationRole[],
): boolean {
  if (ELEVATED.includes(role)) return true;
  if (tierRoles.length === 0) return true; // auto-approved tiers everyone "handles"
  return tierRoles.includes(role);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const locale = useLocale();
  const { user } = useAuth();
  const { activeOrg } = useOrgContext();

  const role = (activeOrg?.role ?? "VIEWER") as OrganizationRole;
  const meta = ROLE_META[role];
  const orgId = activeOrg?.id ?? null;

  const { data: reqData } = useRequisitions(orgId);
  const allReqs = reqData?.data ?? [];

  const myRequests = allReqs.filter((r) => r.requestedBy === user?.id);
  const myDecisions = allReqs.filter((r) => r.approvedBy === user?.id);

  // Higher roles can see all decisions in the org; lower roles only see their own
  const canSeeAllDecisions =
    ELEVATED.includes(role) ||
    role === "APPROVER" ||
    role === "FINANCE_MANAGER";

  const initials = (() => {
    if (user?.firstName && user?.lastName)
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    if (user?.firstName) return user.firstName.slice(0, 2).toUpperCase();
    return user?.email?.slice(0, 2).toUpperCase() ?? "?";
  })();

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "";

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold text-foreground">Profile</h1>

      {/* Identity card */}
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-full bg-secondary border border-border flex items-center justify-center text-xl font-bold text-foreground shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {fullName}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {user?.isEmailVerified ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Clock className="h-3.5 w-3.5" /> Email not verified
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Role & organization */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Organization & Role
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground font-medium">
              {activeOrg?.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {activeOrg?.type?.toLowerCase()} organization
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIER_BADGE[meta.tier]}`}
          >
            {meta.label}
          </span>
        </div>

        {/* Capabilities */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Permissions
          </p>
          <ul className="space-y-1.5">
            {meta.capabilities.map((cap) => (
              <li
                key={cap}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                {cap}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Approval authority */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            Approval Authority
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">{meta.authority}</p>

        <div className="space-y-2">
          {THRESHOLDS.map((tier) => {
            const can = canHandleTier(role, tier.roles);
            return (
              <div
                key={tier.label}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                  can
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div>
                  <p
                    className={`text-sm font-medium ${can ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}
                  >
                    {tier.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {tier.description}
                  </p>
                </div>
                {can ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* My requests */}
      {myRequests.length > 0 && (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              My Requisitions
            </h3>
            <Link
              href={`/${locale}/dashboard/requisitions`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {myRequests.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/${locale}/dashboard/requisitions/${r.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate max-w-[260px]">
                    {r.title}
                  </p>
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
                  <StatusChip status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Decisions made — only visible to roles that can approve */}
      {canSeeAllDecisions && myDecisions.length > 0 && (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Decisions Made
            </h3>
            <span className="text-xs text-muted-foreground">
              {myDecisions.length} total
            </span>
          </div>
          <div className="divide-y divide-border">
            {myDecisions.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                href={`/${locale}/dashboard/requisitions/${r.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate max-w-[260px]">
                    {r.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.approvedAt
                      ? format(new Date(r.approvedAt), "MMM d, yyyy")
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-sm tabular-nums text-foreground">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: r.currency,
                    }).format(r.totalAmount)}
                  </span>
                  <StatusChip status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Coming soon — only shown to elevated roles */}
      {ELEVATED.includes(role) && (
        <section className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Coming soon
          </h3>
          <div className="space-y-2">
            {[
              {
                label: "Budget limits & policy configuration",
                desc: "Set org-wide spending budgets per period",
              },
              {
                label: "Full audit log",
                desc: "Complete history of all approval decisions across the org",
              },
              {
                label: "Member management",
                desc: "Invite, remove, and change roles for org members",
              },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3 px-4 py-3 rounded-lg bg-secondary/30 border border-border"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  SUBMITTED:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  APPROVED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ORDERED: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

function StatusChip({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-secondary text-muted-foreground";
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

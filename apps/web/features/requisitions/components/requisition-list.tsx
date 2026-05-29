"use client";

import { Button } from "@mora/ui/components/button";
import { toast } from "@mora/ui/components/sonner";
import { format } from "date-fns";
import { FileText, Loader2, Plus, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useCreateRequisition,
  useRequisitions,
} from "../hooks/use-requisitions";
import type { RequisitionStatus } from "../services/requisitions.service";
import { CreateRequisitionForm } from "./create-requisition-form";
import { RequisitionStatusBadge } from "./requisition-status-badge";

interface RequisitionListProps {
  orgId: string;
  orgCurrency?: string;
}

const STATUSES: { value: RequisitionStatus; label: string }[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Pending Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ORDERED", label: "Ordered" },
];

export function RequisitionList({
  orgId,
  orgCurrency = "USD",
}: RequisitionListProps) {
  const t = useTranslations("requisitions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const { data, isLoading, isError } = useRequisitions(orgId);
  const createMutation = useCreateRequisition(orgId);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<RequisitionStatus>>(new Set());

  function toggle(status: RequisitionStatus) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  }

  async function handleCreate(
    input: Parameters<typeof createMutation.mutateAsync>[0],
  ) {
    await createMutation.mutateAsync(input);
    setShowCreateForm(false);
    toast.success(t("newRequisition") + " created");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-destructive text-sm">
        {tCommon("error")}
      </div>
    );
  }

  const all = data?.data ?? [];

  const filtered = all.filter((req) => {
    const matchesStatus =
      selected.size === 0 || selected.has(req.status as RequisitionStatus);
    const matchesSearch =
      search.trim() === "" ||
      req.title.toLowerCase().includes(search.toLowerCase()) ||
      (req.description ?? "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{t("title")}</h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
        >
          <Plus className="h-4 w-4" />
          {t("newRequisition")}
        </Button>
      </div>

      {/* Search + filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requisitions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground mr-1">Show:</span>
          {STATUSES.map(({ value, label }) => {
            const count = all.filter((r) => r.status === value).length;
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
                <span
                  className={`tabular-nums ${isOn ? "opacity-70" : "opacity-60"}`}
                >
                  {count}
                </span>
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
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            {t("newRequisition")}
          </h3>
          <CreateRequisitionForm
            orgId={orgId}
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
            isSubmitting={createMutation.isPending}
          />
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-5 mb-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{t("noRequisitions")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {selected.size > 0
              ? "No items match the selected filters."
              : t("noRequisitionsHint")}
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {t("fields.title")}
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">
                  {t("totalAmount")}
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((req) => (
                <tr
                  key={req.id}
                  onClick={() =>
                    router.push(`/${locale}/dashboard/requisitions/${req.id}`)
                  }
                  className="hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground truncate max-w-[200px]">
                      {req.title}
                    </div>
                    {req.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {req.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground hidden sm:table-cell">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: req.currency,
                    }).format(req.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RequisitionStatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs hidden md:table-cell">
                    {format(new Date(req.createdAt), "MMM d, yyyy")}
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

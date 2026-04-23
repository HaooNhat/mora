"use client";

import { Button } from "@mora/ui/components/button";
import { toast } from "@mora/ui/components/sonner";
import { format } from "date-fns";
import { FileText, Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  useCreateRequisition,
  useRequisitions,
} from "../hooks/use-requisitions";
import { CreateRequisitionForm } from "./create-requisition-form";
import { RequisitionStatusBadge } from "./requisition-status-badge";

interface RequisitionListProps {
  orgId: string;
  orgCurrency?: string;
}

export function RequisitionList({
  orgId,
  orgCurrency = "USD",
}: RequisitionListProps) {
  const t = useTranslations("requisitions");
  const tCommon = useTranslations("common");

  const { data, isLoading, isError } = useRequisitions(orgId);
  const createMutation = useCreateRequisition(orgId);

  const [showCreateForm, setShowCreateForm] = useState(false);

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
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-red-500 text-sm">
        {tCommon("error")}
      </div>
    );
  }

  const requisitions = data?.data ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("title")}
        </h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-sm"
        >
          <Plus className="h-4 w-4" />
          {t("newRequisition")}
        </Button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
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
      {requisitions.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-5 mb-4">
            <FileText className="h-10 w-10 text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {t("noRequisitions")}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {t("noRequisitionsHint")}
          </p>
        </div>
      )}

      {/* List */}
      {requisitions.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t("fields.title")}
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  {t("totalAmount")}
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {requisitions.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                      {req.title}
                    </div>
                    {req.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {req.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: req.currency,
                    }).format(req.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RequisitionStatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-xs hidden md:table-cell">
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

"use client";

import { useAuth } from "@/features/auth";
import {
  useApproveRequisition,
  useDeleteRequisition,
  useRequisition,
  useRejectRequisition,
  useSubmitRequisition,
} from "../hooks/use-requisitions";
import { RequisitionStatusBadge } from "./requisition-status-badge";
import { Button } from "@mora/ui/components/button";
import { toast } from "@mora/ui/components/sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import type { OrganizationRole } from "@/features/organizations/services/organizations.service";

const APPROVER_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "APPROVER",
  "PROCUREMENT_MANAGER",
  "FINANCE_MANAGER",
];
const BUYER_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "BUYER",
  "PROCUREMENT_MANAGER",
];

interface Props {
  id: string;
  orgId: string;
  orgRole: OrganizationRole | null;
}

export function RequisitionDetail({ id, orgId, orgRole }: Props) {
  const t = useTranslations("requisitions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();

  const { data: req, isLoading, isError } = useRequisition(orgId, id);
  const submitMutation = useSubmitRequisition(orgId);
  const approveMutation = useApproveRequisition(orgId);
  const rejectMutation = useRejectRequisition(orgId);
  const deleteMutation = useDeleteRequisition(orgId);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !req) {
    return (
      <div className="text-center py-24 text-red-500 text-sm">
        {tCommon("error")}
      </div>
    );
  }

  const canApprove =
    req.status === "SUBMITTED" &&
    orgRole &&
    APPROVER_ROLES.includes(orgRole) &&
    user?.id !== req.requestedBy;
  const canSubmit = req.status === "DRAFT";
  const canDelete = req.status === "DRAFT";
  const canCreatePO =
    req.status === "APPROVED" && orgRole && BUYER_ROLES.includes(orgRole);

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: req.currency,
    }).format(n);

  async function handleSubmit() {
    await submitMutation.mutateAsync(id);
    toast.success("Requisition submitted for approval.");
  }

  async function handleApprove() {
    await approveMutation.mutateAsync(id);
    toast.success("Requisition approved.");
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError(t("rejectReasonRequired"));
      return;
    }
    await rejectMutation.mutateAsync({ id, reason: rejectReason });
    toast.success("Requisition rejected.");
    setRejectOpen(false);
    setRejectReason("");
  }

  async function handleDelete() {
    await deleteMutation.mutateAsync(id);
    toast.success("Requisition deleted.");
    window.history.back();
  }

  const busy =
    submitMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-start gap-4">
        <Link
          href={`/${locale}/dashboard/requisitions`}
          className="mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {req.title}
            </h1>
            <RequisitionStatusBadge status={req.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Created {format(new Date(req.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Description */}
      {req.description && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {req.description}
          </p>
        </div>
      )}

      {/* Rejection reason */}
      {req.status === "REJECTED" && req.rejectedReason && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 px-5 py-4">
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
            {t("rejectedReason")}
          </p>
          <p className="text-sm text-red-700 dark:text-red-300">
            {req.rejectedReason}
          </p>
        </div>
      )}

      {/* Line items */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("fields.items")}
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-400">
                {t("fields.itemDescription")}
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 hidden sm:table-cell">
                {t("fields.itemQuantity")}
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400 hidden sm:table-cell">
                {t("fields.itemUnitPrice")}
              </th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-400">
                {t("fields.itemTotal")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {req.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.description}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{item.notes}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {item.quantity}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {fmt(Number(item.unitPrice))}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                  {fmt(Number(item.totalPrice))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
            <tr>
              <td
                colSpan={3}
                className="px-5 py-3 text-right text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell"
              >
                {t("totalAmount")}
              </td>
              <td
                colSpan={1}
                className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white tabular-nums sm:hidden"
              >
                {t("totalAmount")}: {fmt(req.totalAmount)}
              </td>
              <td className="px-5 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white tabular-nums hidden sm:table-cell">
                {fmt(req.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Linked PO */}
      {req.status === "ORDERED" && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <ShoppingCart className="h-4 w-4 text-violet-500" />
            {t("linkedPo")}
          </div>
          <Link
            href={`/${locale}/dashboard/purchase-orders`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Orders →
          </Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {canSubmit && (
          <Button
            onClick={handleSubmit}
            disabled={busy}
            className="bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t("actions.submitForApproval")}
          </Button>
        )}

        {canApprove && (
          <>
            <Button
              onClick={handleApprove}
              disabled={busy}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {t("actions.approve")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(true)}
              disabled={busy}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20"
            >
              <XCircle className="h-4 w-4" />
              {t("actions.reject")}
            </Button>
          </>
        )}

        {canCreatePO && (
          <Link
            href={`/${locale}/dashboard/purchase-orders/new?requisitionId=${id}`}
          >
            <Button className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t("createPoFromReq")}
            </Button>
          </Link>
        )}

        {canDelete && (
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={busy}
            className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 ml-auto"
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t("actions.delete")}
          </Button>
        )}
      </div>

      {/* Reject dialog (inline) */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("rejectDialogTitle")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("rejectDialogDescription")}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError("");
              }}
              placeholder={t("rejectReasonPlaceholder")}
              rows={4}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            {rejectError && (
              <p className="text-xs text-red-500">{rejectError}</p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectOpen(false);
                  setRejectReason("");
                  setRejectError("");
                }}
                disabled={rejectMutation.isPending}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                onClick={handleReject}
                disabled={rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {t("actions.reject")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

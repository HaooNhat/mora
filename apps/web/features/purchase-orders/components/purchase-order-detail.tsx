"use client";

import {
  useCancelPurchaseOrder,
  useConfirmPurchaseOrder,
  usePurchaseOrder,
  useSendPurchaseOrder,
} from "../hooks/use-purchase-orders";
import { PurchaseOrderStatusBadge } from "./purchase-order-status-badge";
import { Button } from "@mora/ui/components/button";
import { toast } from "@mora/ui/components/sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Loader2,
  Send,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import type { OrganizationRole } from "@/features/organizations/services/organizations.service";

const BUYER_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "BUYER",
  "PROCUREMENT_MANAGER",
];
const SUPPLIER_ROLES: OrganizationRole[] = [
  "OWNER",
  "ADMIN",
  "SUPPLIER_MANAGER",
  "PROCUREMENT_MANAGER",
];

interface Props {
  id: string;
  orgId: string;
  orgRole: OrganizationRole | null;
}

export function PurchaseOrderDetail({ id, orgId, orgRole }: Props) {
  const t = useTranslations("purchaseOrders");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const { data: po, isLoading, isError } = usePurchaseOrder(orgId, id);
  const sendMutation = useSendPurchaseOrder(orgId);
  const confirmMutation = useConfirmPurchaseOrder(orgId);
  const cancelMutation = useCancelPurchaseOrder(orgId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isError || !po) {
    return (
      <div className="text-center py-24 text-red-500 text-sm">
        {tCommon("error")}
      </div>
    );
  }

  const isBuyer = orgId === po.buyerOrgId;
  const isSupplier = orgId === po.supplierOrgId;

  const canSend =
    po.status === "DRAFT" &&
    isBuyer &&
    orgRole &&
    BUYER_ROLES.includes(orgRole);
  const canConfirm =
    po.status === "SENT" &&
    isSupplier &&
    orgRole &&
    SUPPLIER_ROLES.includes(orgRole);
  const canCancel =
    ["DRAFT", "SENT"].includes(po.status) &&
    isBuyer &&
    orgRole &&
    BUYER_ROLES.includes(orgRole);

  const busy =
    sendMutation.isPending ||
    confirmMutation.isPending ||
    cancelMutation.isPending;

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: po.currency,
    }).format(n);

  async function handleSend() {
    await sendMutation.mutateAsync(id);
    toast.success("Purchase order sent to supplier.");
  }

  async function handleConfirm() {
    await confirmMutation.mutateAsync(id);
    toast.success("Purchase order confirmed.");
  }

  async function handleCancel() {
    await cancelMutation.mutateAsync(id);
    toast.success("Purchase order cancelled.");
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/${locale}/dashboard/purchase-orders`}
          className="mt-0.5 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white font-inter-tight">
              PO-{po.id.slice(0, 8).toUpperCase()}
            </h1>
            <PurchaseOrderStatusBadge status={po.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t("orderDate")}: {format(new Date(po.orderDate), "MMM d, yyyy")}
            {po.expectedDate && (
              <>
                {" · "}
                {t("expectedDate")}:{" "}
                {format(new Date(po.expectedDate), "MMM d, yyyy")}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Meta cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
          <p className="text-xs font-medium text-gray-400 mb-1">
            {t("buyerOrg")}
          </p>
          <p className="text-sm font-inter-tight text-gray-700 dark:text-gray-300 truncate">
            {po.buyerOrgId}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
          <p className="text-xs font-medium text-gray-400 mb-1">
            {t("supplierOrg")}
          </p>
          <p className="text-sm font-inter-tight text-gray-700 dark:text-gray-300 truncate">
            {po.supplierOrgId}
          </p>
        </div>
      </div>

      {/* Linked requisition */}
      {po.requisitionId && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <FileText className="h-4 w-4 text-blue-500" />
            {t("linkedRequisition")}
          </div>
          <Link
            href={`/${locale}/dashboard/requisitions/${po.requisitionId}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-inter-tight"
          >
            {po.requisitionId.slice(0, 8).toUpperCase()} →
          </Link>
        </div>
      )}

      {/* Notes */}
      {po.notes && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-4">
          <p className="text-xs font-medium text-gray-400 mb-1">{t("notes")}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{po.notes}</p>
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
            {po.items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-gray-900 dark:text-white">
                  {item.description}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {item.quantity}
                </td>
                <td className="px-5 py-3 text-right tabular-nums text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                  {fmt(item.unitPrice)}
                </td>
                <td className="px-5 py-3 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                  {fmt(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 text-sm">
            <tr>
              <td
                colSpan={3}
                className="px-5 py-2 text-right text-gray-500 hidden sm:table-cell"
              >
                {t("subtotal")}
              </td>
              <td className="px-5 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                {fmt(po.subtotal)}
              </td>
            </tr>
            {po.shippingAmount > 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-5 py-2 text-right text-gray-500 hidden sm:table-cell"
                >
                  {t("shipping")}
                </td>
                <td className="px-5 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                  {fmt(po.shippingAmount)}
                </td>
              </tr>
            )}
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td
                colSpan={3}
                className="px-5 py-3 text-right font-medium text-gray-600 dark:text-gray-400 hidden sm:table-cell"
              >
                {t("totalAmount")}
              </td>
              <td
                colSpan={4}
                className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white tabular-nums sm:hidden"
              >
                {t("totalAmount")}: {fmt(po.totalAmount)}
              </td>
              <td className="px-5 py-3 text-right font-semibold text-gray-900 dark:text-white tabular-nums hidden sm:table-cell">
                {fmt(po.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Actions */}
      {(canSend || canConfirm || canCancel) && (
        <div className="flex items-center gap-3 flex-wrap">
          {canSend && (
            <Button
              onClick={handleSend}
              disabled={busy}
              className="bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white flex items-center gap-2"
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("actions.send")}
            </Button>
          )}

          {canConfirm && (
            <Button
              onClick={handleConfirm}
              disabled={busy}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              {confirmMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {t("actions.confirm")}
            </Button>
          )}

          {canCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={busy}
              className="text-red-500 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/20 flex items-center gap-2 ml-auto"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {t("actions.cancel")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { Button } from "@mora/ui/components/button";
import { Input } from "@mora/ui/components/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@mora/ui/components/field";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CreatePurchaseOrderInput } from "../services/purchase-orders.service";
import type { Requisition } from "@/features/requisitions/services/requisitions.service";

interface ItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface FormErrors {
  supplierOrgId?: string;
  items?: { description?: string; quantity?: string; unitPrice?: string }[];
}

interface Props {
  orgId: string;
  prefillFromRequisition?: Requisition;
  onSubmit: (input: CreatePurchaseOrderInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function emptyItem(from?: { description: string; quantity: number; unitPrice: string }): ItemDraft {
  return {
    description: from?.description ?? "",
    quantity: String(from?.quantity ?? "1"),
    unitPrice: from?.unitPrice ?? "",
  };
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function CreatePurchaseOrderForm({
  orgId,
  prefillFromRequisition,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: Props) {
  const t = useTranslations("purchaseOrders");
  const tCommon = useTranslations("common");

  const [supplierOrgId, setSupplierOrgId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [shippingAmount, setShippingAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const currency = prefillFromRequisition?.currency ?? "USD";

  const [items, setItems] = useState<ItemDraft[]>(
    prefillFromRequisition?.items?.length
      ? prefillFromRequisition.items.map((i) => emptyItem(i))
      : [emptyItem()],
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!supplierOrgId.trim()) e.supplierOrgId = t("errors.supplierRequired");
    const itemErrors = items.map((item) => {
      const ie: { description?: string; quantity?: string; unitPrice?: string } = {};
      if (!item.description.trim()) ie.description = t("errors.itemDescriptionRequired");
      if (!item.quantity || Number(item.quantity) < 1) ie.quantity = t("errors.itemQuantityPositive");
      if (!item.unitPrice || Number(item.unitPrice) <= 0) ie.unitPrice = t("errors.itemPricePositive");
      return ie;
    });
    if (itemErrors.some((ie) => Object.keys(ie).length > 0)) e.items = itemErrors;
    return e;
  }

  function setItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  const lineTotal = (item: ItemDraft) =>
    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const total = subtotal + (Number(shippingAmount) || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDirty(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await onSubmit({
      requisitionId: prefillFromRequisition?.id ?? "",
      buyerOrgId: orgId,
      supplierOrgId: supplierOrgId.trim(),
      expectedDate: expectedDate || undefined,
      shippingAmount: Number(shippingAmount) || 0,
      currency,
      notes: notes.trim() || undefined,
      items: items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Requisition reference */}
      {prefillFromRequisition && (
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          <span className="font-medium">{t("fields.requisitionId")}: </span>
          <span className="font-inter-tight">{prefillFromRequisition.id.slice(0, 8).toUpperCase()}</span>
          {" — "}{prefillFromRequisition.title}
        </div>
      )}

      <FieldSet>
        <FieldGroup className="gap-4">
          {/* Supplier */}
          <Field>
            <FieldLabel htmlFor="po-supplier">{t("fields.supplierOrgId")}</FieldLabel>
            <Input
              id="po-supplier"
              value={supplierOrgId}
              onChange={(e) => {
                setSupplierOrgId(e.target.value);
                if (dirty) setErrors(validate());
              }}
              placeholder={t("fields.supplierOrgIdPlaceholder")}
              disabled={isSubmitting}
              aria-invalid={!!errors.supplierOrgId}
              className={`h-12 ${errors.supplierOrgId ? "border-red-400" : ""}`}
            />
            <p className="text-xs text-gray-400 mt-1">{t("fields.supplierOrgIdHint")}</p>
            {errors.supplierOrgId && (
              <p className="text-xs text-red-500 mt-1">{errors.supplierOrgId}</p>
            )}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expected date */}
            <Field>
              <FieldLabel htmlFor="po-date">{t("fields.expectedDate")}</FieldLabel>
              <Input
                id="po-date"
                type="date"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                disabled={isSubmitting}
                className="h-12"
              />
            </Field>

            {/* Shipping */}
            <Field>
              <FieldLabel htmlFor="po-shipping">{t("fields.shippingAmount")}</FieldLabel>
              <Input
                id="po-shipping"
                type="number"
                min="0"
                step="0.01"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(e.target.value)}
                disabled={isSubmitting}
                className="h-12"
              />
            </Field>
          </div>

          {/* Notes */}
          <Field>
            <FieldLabel htmlFor="po-notes">{t("fields.notes")}</FieldLabel>
            <textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("fields.notesPlaceholder")}
              disabled={isSubmitting}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Line items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t("fields.items")}
        </h3>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-xs text-gray-500 mb-1">
                    {t("fields.itemDescription")}
                  </label>
                  <Input
                    value={item.description}
                    onChange={(e) => setItem(index, { description: e.target.value })}
                    disabled={isSubmitting}
                    className={`h-10 ${errors.items?.[index]?.description ? "border-red-400" : ""}`}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">
                    {t("fields.itemQuantity")}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setItem(index, { quantity: e.target.value })}
                    disabled={isSubmitting}
                    className="h-10"
                  />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    {t("fields.itemUnitPrice")}
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.unitPrice}
                    placeholder="0.00"
                    onChange={(e) => setItem(index, { unitPrice: e.target.value })}
                    disabled={isSubmitting}
                    className="h-10"
                  />
                </div>
                <div className="col-span-10 sm:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    {t("fields.itemTotal")}
                  </label>
                  <div className="h-10 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                    {lineTotal(item).toFixed(2)}
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 flex items-end pb-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setItems((p) => p.filter((_, i) => i !== index))}
                    disabled={items.length === 1 || isSubmitting}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setItems((p) => [...p, emptyItem()])}
          disabled={isSubmitting}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
        >
          + Add Item
        </button>
      </div>

      {/* Totals */}
      <div className="space-y-1 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end gap-12 text-sm text-gray-500">
          <span>{t("subtotal")}</span>
          <span className="tabular-nums w-28 text-right">{formatCurrency(subtotal, currency)}</span>
        </div>
        {Number(shippingAmount) > 0 && (
          <div className="flex justify-end gap-12 text-sm text-gray-500">
            <span>{t("shipping")}</span>
            <span className="tabular-nums w-28 text-right">{formatCurrency(Number(shippingAmount), currency)}</span>
          </div>
        )}
        <div className="flex justify-end gap-12 text-sm font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
          <span>{t("totalAmount")}</span>
          <span className="tabular-nums w-28 text-right">{formatCurrency(total, currency)}</span>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {tCommon("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {tCommon("create")}
        </Button>
      </div>
    </form>
  );
}

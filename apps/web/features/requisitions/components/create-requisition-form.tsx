"use client";

import { Button } from "@mora/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@mora/ui/components/field";
import { Input } from "@mora/ui/components/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  CreateRequisitionInput,
  CreateRequisitionItemInput,
} from "../services/requisitions.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ItemDraft extends Omit<
  CreateRequisitionItemInput,
  "quantity" | "unitPrice"
> {
  quantity: string;
  unitPrice: string;
}

interface FormValues {
  title: string;
  description: string;
  currency: string;
  items: ItemDraft[];
}

interface FormErrors {
  title?: string;
  items?: { description?: string; quantity?: string; unitPrice?: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function emptyItem(): ItemDraft {
  return { description: "", quantity: "1", unitPrice: "", notes: "" };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CreateRequisitionFormProps {
  orgId: string;
  onSubmit: (input: CreateRequisitionInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CreateRequisitionForm({
  orgId,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: CreateRequisitionFormProps) {
  const t = useTranslations("requisitions");
  const tCommon = useTranslations("common");

  const [values, setValues] = useState<FormValues>({
    title: "",
    description: "",
    currency: "USD",
    items: [emptyItem()],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────────

  function validate(v: FormValues): FormErrors {
    const e: FormErrors = {};

    if (!v.title.trim()) e.title = t("errors.titleRequired");

    const itemErrors = v.items.map((item) => {
      const ie: {
        description?: string;
        quantity?: string;
        unitPrice?: string;
      } = {};
      if (!item.description.trim())
        ie.description = t("errors.itemDescriptionRequired");
      if (!item.quantity || Number(item.quantity) < 1)
        ie.quantity = t("errors.itemQuantityPositive");
      if (!item.unitPrice || Number(item.unitPrice) <= 0)
        ie.unitPrice = t("errors.itemPricePositive");
      return ie;
    });

    if (itemErrors.some((ie) => Object.keys(ie).length > 0)) {
      e.items = itemErrors;
    }

    return e;
  }

  // ── Item handlers ───────────────────────────────────────────────────────────

  function setItem(index: number, patch: Partial<ItemDraft>) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addItem() {
    setValues((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  }

  function removeItem(index: number) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  // ── Totals ──────────────────────────────────────────────────────────────────

  const lineTotal = (item: ItemDraft) =>
    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

  const grandTotal = values.items.reduce(
    (sum, item) => sum + lineTotal(item),
    0,
  );

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDirty(true);

    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    await onSubmit({
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      orgId,
      currency: values.currency,
      items: values.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        notes: item.notes?.trim() || undefined,
      })),
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Header fields */}
      <FieldSet>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="req-title">{t("fields.title")}</FieldLabel>
            <Input
              id="req-title"
              value={values.title}
              onChange={(e) => {
                setValues((p) => ({ ...p, title: e.target.value }));
                if (dirty)
                  setErrors(validate({ ...values, title: e.target.value }));
              }}
              placeholder={t("fields.titlePlaceholder")}
              disabled={isSubmitting}
              aria-invalid={!!errors.title}
              className={`h-12 ${errors.title ? "border-red-400" : ""}`}
            />
            {errors.title && (
              <p role="alert" className="mt-1 text-xs text-red-500">
                {errors.title}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="req-description">
              {t("fields.description")}
            </FieldLabel>
            <textarea
              id="req-description"
              value={values.description}
              onChange={(e) =>
                setValues((p) => ({ ...p, description: e.target.value }))
              }
              placeholder={t("fields.descriptionPlaceholder")}
              disabled={isSubmitting}
              rows={3}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 transition-colors"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="req-currency">
              {t("fields.currency")}
            </FieldLabel>
            <select
              id="req-currency"
              value={values.currency}
              onChange={(e) =>
                setValues((p) => ({ ...p, currency: e.target.value }))
              }
              disabled={isSubmitting}
              className="h-12 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="USD">USD — US Dollar</option>
              <option value="VND">VND — Vietnamese Dong</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
            </select>
          </Field>
        </FieldGroup>
      </FieldSet>

      {/* Line items */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {t("fields.items")}
        </h3>

        <div className="space-y-3">
          {values.items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50"
            >
              <div className="grid grid-cols-12 gap-3">
                {/* Description */}
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t("fields.itemDescription")}
                  </label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      setItem(index, { description: e.target.value })
                    }
                    placeholder={t("fields.itemDescriptionPlaceholder")}
                    disabled={isSubmitting}
                    aria-invalid={!!errors.items?.[index]?.description}
                    className={`h-10 ${errors.items?.[index]?.description ? "border-red-400" : ""}`}
                  />
                  {errors.items?.[index]?.description && (
                    <p className="mt-0.5 text-xs text-red-500">
                      {errors.items[index]!.description}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t("fields.itemQuantity")}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      setItem(index, { quantity: e.target.value })
                    }
                    disabled={isSubmitting}
                    aria-invalid={!!errors.items?.[index]?.quantity}
                    className={`h-10 ${errors.items?.[index]?.quantity ? "border-red-400" : ""}`}
                  />
                </div>

                {/* Unit price */}
                <div className="col-span-5 sm:col-span-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t("fields.itemUnitPrice")}
                  </label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      setItem(index, { unitPrice: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={isSubmitting}
                    aria-invalid={!!errors.items?.[index]?.unitPrice}
                    className={`h-10 ${errors.items?.[index]?.unitPrice ? "border-red-400" : ""}`}
                  />
                </div>

                {/* Line total */}
                <div className="col-span-10 sm:col-span-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {t("fields.itemTotal")}
                  </label>
                  <div className="h-10 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                    {lineTotal(item).toFixed(2)}
                  </div>
                </div>

                {/* Remove */}
                <div className="col-span-2 sm:col-span-1 flex items-end pb-1 justify-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={values.items.length === 1 || isSubmitting}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={t("fields.removeItem")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-2">
                <Input
                  value={item.notes ?? ""}
                  onChange={(e) => setItem(index, { notes: e.target.value })}
                  placeholder={t("fields.itemNotesPlaceholder")}
                  disabled={isSubmitting}
                  className="h-8 text-xs text-gray-500"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          disabled={isSubmitting}
          className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {t("fields.addItem")}
        </button>
      </div>

      {/* Grand total */}
      <div className="flex items-center justify-end gap-3 py-3 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t("totalAmount")}:
        </span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
          {formatCurrency(grandTotal, values.currency)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {tCommon("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          {tCommon("create")}
        </Button>
      </div>
    </form>
  );
}

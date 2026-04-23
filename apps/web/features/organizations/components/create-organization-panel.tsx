"use client";

import { Button } from "@mora/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@mora/ui/components/field";
import { Input } from "@mora/ui/components/input";
import { Building2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "@mora/ui/components/sonner";
import { useCreateOrganization } from "../hooks/use-organizations";
import type { OrganizationType } from "../services/organizations.service";

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  type?: string;
}

function validate(
  name: string,
  type: string,
  t: ReturnType<typeof useTranslations<"organizations">>,
): FormErrors {
  const errors: FormErrors = {};
  if (!name.trim()) errors.name = t("errors.nameRequired");
  if (!type) errors.type = t("errors.typeRequired");
  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOrganizationPanel() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");

  const createMutation = useCreateOrganization();

  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType | "">("");
  const [legalName, setLegalName] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDirty(true);

    const errs = validate(name, type, t);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        type: type as OrganizationType,
        legalName: legalName.trim() || undefined,
      });
      toast.success(t("createSuccess"));
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : tCommon("error");
      toast.error(msg);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
            <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("createOrg")}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center">
            {t("createOrgSubtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm"
        >
          <FieldSet>
            <FieldGroup className="gap-4">
              {/* Name */}
              <Field>
                <FieldLabel htmlFor="org-name">{t("name")}</FieldLabel>
                <Input
                  id="org-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (dirty) setErrors(validate(e.target.value, type, t));
                  }}
                  placeholder={t("namePlaceholder")}
                  disabled={createMutation.isPending}
                  aria-invalid={!!errors.name}
                  className={`h-12 ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && (
                  <p role="alert" className="mt-1 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </Field>

              {/* Legal name */}
              <Field>
                <FieldLabel htmlFor="org-legal-name">
                  {t("legalName")}{" "}
                  <span className="text-gray-400 font-normal">(optional)</span>
                </FieldLabel>
                <Input
                  id="org-legal-name"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder={t("legalNamePlaceholder")}
                  disabled={createMutation.isPending}
                  className="h-12"
                />
              </Field>

              {/* Type */}
              <Field>
                <FieldLabel htmlFor="org-type">{t("type")}</FieldLabel>
                <select
                  id="org-type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as OrganizationType);
                    if (dirty) setErrors(validate(name, e.target.value, t));
                  }}
                  disabled={createMutation.isPending}
                  aria-invalid={!!errors.type}
                  className={`h-12 w-full rounded-lg border bg-white dark:bg-gray-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors ${
                    errors.type
                      ? "border-red-400"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <option value="">{t("type")}…</option>
                  <option value="BUYER">{t("typeBuyer")}</option>
                  <option value="SUPPLIER">{t("typeSupplier")}</option>
                  <option value="BOTH">{t("typeBoth")}</option>
                </select>
                {errors.type && (
                  <p role="alert" className="mt-1 text-xs text-red-500">
                    {errors.type}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full h-12 text-sm font-semibold bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md shadow-blue-500/20 transition-all"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              tCommon("create")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

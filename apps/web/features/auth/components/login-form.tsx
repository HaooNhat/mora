"use client";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@mora/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@mora/ui/components/field";
import { Input } from "@mora/ui/components/input";
import { useLoginForm } from "../hooks/use-login-form";
import { PasswordField } from "./password-field";
import { AuthErrorBanner } from "./auth-error-banner";
import { AuthDivider } from "./auth-divider";
import { AuthGoogleButton } from "./auth-google-button";

export function LoginForm() {
  const t = useTranslations("auth");
  const {
    values,
    fieldErrors,
    authError,
    isLoading,
    handleChange,
    handleSubmit,
    signInWithGoogle,
  } = useLoginForm();

  return (
    <div className="flex flex-col gap-5">
      <AuthErrorBanner error={authError} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
        <FieldSet>
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="input-email">{t("email")}</FieldLabel>
              <Input
                id="input-email"
                type="email"
                value={values.email}
                onChange={(e) => handleChange("email")(e.target.value)}
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={`h-12 transition-colors ${fieldErrors.email ? "border-red-400 focus:ring-red-400" : ""}`}
              />
              {fieldErrors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="mt-1 text-xs text-red-500 dark:text-red-400"
                >
                  {fieldErrors.email}
                </p>
              )}
            </Field>

            <PasswordField
              id="input-password"
              label={t("password")}
              value={values.password}
              onChange={handleChange("password")}
              error={fieldErrors.password}
              disabled={isLoading}
            />
          </FieldGroup>
        </FieldSet>

        <div className="flex justify-end mt-1">
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            {t("forgotPassword")}
          </button>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-4 text-sm font-semibold bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            t("signIn")
          )}
        </Button>
      </form>

      <AuthDivider label={t("or")} />
      <AuthGoogleButton
        isLoading={isLoading}
        onClick={signInWithGoogle}
        label={t("continueWithGoogle")}
      />
    </div>
  );
}

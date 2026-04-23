"use client";
import { Button } from "@mora/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@mora/ui/components/field";
import { Input } from "@mora/ui/components/input";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRegisterForm } from "../hooks/use-register-form";
import { AuthDivider } from "./auth-divider";
import { AuthErrorBanner } from "./auth-error-banner";
import { AuthGoogleButton } from "./auth-google-button";
import { PasswordField } from "./password-field";

interface RegisterFormProps {
  onSuccess: (message: string) => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations("auth");
  const {
    values,
    fieldErrors,
    authError,
    isLoading,
    handleChange,
    handleInputChange,
    handleSubmit,
    signInWithGoogle,
  } = useRegisterForm(onSuccess);

  return (
    <div className="flex flex-col gap-5">
      <AuthErrorBanner error={authError} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
        <FieldSet>
          <FieldGroup className="gap-4">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="input-first-name">
                  {t("firstName")}
                </FieldLabel>
                <Input
                  id="input-first-name"
                  type="text"
                  value={values.firstName}
                  onChange={handleInputChange("firstName")}
                  placeholder={t("firstNamePlaceholder")}
                  autoComplete="given-name"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.firstName}
                  aria-describedby={
                    fieldErrors.firstName ? "first-name-error" : undefined
                  }
                  className={`h-12 transition-colors ${fieldErrors.firstName ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                {fieldErrors.firstName && (
                  <p
                    id="first-name-error"
                    role="alert"
                    className="mt-1 text-xs text-red-500 dark:text-red-400"
                  >
                    {fieldErrors.firstName}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="input-last-name">
                  {t("lastName")}
                </FieldLabel>
                <Input
                  id="input-last-name"
                  type="text"
                  value={values.lastName}
                  onChange={handleInputChange("lastName")}
                  placeholder={t("lastNamePlaceholder")}
                  autoComplete="family-name"
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.lastName}
                  aria-describedby={
                    fieldErrors.lastName ? "last-name-error" : undefined
                  }
                  className={`h-12 transition-colors ${fieldErrors.lastName ? "border-red-400 focus:ring-red-400" : ""}`}
                />
                {fieldErrors.lastName && (
                  <p
                    id="last-name-error"
                    role="alert"
                    className="mt-1 text-xs text-red-500 dark:text-red-400"
                  >
                    {fieldErrors.lastName}
                  </p>
                )}
              </Field>
            </div>

            {/* Email */}
            <Field>
              <FieldLabel htmlFor="input-email">{t("email")}</FieldLabel>
              <Input
                id="input-email"
                type="email"
                value={values.email}
                onChange={handleInputChange("email")}
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

            {/* Password */}
            <PasswordField
              id="input-password"
              label={t("password")}
              value={values.password}
              onChange={handleChange("password")}
              error={fieldErrors.password}
              disabled={isLoading}
              autoComplete="new-password"
            />

            {/* Confirm password */}
            <PasswordField
              id="input-confirm-password"
              label={t("confirmPassword")}
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />
          </FieldGroup>
        </FieldSet>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 mt-4 text-sm font-semibold bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-md shadow-blue-500/20 transition-all"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            t("signUp")
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

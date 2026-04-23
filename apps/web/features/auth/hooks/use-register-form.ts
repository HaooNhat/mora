import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { EMAIL_REGEX, STRONG_PASSWORD_REGEX } from "../utils/auth.utils";
import type { RegisterInput } from "../types/auth.types";

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
}

function validate(
  values: FormValues,
  t: ReturnType<typeof useTranslations<"auth">>,
): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) errors.email = t("errors.emailRequired");
  else if (!EMAIL_REGEX.test(values.email.trim()))
    errors.email = t("errors.emailInvalid");

  if (!values.password) errors.password = t("errors.passwordRequired");
  else if (!STRONG_PASSWORD_REGEX.test(values.password))
    errors.password = t("errors.passwordWeak");

  if (!values.confirmPassword)
    errors.confirmPassword = t("errors.confirmPasswordRequired");
  else if (values.password !== values.confirmPassword)
    errors.confirmPassword = t("errors.passwordMismatch");

  if (!values.firstName.trim())
    errors.firstName = t("errors.firstNameRequired");

  if (!values.lastName.trim()) errors.lastName = t("errors.lastNameRequired");

  return errors;
}

/** Encapsulates all register form state, validation, and submission. */
export function useRegisterForm(onSuccess: (message: string) => void) {
  const t = useTranslations("auth");
  const {
    isLoading,
    error: authError,
    register,
    signInWithGoogle,
    clearError,
  } = useAuthStore();

  const [values, setValues] = useState<FormValues>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) setFieldErrors(validate(values, t));
  }, [values, dirty, t]);

  function handleChange(key: keyof FormValues) {
    return (value: string) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      if (authError) clearError();
    };
  }

  /** Adapter for native <input onChange> events. */
  function handleInputChange(key: keyof FormValues) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      handleChange(key)(e.target.value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDirty(true);

    const errors = validate(values, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    clearError();
    const result = await register({
      email: values.email.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    } satisfies RegisterInput);

    if (result.success && result.message) {
      onSuccess(result.message);
    }
  }

  return {
    values,
    fieldErrors,
    authError,
    isLoading,
    handleChange,
    handleInputChange,
    handleSubmit,
    signInWithGoogle,
  };
}

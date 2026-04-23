import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/auth.store";
import { EMAIL_REGEX } from "../utils/auth.utils";

interface FormValues {
  email: string;
  password: string;
}
interface FormErrors {
  email?: string;
  password?: string;
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
  return errors;
}

/** Encapsulates all login form state, validation, and submission. */
export function useLoginForm() {
  const t = useTranslations("auth");
  const {
    isLoading,
    error: authError,
    signInWithEmail,
    signInWithGoogle,
    clearError,
  } = useAuthStore();

  const [values, setValues] = useState<FormValues>({ email: "", password: "" });
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDirty(true);
    const errors = validate(values, t);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    clearError();
    await signInWithEmail(values.email.trim(), values.password);
  }

  return {
    values,
    fieldErrors,
    authError,
    isLoading,
    handleChange,
    handleSubmit,
    signInWithGoogle,
  };
}

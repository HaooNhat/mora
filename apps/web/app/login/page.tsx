"use client";

import { GoogleIcon } from "@/asset/icons/google.icon";
import { useAuth, useAuthStore } from "@/hooks/use-auth";
import { Button } from "@workspace/ui/components/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { Eye, EyeOff, Loader2, Lock, Mail, Waves } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AuthMode = "login" | "signup";

interface FormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates form fields based on the current auth mode.
 * Returns an object with field-level error messages.
 */
function validateForm(values: FormValues, mode: AuthMode): FormErrors {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (mode === "signup" && values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (
    mode === "signup" &&
    !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(values.password)
  ) {
    errors.password =
      "Password must include uppercase, lowercase, and a number.";
  }

  if (mode === "signup") {
    if (!values.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
  }

  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
  label: string;
  disabled?: boolean;
}

/** Reusable password field with show/hide toggle and inline error */
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  error,
  label,
  disabled,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={id} className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-gray-500" aria-hidden="true" />
        {label}
      </FieldLabel>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "••••••••"}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 pr-10 transition-colors ${
            error ? "border-red-400 focus:ring-red-400" : "focus:ring-blue-500"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </Field>
  );
}

/** Inline field-level error for non-password fields */
function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          id={id}
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1 text-xs text-red-500 dark:text-red-400"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    error: authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>("login");
  const [values, setValues] = useState<FormValues>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  // Re-validate on every keystroke once the form has been submitted once
  useEffect(() => {
    if (submitted) {
      setFieldErrors(validateForm(values, mode));
    }
  }, [values, mode, submitted]);

  // Clear auth-level errors when switching mode
  const switchMode = useCallback(
    (next: AuthMode) => {
      setMode(next);
      setFieldErrors({});
      setSubmitted(false);
      clearError();
    },
    [clearError],
  );

  const handleField = useCallback(
    (key: keyof FormValues) => (val: string) => {
      setValues((prev) => ({ ...prev, [key]: val }));
      clearError();
    },
    [clearError],
  );

  const handleGoogleSignIn = async () => {
    clearError();
    await signInWithGoogle();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const errors = validateForm(values, mode);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    clearError();

    if (mode === "login") {
      await signInWithEmail(values.email.trim(), values.password);
    } else {
      await signUpWithEmail(values.email.trim(), values.password);
    }
  };

  // ── Global loading splash ──────────────────────────────────────────────────
  if (isLoading && !submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const hasAuthError = authError && authError.code !== "EMAIL_SENT";
  const emailSent = authError?.code === "EMAIL_SENT";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-black dark:via-gray-900 dark:to-black">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* ── Card ── */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8">
          {/* ── Logo & Title ── */}
          <div className="text-center mb-7">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.5 }}
              className="flex items-center justify-center mb-4"
            >
              <div className="bg-gradient-to-br from-blue-600 to-pink-600 p-3 rounded-2xl shadow-lg">
                <Waves className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-1">
              {mode === "login" ? "Welcome back to " : "Join "}
              <span className="font-bold bg-gradient-to-br from-blue-600 via-blue-400 to-pink-600 bg-clip-text text-transparent">
                Mora
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {mode === "login"
                ? "Sign in to continue your journey"
                : "Create an account to start your journey"}
            </p>
          </div>

          {/* ── Global auth error ── */}
          <AnimatePresence mode="wait">
            {hasAuthError && (
              <motion.div
                key="auth-error"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="alert"
                className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              >
                <p className="text-sm text-red-600 dark:text-red-400">
                  {authError.message}
                </p>
              </motion.div>
            )}

            {emailSent && (
              <motion.div
                key="email-sent"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="status"
                className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              >
                <p className="text-sm text-green-600 dark:text-green-400">
                  {authError.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate>
            <FieldSet>
              <FieldGroup className="gap-4">
                {/* Email */}
                <Field>
                  <FieldLabel
                    htmlFor="input-email"
                    className="flex items-center gap-2"
                  >
                    <Mail
                      className="w-4 h-4 text-gray-500"
                      aria-hidden="true"
                    />
                    Email
                  </FieldLabel>
                  <Input
                    id="input-email"
                    type="email"
                    value={values.email}
                    onChange={(e) => handleField("email")(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-invalid={!!fieldErrors.email}
                    aria-describedby={
                      fieldErrors.email ? "email-error" : undefined
                    }
                    className={`h-12 transition-colors ${
                      fieldErrors.email
                        ? "border-red-400 focus:ring-red-400"
                        : "focus:ring-blue-500"
                    }`}
                  />
                  <FieldError id="email-error" message={fieldErrors.email} />
                </Field>

                {/* Password */}
                <PasswordInput
                  id="input-password"
                  label="Password"
                  value={values.password}
                  onChange={handleField("password")}
                  placeholder="••••••••"
                  error={fieldErrors.password}
                  disabled={isLoading}
                />

                {/* Confirm Password — sign-up only */}
                <AnimatePresence>
                  {mode === "signup" && (
                    <motion.div
                      key="confirm-password"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <PasswordInput
                        id="input-confirm-password"
                        label="Confirm Password"
                        value={values.confirmPassword}
                        onChange={handleField("confirmPassword")}
                        placeholder="••••••••"
                        error={fieldErrors.confirmPassword}
                        disabled={isLoading}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </FieldGroup>
            </FieldSet>

            {/* Forgot password — login only */}
            {mode === "login" && (
              <div className="flex justify-end mt-2 mb-1">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-5 text-base font-semibold bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-md shadow-blue-500/20 transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* ── Divider ── */}
          <div className="relative my-5" aria-hidden="true">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-gray-900 text-gray-400 uppercase tracking-wide">
                or
              </span>
            </div>
          </div>

          {/* ── Google ── */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full h-12 text-sm font-medium relative overflow-hidden group border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-label="Continue with Google"
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <GoogleIcon
                  className="h-5 w-5 mr-2 flex-shrink-0"
                  aria-hidden="true"
                />
                Continue with Google
              </>
            )}
          </Button>

          {/* ── Mode toggle ── */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-medium text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          {/* ── Footer legal ── */}
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            By continuing, you agree to our{" "}
            <a
              href="/terms"
              className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              className="text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { Field, FieldLabel } from "@mora/ui/components/field";
import { Input } from "@mora/ui/components/input";
import { Eye, EyeOff, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A password input with a show/hide toggle and animated inline error message.
 * Fully accessible: aria-invalid, aria-describedby, and labelled toggle button.
 */
export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  disabled,
  autoComplete = "current-password",
  placeholder = "••••••••",
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field>
      <FieldLabel htmlFor={id} className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-gray-400" aria-hidden="true" />
        {label}
      </FieldLabel>

      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`h-12 pr-10 transition-colors ${
            error ? "border-red-400 focus:ring-red-400" : ""
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-1 text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </Field>
  );
}

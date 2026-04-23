"use client";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  error: { message: string } | null;
}

export function AuthErrorBanner({ error }: Props) {
  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          key="auth-error"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          role="alert"
          className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800"
        >
          <p className="text-sm text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

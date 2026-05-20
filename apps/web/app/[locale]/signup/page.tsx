"use client";

import { RegisterForm, useAuth } from "@/features/auth";
import { Link, useRouter } from "@/i18n/navigation";
import { CheckCircle2, Loader2, Waves } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function SignupPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace("/app");
  }, [isAuthenticated, router]);

  if (isLoading && !successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/50 p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-linear-to-br from-blue-600 to-violet-600 p-3 rounded-2xl shadow-lg mb-4">
              <Waves className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("signupTitle")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("signupSubtitle")}
            </p>
          </div>

          {/* Success state */}
          <AnimatePresence mode="wait">
            {successMessage ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-6 text-center"
              >
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
                  <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">
                  {successMessage}
                </p>
                <Link
                  href="/login"
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  {t("signIn")} →
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form">
                <RegisterForm onSuccess={setSuccessMessage} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign in link */}
          {!successMessage && (
            <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("alreadyHaveAccount")}{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:underline font-medium"
              >
                {t("signIn")}
              </Link>
            </p>
          )}

          {/* Terms */}
          {!successMessage && (
            <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              {t("termsNotice")}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

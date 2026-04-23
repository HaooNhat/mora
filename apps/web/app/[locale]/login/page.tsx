"use client";

import { LoginForm, useAuth } from "@/features/auth";
import { Link } from "@/lib/navigation";
import { Loader2, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace("/app");
  }, [isAuthenticated, router]);

  if (isLoading) {
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
        {/* Card */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/50 p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="bg-linear-to-br from-blue-600 to-violet-600 p-3 rounded-2xl shadow-lg mb-4">
              <Waves className="h-7 w-7 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("loginTitle").replace("Mora", "")}
              <span className="font-bold bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Mora
              </span>
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("loginSubtitle")}
            </p>
          </div>

          {/* Form */}
          <LoginForm />

          {/* Sign up link */}
          <p className="mt-5 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("noAccount")}{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-medium"
            >
              {t("signUp")}
            </Link>
          </p>

          {/* Terms */}
          <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            {t("termsNotice")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

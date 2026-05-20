"use client";

import { useAuth } from "@/features/auth";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useLocale } from "next-intl";
import { useEffect } from "react";

export function AuthCallbackClient() {
  // init is intentionally excluded from useAuth — only lifecycle entry points call it.
  // This page is one of two justified exceptions (the other is AuthInitializer).
  const init = useAuthStore((s) => s.init);
  const { isAuthenticated, isLoading } = useAuth();
  const locale = useLocale();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isLoading) {
      const target = isAuthenticated ? `/${locale}/app` : `/${locale}/login`;
      window.location.replace(target);
    }
  }, [isAuthenticated, isLoading, locale]);

  return <LoadingScreen />;
}

export function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
      }}
    >
      <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
        Completing sign in…
      </p>
    </div>
  );
}

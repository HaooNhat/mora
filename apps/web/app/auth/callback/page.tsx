"use client";

import { useAuth } from "@/features/auth";
import { useAuthStore } from "@/features/auth/store/auth.store";
// import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

// This page lives OUTSIDE [locale] routing — it's a bare OAuth redirect target.
// The backend always redirects here after Google login regardless of locale.
// Once auth is confirmed we forward to the locale-prefixed app.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthCallbackClient />
    </Suspense>
  );
}

function AuthCallbackClient() {
  // init is intentionally excluded from useAuth — only lifecycle entry points call it.
  // This page is one of two justified exceptions (the other is AuthInitializer).
  const init = useAuthStore((s) => s.init);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isLoading) {
      // Use window.location so next-intl middleware adds the locale prefix
      window.location.replace(isAuthenticated ? "/app" : "/login");
    }
  }, [isAuthenticated, isLoading]);

  return <LoadingScreen />;
}

function LoadingScreen() {
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

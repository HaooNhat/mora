import { Suspense } from "react";
import { AuthCallbackClient, LoadingScreen } from "./client";

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

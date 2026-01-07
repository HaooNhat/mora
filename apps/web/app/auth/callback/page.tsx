"use client";

import { Suspense } from "react";
import AuthCallbackClient from "./authCallbackClient";

export const dynamic = "force-dynamic";

/**
 * Auth Callback Page
 *
 * Handles OAuth callback from Google/GitHub
 * Exchanges code for session and redirects to app
 */
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackClient />
    </Suspense>
  );
}

function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Completing sign in...</p>
    </div>
  );
}

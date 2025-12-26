"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@workspace/api-client/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Auth Callback Page
 *
 * Handles OAuth callback from Google/GitHub
 * Exchanges code for session and redirects to app
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL params
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || errorParam);
          setTimeout(() => {
            router.push("/login");
          }, 3000);
          return;
        }

        // Exchange code for session
        const code = searchParams.get("code");

        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error("Auth error:", error);
            setError(error.message);
            setTimeout(() => {
              router.push("/login");
            }, 3000);
            return;
          }

          if (data.session) {
            // Success! Redirect to app
            router.push("/");
          } else {
            setError("No session received");
            setTimeout(() => {
              router.push("/login");
            }, 3000);
          }
        } else {
          // No code, might be magic link - just check session
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session) {
            router.push("/");
          } else {
            router.push("/login");
          }
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("Authentication failed");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-red-500 text-xl font-semibold">
              Authentication Error
            </div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">
              Completing sign in...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

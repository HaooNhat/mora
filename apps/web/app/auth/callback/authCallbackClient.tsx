"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@workspace/infrastructure/database/supabase-client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || errorParam);
          setTimeout(() => router.push("/login"), 3000);
          return;
        }

        const code = searchParams.get("code");

        if (code) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error || !data.session) {
            setError(error?.message ?? "No session received");
            setTimeout(() => router.push("/login"), 3000);
            return;
          }

          router.push("/");
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          router.push(session ? "/" : "/login");
        }
      } catch {
        setError("Authentication failed");
        setTimeout(() => router.push("/login"), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-red-500 font-semibold">Authentication Error</p>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : (
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      )}
    </div>
  );
}

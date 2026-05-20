import { AppShell } from "@/features/dashboard/components/app-shell";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

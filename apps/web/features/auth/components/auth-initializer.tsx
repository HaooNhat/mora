"use client";

import { useAuthStore } from "@/features/auth/store/auth.store";
import { useEffect } from "react";

export function AuthInitializer() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return null;
}

"use client";

import { useShallow } from "zustand/react/shallow";
import { useAuthStore } from "../store/auth.store";
// import type { RegisterInput } from "../types/auth.types";

/** Public API for auth. Components never import useAuthStore directly. */
export function useAuth() {
  return useAuthStore(
    useShallow((s) => ({
      // State
      user: s.user,
      isLoading: s.isLoading,
      isAuthenticated: s.isAuthenticated,
      error: s.error,

      // Actions
      signInWithEmail: s.signInWithEmail,
      signInWithGoogle: s.signInWithGoogle,
      register: s.register,
      logout: s.logout,
      clearError: s.clearError,
    })),
  );
}

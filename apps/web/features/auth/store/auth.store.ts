"use client";
import { create } from "zustand";
import { authApi } from "../services/auth.api";
import { authService } from "../services/auth.service";
import type {
  AuthActions,
  AuthState,
  RegisterInput,
} from "../types/auth.types";
import { toAuthError } from "../utils/auth.utils";
import { devtools } from "zustand/middleware";

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      init: async () => {
        set({ isLoading: true, error: null }, false, "auth/init:start");
        try {
          const { data } = await authApi.me();
          set(
            { user: data, isAuthenticated: true },
            false,
            "auth/init:success",
          );
        } catch {
          set({ user: null, isAuthenticated: false }, false, "auth/init:error");
        } finally {
          set({ isLoading: false }, false, "auth/init:finally");
        }
      },

      signInWithEmail: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await authService.login({ email, password });
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ isLoading: false, error: toAuthError(err) });
        }
      },

      signInWithGoogle: () => {
        window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google/login`;
      },

      register: async (input: RegisterInput) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authApi.register(input);
          set({ isLoading: false });
          return { success: true, message: res.data?.message };
        } catch (err) {
          const error = toAuthError(err);
          set({ isLoading: false, error });
          return { success: false, message: error.message };
        }
      },

      logout: async () => {
        await authApi.logout().catch(() => undefined); // best-effort
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    { name: "AuthStore" },
  ),
);

import { create } from "zustand";

interface AuthState {
  user: User | null;
  // accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isLoading: true,

  login: async (email, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // sends/receives cookies
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error("Login failed");

    const data = await res.json();
    // refreshToken is set as HttpOnly cookie by server
    // we only store accessToken in memory
    set({ user: data.user });
  },

  refresh: async () => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include", // sends the HttpOnly refresh cookie
      });
      if (!res.ok) return false;
      const data = await res.json();
      set({ user: data.user });
      return true;
    } catch {
      return false;
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    set({ user: null });
  },
}));

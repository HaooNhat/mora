"use client";

import { useAuthOld } from "@/hooks/use-auth";
import { authService } from "@workspace/infrastructure/auth/auth.service";
import type {
  AuthError,
  AuthSession,
  User,
} from "@workspace/infrastructure/auth/auth.types";
import { useRouter } from "next/navigation";
import { createContext, useEffect, useState, type ReactNode } from "react";

/**
 * Auth Context Type
 */
export interface AuthContextType {
  // State
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { session, error } = await authService.getSession();

        if (error) {
          setError(error);
          setUser(null);
          setSession(null);
        } else if (session) {
          setUser(session.user);
          setSession(session);
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
        setError({
          code: "INIT_ERROR",
          message: "Failed to initialize authentication",
          details: err,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Subscribe to auth changes
  useEffect(() => {
    const subscription = authService.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);

      if (session) {
        setUser(session.user);
        setSession(session);
        setError(null);
      } else {
        setUser(null);
        setSession(null);
      }

      // Handle specific events
      if (event === "SIGNED_IN") {
        router.push("/");
      } else if (event === "SIGNED_OUT") {
        router.push("/login");
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Sign in with Google
  const signInWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await authService.signInWithGoogle();

    if (error) {
      setError(error);
      setIsLoading(false);
    }
    // Loading state will be cleared by auth state change listener
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await authService.signInWithGithub();

    if (error) {
      setError(error);
      setIsLoading(false);
    }
  };

  // Sign in with Email
  const signInWithEmail = async (email: string) => {
    setIsLoading(true);
    setError(null);

    const { error } = await authService.signInWithEmail(email);

    if (error) {
      setError(error);
    } else {
      // Show success message - email sent
      setError({
        code: "EMAIL_SENT",
        message: "Check your email for the magic link!",
      });
    }

    setIsLoading(false);
  };

  // Sign out
  const signOut = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await authService.signOut();

    if (error) {
      setError(error);
      setIsLoading(false);
    }
    // Loading state will be cleared by auth state change listener
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    error,
    signInWithGoogle,
    signInWithGithub,
    signInWithEmail,
    signOut,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthOld();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading };
}

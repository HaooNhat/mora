/**
 * Authentication Service
 *
 * Handles all authentication operations:
 * - Sign in with Google
 * - Sign out
 * - Get current session
 * - Handle auth state changes
 */

//TODO: find a place to move this files to
import { supabase } from "@workspace/infrastructure/database/supabase-client";
import type {
  User,
  AuthSession,
  AuthError,
} from "@workspace/infrastructure/auth/auth.types";

/**
 * Transform Supabase user to our User type
 */
function mapSupabaseUser(supabaseUser: any): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email!,
    name:
      supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
    avatar:
      supabaseUser.user_metadata?.avatar_url ||
      supabaseUser.user_metadata?.picture,
    createdAt: new Date(supabaseUser.created_at),
  };
}

/**
 * Auth Service
 */
export const authService = {
  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle(
    redirectTo?: string,
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return {
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      return { error: null };
    } catch (err) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to sign in with Google",
          details: err,
        },
      };
    }
  },

  /**
   * Sign in with GitHub OAuth
   */
  async signInWithGithub(
    redirectTo?: string,
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      return { error: null };
    } catch (err) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to sign in with GitHub",
          details: err,
        },
      };
    }
  },

  /**
   * Sign in with Email (Magic Link)
   */
  async signInWithEmail(
    email: string,
    redirectTo?: string,
  ): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            redirectTo || `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      return { error: null };
    } catch (err) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to send magic link",
          details: err,
        },
      };
    }
  },

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      return { error: null };
    } catch (err) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to sign out",
          details: err,
        },
      };
    }
  },

  /**
   * Get current session
   */
  async getSession(): Promise<{
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        return {
          session: null,
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      if (!data.session) {
        return { session: null, error: null };
      }

      const authSession: AuthSession = {
        user: mapSupabaseUser(data.session.user),
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token!,
        expiresAt: new Date(data.session.expires_at! * 1000),
      };

      return { session: authSession, error: null };
    } catch (err) {
      return {
        session: null,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to get session",
          details: err,
        },
      };
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{
    user: User | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        return {
          user: null,
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      if (!data.user) {
        return { user: null, error: null };
      }

      return { user: mapSupabaseUser(data.user), error: null };
    } catch (err) {
      return {
        user: null,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to get user",
          details: err,
        },
      };
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(
    callback: (event: string, session: AuthSession | null) => void,
  ) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, supabaseSession) => {
      if (!supabaseSession) {
        callback(event, null);
        return;
      }

      const session: AuthSession = {
        user: mapSupabaseUser(supabaseSession.user),
        accessToken: supabaseSession.access_token,
        refreshToken: supabaseSession.refresh_token!,
        expiresAt: new Date(supabaseSession.expires_at! * 1000),
      };

      callback(event, session);
    });

    return subscription;
  },

  /**
   * Refresh session
   */
  async refreshSession(): Promise<{
    session: AuthSession | null;
    error: AuthError | null;
  }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        return {
          session: null,
          error: {
            code: error.name || "AUTH_ERROR",
            message: error.message,
            details: error,
          },
        };
      }

      if (!data.session) {
        return { session: null, error: null };
      }

      const authSession: AuthSession = {
        user: mapSupabaseUser(data.session.user),
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token!,
        expiresAt: new Date(data.session.expires_at! * 1000),
      };

      return { session: authSession, error: null };
    } catch (err) {
      return {
        session: null,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to refresh session",
          details: err,
        },
      };
    }
  },
};

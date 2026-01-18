/**
 * Authentication Types
 */

//TODO: find a place to move this file to
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export type AuthProvider = "google" | "github" | "email";

export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

import { components } from "@/lib/api-client";

export type User = components["schemas"]["UserResponseDto"];
export type LoginDto = components["schemas"]["LoginWithPasswordDto"];
export type RegisterResponse = components["schemas"]["AuthSuccessResponseDto"];

export interface AuthError {
  message: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}

export interface AuthActions {
  init: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => void;
  register: (
    input: RegisterInput,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

import { ApiError } from "@/lib/api-client";
import type { AuthError } from "../types/auth.types";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

/** Normalise any thrown value into a plain { message } shape. */
export function toAuthError(err: unknown): AuthError {
  if (err instanceof ApiError) return { message: err.message };
  if (err instanceof Error) return { message: err.message };
  return { message: "Something went wrong. Please try again." };
}

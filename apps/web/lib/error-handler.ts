import { toast } from "@mora/ui/components/sonner";

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message);
  }

  return new AppError("An unexpected error occurred");
}

export function showErrorToast(error: unknown) {
  const appError = handleApiError(error);
  toast.error(appError.message);
}

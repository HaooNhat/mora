import { useCallback } from "react";
import { handleApiError, showErrorToast } from "@/lib/error-handler";

export function useErrorHandler() {
  const handleError = useCallback((error: unknown) => {
    const appError = handleApiError(error);
    showErrorToast(appError);
    console.error("Error:", appError);
  }, []);

  return { handleError };
}

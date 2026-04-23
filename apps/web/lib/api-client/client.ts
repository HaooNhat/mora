import { ApiError } from "./errors";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

// NestJS error body shapes
type ErrorBody = {
  message?: string | string[];
  error?: { message?: string | string[]; code?: string };
};

class ApiClient {
  /**
   * Core fetch wrapper.
   * - Automatically includes credentials (httpOnly cookies).
   * - On 401, attempts a single silent token refresh then retries.
   * - Throws `ApiError` for all non-2xx responses.
   */
  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const init: RequestInit = {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    };

    const res = await fetch(`${BASE_URL}${path}`, init);

    if (res.status === 401) {
      await this.refresh(); // throws ApiError if refresh fails
      const retryRes = await fetch(`${BASE_URL}${path}`, init);
      if (!retryRes.ok) throw await this.toError(retryRes);
      return retryRes.json() as Promise<T>;
    }

    if (!res.ok) throw await this.toError(res);
    if (res.status === 204) return undefined as T; // No Content
    return res.json() as Promise<T>;
  }

  /** Attempt a silent token refresh. Throws if the refresh itself fails. */
  private async refresh(): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw await this.toError(res);
  }

  /** Parse a non-2xx Response into a typed ApiError. */
  private async toError(res: Response): Promise<ApiError> {
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    const raw =
      body.message ?? body.error?.message ?? `Request failed: ${res.status}`;
    const message = Array.isArray(raw) ? (raw[0] ?? String(raw)) : String(raw);
    return new ApiError(message, res.status);
  }

  get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  put<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const api = new ApiClient();

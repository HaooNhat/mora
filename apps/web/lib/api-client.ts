import { useAuthStore } from "@/components/auth/store/auth.store";

class ApiClient {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL!;

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const { accessToken } = useAuthStore.getState();

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
    });

    // Token expired — try to refresh once
    if (res.status === 401) {
      const refreshed = await useAuthStore.getState().refresh();
      if (!refreshed) {
        useAuthStore.getState().logout();
        throw new Error("Session expired");
      }

      // Retry with new token
      const newToken = useAuthStore.getState().accessToken;
      const retryRes = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(newToken && { Authorization: `Bearer ${newToken}` }),
          ...options.headers,
        },
      });

      if (!retryRes.ok) throw await this.parseError(retryRes);
      return retryRes.json();
    }

    if (!res.ok) throw await this.parseError(res);
    return res.json();
  }

  private async parseError(res: Response) {
    const body = await res.json().catch(() => ({}));
    return new Error(body.message || `Request failed: ${res.status}`);
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }
  post<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }
  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }
  delete<T>(path: string) {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const api = new ApiClient();

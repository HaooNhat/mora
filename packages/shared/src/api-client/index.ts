// import { ProductivityMetrics } from "@workspace/domain/domain-services/productivity-calculator.service";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(error.error || "Request failed");
    }

    // Handle 204 No Content safely
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Projects
  async getProjects(userId: string) {
    return this.request(`/projects?userId=${encodeURIComponent(userId)}`);
  }

  async createProject(data: {
    userId: string;
    name: string;
    description?: string;
    color?: string;
  }) {
    return this.request("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(
    id: string,
    data: { name?: string; description?: string; color?: string },
  ) {
    return this.request(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<void>(`/projects/${id}`, {
      method: "DELETE",
    });
  }

  // Tasks
  async createTask(data: {
    projectId: string;
    title: string;
    description?: string;
    priority: "urgent" | "important" | "normal";
    deadline?: string;
    notes?: string;
    isBoring?: boolean;
    isCreative?: boolean;
    estimatedDuration?: number;
  }) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async completeTask(taskId: string) {
    return this.request(`/tasks/${taskId}/complete`, {
      method: "POST",
    });
  }

  async getTasksByArousal(userId: string, arousal: string) {
    return this.request(
      `/tasks/by-arousal?userId=${encodeURIComponent(userId)}&arousal=${encodeURIComponent(
        arousal,
      )}`,
    );
  }

  // Timer
  async startTimerSession(data: {
    userId: string;
    taskId?: string;
    mode: "pomodoro" | "stopwatch";
    phase?: "focus" | "short_break" | "long_break";
    plannedDuration: number;
  }) {
    return this.request("/timer/sessions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async completeTimerSession(sessionId: string, pausedDuration = 0) {
    return this.request(`/timer/sessions/${sessionId}/complete`, {
      method: "POST",
      body: JSON.stringify({ pausedDuration }),
    });
  }

  async getTimerSessions(userId: string, startDate?: string, endDate?: string) {
    let url = `/timer/sessions?userId=${encodeURIComponent(userId)}`;
    if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
    if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
    return this.request(url);
  }

  // Arousal
  async recordArousal(data: {
    userId: string;
    arousal: string;
    note?: string;
  }) {
    return this.request("/arousal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getCurrentArousal(userId: string) {
    return this.request(`/arousal?userId=${encodeURIComponent(userId)}`);
  }

  async getArousalInsights(userId: string, startDate: string, endDate: string) {
    return this.request(
      `/arousal/insights?userId=${encodeURIComponent(
        userId,
      )}&startDate=${encodeURIComponent(
        startDate,
      )}&endDate=${encodeURIComponent(endDate)}`,
    );
  }

  // Suggestions
  async getTaskSuggestion(userId: string) {
    return this.request(
      `/suggestions/task?userId=${encodeURIComponent(userId)}`,
    );
  }

  async getTimerRecommendation(userId: string) {
    return this.request(
      `/suggestions/timer?userId=${encodeURIComponent(userId)}`,
    );
  }

  // Productivity
  // async getProductivityReport(
  //   userId: string,
  //   startDate: string,
  //   endDate: string,
  // ): Promise<
  //   | {
  //       error: string;
  //     }
  //   | {
  //       report: ProductivityMetrics;
  //     }
  // > {
  //   return this.request(
  //     `/productivity/report?userId=${encodeURIComponent(
  //       userId,
  //     )}&startDate=${encodeURIComponent(
  //       startDate,
  //     )}&endDate=${encodeURIComponent(endDate)}`,
  //   );
  // }
}

export const apiClient = new ApiClient();

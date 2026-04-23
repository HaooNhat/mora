import type {
  LoginDto,
  RegisterInput,
  User,
} from "@/features/auth/types/auth.types";
import { api } from "@/lib/api-client";

interface DataResponse<T> {
  data: T;
}
interface RegisterResponse {
  data: { success: boolean; message: string };
}

/** Pure endpoint map — one function per backend route, no logic. */
export const authApi = {
  me: () => api.get<DataResponse<User>>("/auth/me"),
  login: (dto: LoginDto) => api.post<void>("/auth/login", dto),
  register: (dto: RegisterInput) =>
    api.post<RegisterResponse>("/auth/register", dto),
  logout: () => api.post<void>("/auth/logout"),
};

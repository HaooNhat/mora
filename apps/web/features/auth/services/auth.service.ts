import type {
  LoginDto,
  RegisterInput,
  RegisterResponse,
  User,
} from "../types/auth.types";
import { authApi } from "./auth.api";

interface DataResponse<T> {
  data: T;
}

/**
 * Orchestration layer — only exists for flows that span multiple API calls.
 * Simple calls (me, register, logout) go straight from store → authApi.
 */
export const authService = {
  /**
   * Login is two-step: POST credentials → GET profile.
   * Isolated here so the store doesn't know about this backend quirk.
   */
  login: async (dto: LoginDto): Promise<DataResponse<User>> => {
    await authApi.login(dto);
    return authApi.me();
  },
  register: async (
    dto: RegisterInput,
  ): Promise<DataResponse<RegisterResponse>> => {
    return authApi.register(dto);
  },
};

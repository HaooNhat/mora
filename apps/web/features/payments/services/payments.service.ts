import { api } from "@/lib/api-client";

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface Payment {
  id: string;
  invoiceId: string | null;
  payerOrgId: string;
  payeeOrgId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface DataResponse<T> {
  data: T;
}

export const paymentsService = {
  list: async (orgId: string, page = 1, limit = 20, status?: PaymentStatus) => {
    const params = new URLSearchParams({ orgId, page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    const res = await api.get<{ statusCode: number; message: string; data: PaginatedResponse<Payment> }>(
      `/payments?${params}`
    );
    return res.data;
  },

  get: (id: string, orgId: string) =>
    api.get<DataResponse<Payment>>(`/payments/${id}?orgId=${encodeURIComponent(orgId)}`),

  fail: (id: string, orgId: string) =>
    api.post<DataResponse<Payment>>(`/payments/${id}/fail?orgId=${encodeURIComponent(orgId)}`),
};

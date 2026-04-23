import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ORDERED";

export interface RequisitionItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  currency: string;
  notes: string | null;
}

export interface Requisition {
  id: string;
  title: string;
  description: string | null;
  status: RequisitionStatus;
  totalAmount: number;
  currency: string;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: RequisitionItem[];
}

export interface CreateRequisitionItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface CreateRequisitionInput {
  title: string;
  description?: string;
  orgId: string;
  currency?: string;
  items: CreateRequisitionItemInput[];
}

interface DataResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const requisitionsService = {
  list: async (orgId: string, page = 1, limit = 20) => {
    const res = await api.get<{
      statusCode: number;
      message: string;
      data: PaginatedResponse<Requisition>;
    }>(
      `/requisitions?orgId=${encodeURIComponent(orgId)}&page=${page}&limit=${limit}`,
    );

    return res.data;
  },

  get: (id: string, orgId: string) =>
    api.get<DataResponse<Requisition>>(
      `/requisitions/${id}?orgId=${encodeURIComponent(orgId)}`,
    ),

  create: (input: CreateRequisitionInput) =>
    api.post<DataResponse<Requisition>>("/requisitions", input),

  update: (id: string, orgId: string, input: Partial<CreateRequisitionInput>) =>
    api.patch<DataResponse<Requisition>>(
      `/requisitions/${id}?orgId=${encodeURIComponent(orgId)}`,
      input,
    ),

  delete: (id: string, orgId: string) =>
    api.delete<void>(`/requisitions/${id}?orgId=${encodeURIComponent(orgId)}`),

  submit: (id: string, orgId: string) =>
    api.post<DataResponse<Requisition>>(
      `/requisitions/${id}/submit?orgId=${encodeURIComponent(orgId)}`,
    ),

  approve: (id: string, orgId: string) =>
    api.post<DataResponse<Requisition>>(
      `/requisitions/${id}/approve?orgId=${encodeURIComponent(orgId)}`,
    ),

  reject: (id: string, orgId: string, rejectedReason: string) =>
    api.post<DataResponse<Requisition>>(
      `/requisitions/${id}/reject?orgId=${encodeURIComponent(orgId)}`,
      { rejectedReason },
    ),
};

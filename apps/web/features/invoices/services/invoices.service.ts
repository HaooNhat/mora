import { api } from "@/lib/api-client";

export type InvoiceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_MATCH"
  | "MATCHED"
  | "EXCEPTION"
  | "APPROVED"
  | "REJECTED"
  | "PAID";

export interface InvoiceItem {
  id: string;
  orderItemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  discountAmount: number;
  totalPrice: number;
  currency: string;
  notes: string | null;
}

export interface Invoice {
  id: string;
  status: InvoiceStatus;
  supplierOrgId: string;
  buyerOrgId: string;
  orderId: string | null;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  matchNotes: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
  items: InvoiceItem[];
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const invoicesService = {
  list: async (orgId: string, page = 1, limit = 20, status?: InvoiceStatus) => {
    const params = new URLSearchParams({
      orgId,
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    const res = await api.get<{
      statusCode: number;
      message: string;
      data: PaginatedResponse<Invoice>;
    }>(`/invoices?${params}`);
    return res.data;
  },

  get: (id: string, orgId: string) =>
    api.get<{ data: Invoice }>(
      `/invoices/${id}?orgId=${encodeURIComponent(orgId)}`,
    ),

  submit: (id: string, orgId: string) =>
    api.post<{ data: Invoice }>(
      `/invoices/${id}/submit?orgId=${encodeURIComponent(orgId)}`,
    ),

  approve: (id: string, orgId: string) =>
    api.post<{ data: Invoice }>(
      `/invoices/${id}/approve?orgId=${encodeURIComponent(orgId)}`,
    ),

  reject: (id: string, orgId: string, rejectedReason: string) =>
    api.post<{ data: Invoice }>(
      `/invoices/${id}/reject?orgId=${encodeURIComponent(orgId)}`,
      { rejectedReason },
    ),
};

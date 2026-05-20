import { api } from "@/lib/api-client";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "CONFIRMED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "INVOICED"
  | "CLOSED"
  | "CANCELLED";

export interface PurchaseOrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface PurchaseOrder {
  id: string;
  requisitionId: string | null;
  buyerOrgId: string;
  supplierOrgId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string | null;
  subtotal: number;
  shippingAmount: number;
  totalAmount: number;
  currency: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  requisitionId: string;
  buyerOrgId: string;
  supplierOrgId: string;
  expectedDate?: string;
  shippingAmount?: number;
  currency?: string;
  notes?: string;
  items: CreatePurchaseOrderItemInput[];
}

export interface DataResponse<T> {
  data: T;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const purchaseOrdersService = {
  list: async (orgId: string, page = 1, limit = 20) => {
    const res = await api.get<{
      statusCode: number;
      message: string;
      data: PaginatedResponse<PurchaseOrder>;
    }>(
      `/purchase-orders?orgId=${encodeURIComponent(orgId)}&page=${page}&limit=${limit}`,
    );
    return res.data;
  },

  get: (id: string, orgId: string) =>
    api.get<DataResponse<PurchaseOrder>>(
      `/purchase-orders/${id}?orgId=${encodeURIComponent(orgId)}`,
    ),

  create: (input: CreatePurchaseOrderInput) =>
    api.post<DataResponse<PurchaseOrder>>("/purchase-orders", input),

  send: (id: string, orgId: string) =>
    api.post<DataResponse<PurchaseOrder>>(
      `/purchase-orders/${id}/send?orgId=${encodeURIComponent(orgId)}`,
    ),

  confirm: (id: string, orgId: string) =>
    api.post<DataResponse<PurchaseOrder>>(
      `/purchase-orders/${id}/confirm?orgId=${encodeURIComponent(orgId)}`,
    ),

  cancel: (id: string, orgId: string) =>
    api.post<DataResponse<PurchaseOrder>>(
      `/purchase-orders/${id}/cancel?orgId=${encodeURIComponent(orgId)}`,
    ),
};

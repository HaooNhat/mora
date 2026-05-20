"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Invoice,
  InvoiceStatus,
  invoicesService,
} from "../services/invoices.service";

const keys = {
  list: (orgId: string, status?: InvoiceStatus) =>
    status ? ["invoices", orgId, status] as const : ["invoices", orgId] as const,
  detail: (orgId: string, id: string) => ["invoices", orgId, id] as const,
};

export function useInvoices(orgId: string | null, status?: InvoiceStatus) {
  return useQuery<{
    data: Invoice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: keys.list(orgId ?? "", status),
    enabled: !!orgId,
    queryFn: async () => {
      return invoicesService.list(orgId!, 1, 20, status);
    },
  });
}

export function useInvoice(orgId: string | null, id: string | null) {
  return useQuery({
    queryKey: keys.detail(orgId ?? "", id ?? ""),
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const res = await invoicesService.get(id!, orgId!);
      return res.data;
    },
  });
}

export function useSubmitInvoice(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await invoicesService.submit(id, orgId);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useApproveInvoice(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await invoicesService.approve(id, orgId);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useRejectInvoice(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rejectedReason }: { id: string; rejectedReason: string }) => {
      const res = await invoicesService.reject(id, orgId, rejectedReason);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", orgId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

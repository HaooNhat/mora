"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Payment,
  PaymentStatus,
  paymentsService,
} from "../services/payments.service";

const keys = {
  list: (orgId: string, status?: PaymentStatus) =>
    status
      ? (["payments", orgId, status] as const)
      : (["payments", orgId] as const),
  detail: (orgId: string, id: string) => ["payments", orgId, id] as const,
};

export function usePayments(orgId: string | null, status?: PaymentStatus) {
  return useQuery<{
    data: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: keys.list(orgId ?? "", status),
    enabled: !!orgId,
    queryFn: async () => {
      return paymentsService.list(orgId!, 1, 20, status);
    },
  });
}

export function usePayment(orgId: string | null, id: string | null) {
  return useQuery({
    queryKey: keys.detail(orgId ?? "", id ?? ""),
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const res = await paymentsService.get(id!, orgId!);
      return res.data;
    },
  });
}

export function useFailPayment(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await paymentsService.fail(id, orgId);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["payments", orgId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreatePurchaseOrderInput,
  PurchaseOrder,
  purchaseOrdersService,
} from "../services/purchase-orders.service";

const keys = {
  list: (orgId: string) => ["purchase-orders", orgId] as const,
  detail: (orgId: string, id: string) =>
    ["purchase-orders", orgId, id] as const,
};

export function usePurchaseOrders(orgId: string | null) {
  return useQuery<{
    data: PurchaseOrder[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: keys.list(orgId ?? ""),
    enabled: !!orgId,
    queryFn: () => purchaseOrdersService.list(orgId!),
  });
}

export function usePurchaseOrder(orgId: string | null, id: string | null) {
  return useQuery({
    queryKey: keys.detail(orgId ?? "", id ?? ""),
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const res = await purchaseOrdersService.get(id!, orgId!);
      return res.data;
    },
  });
}

export function useCreatePurchaseOrder(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePurchaseOrderInput) =>
      purchaseOrdersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
    },
  });
}

export function useSendPurchaseOrder(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.send(id, orgId),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useConfirmPurchaseOrder(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.confirm(id, orgId),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useCancelPurchaseOrder(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersService.cancel(id, orgId),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

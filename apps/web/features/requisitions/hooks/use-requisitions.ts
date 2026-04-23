"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateRequisitionInput,
  Requisition,
  requisitionsService,
} from "../services/requisitions.service";

const keys = {
  list: (orgId: string) => ["requisitions", orgId] as const,
  detail: (orgId: string, id: string) => ["requisitions", orgId, id] as const,
};

export function useRequisitions(orgId: string | null) {
  return useQuery<{
    data: Requisition[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>({
    queryKey: keys.list(orgId ?? ""),
    enabled: !!orgId,
    queryFn: async () => {
      return requisitionsService.list(orgId!);
    },
  });
}

export function useRequisition(orgId: string | null, id: string | null) {
  return useQuery({
    queryKey: keys.detail(orgId ?? "", id ?? ""),
    enabled: !!orgId && !!id,
    queryFn: async () => {
      const res = await requisitionsService.get(id!, orgId!);
      return res.data;
    },
  });
}

export function useCreateRequisition(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateRequisitionInput) => {
      const res = await requisitionsService.create({ ...input, orgId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
    },
  });
}

export function useSubmitRequisition(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await requisitionsService.submit(id, orgId);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useApproveRequisition(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await requisitionsService.approve(id, orgId);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useRejectRequisition(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await requisitionsService.reject(id, orgId, reason);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: keys.detail(orgId, id) });
    },
  });
}

export function useDeleteRequisition(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await requisitionsService.delete(id, orgId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list(orgId) });
    },
  });
}

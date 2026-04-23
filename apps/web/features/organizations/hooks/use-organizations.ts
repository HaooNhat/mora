"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreateOrganizationInput,
  organizationsService,
} from "../services/organizations.service";

const QUERY_KEYS = {
  myOrganizations: ["organizations", "me"] as const,
};

export function useMyOrganizations() {
  return useQuery({
    queryKey: QUERY_KEYS.myOrganizations,
    queryFn: async () => {
      const res = await organizationsService.getMyOrganizations();
      return res.data;
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      const res = await organizationsService.create(input);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myOrganizations });
    },
  });
}

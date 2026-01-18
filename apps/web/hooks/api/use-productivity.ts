// import { useQuery } from "@tanstack/react-query";
// import { apiClient } from "@workspace/shared/api-client";
//
// export const productivityKeys = {
//   report: (userId: string, startDate: string, endDate: string) =>
//     ["productivity", "report", userId, startDate, endDate] as const,
// };
//
// // GET Productivity Report
// export function useProductivityReport(
//   userId: string,
//   startDate: string,
//   endDate: string,
//   enabled: boolean = true,
// ) {
//   return useQuery({
//     queryKey: productivityKeys.report(userId, startDate, endDate),
//     queryFn: () => apiClient.getProductivityReport(userId, startDate, endDate),
//     enabled: enabled && !!userId && !!startDate && !!endDate,
//   });
// }

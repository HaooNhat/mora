import { useTranslations } from "next-intl";
import type { RequisitionStatus } from "../services/requisitions.service";

const STATUS_STYLES: Record<RequisitionStatus, string> = {
  DRAFT:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  SUBMITTED:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  APPROVED:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  REJECTED:
    "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  ORDERED:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

interface RequisitionStatusBadgeProps {
  status: RequisitionStatus;
}

export function RequisitionStatusBadge({ status }: RequisitionStatusBadgeProps) {
  const t = useTranslations("requisitions.status");

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {t(status)}
    </span>
  );
}

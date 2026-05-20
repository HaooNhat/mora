"use client";

import { useOrgContext } from "@/features/dashboard/context/org-context";
import { CreatePurchaseOrderForm } from "@/features/purchase-orders/components/create-purchase-order-form";
import { useCreatePurchaseOrder } from "@/features/purchase-orders/hooks/use-purchase-orders";
import { useRequisition } from "@/features/requisitions/hooks/use-requisitions";
import { toast } from "@mora/ui/components/sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NewPurchaseOrderContent() {
  const t = useTranslations("purchaseOrders");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeOrg } = useOrgContext();

  const requisitionId = searchParams.get("requisitionId") ?? "";
  const orgId = activeOrg?.id ?? "";

  const { data: requisition, isLoading: reqLoading } = useRequisition(
    orgId || null,
    requisitionId || null,
  );

  const createMutation = useCreatePurchaseOrder(orgId);

  if (reqLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!requisition && requisitionId) {
    return (
      <div className="text-center py-24 text-red-500 text-sm">
        Requisition not found.
      </div>
    );
  }

  async function handleCreate(
    input: Parameters<typeof createMutation.mutateAsync>[0],
  ) {
    const res = await createMutation.mutateAsync(input);
    toast.success("Purchase order created.");
    router.push(`/${locale}/app/purchase-orders/${res.data.id}`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href={
            requisitionId
              ? `/${locale}/dashboard/requisitions/${requisitionId}`
              : `/${locale}/dashboard/purchase-orders`
          }
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("newOrder")}
        </h1>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <CreatePurchaseOrderForm
          orgId={orgId}
          prefillFromRequisition={requisition ?? undefined}
          onSubmit={handleCreate}
          onCancel={() =>
            router.push(
              requisitionId
                ? `/${locale}/dashboard/requisitions/${requisitionId}`
                : `/${locale}/dashboard/purchase-orders`,
            )
          }
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}

export default function NewPurchaseOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <NewPurchaseOrderContent />
    </Suspense>
  );
}

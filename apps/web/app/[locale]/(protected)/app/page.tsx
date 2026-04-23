"use client";

import { useAuth } from "@/features/auth";
import { CreateOrganizationPanel } from "@/features/organizations/components/create-organization-panel";
import { useMyOrganizations } from "@/features/organizations/hooks/use-organizations";
import type { Organization } from "@/features/organizations/services/organizations.service";
import { RequisitionList } from "@/features/requisitions/components/requisition-list";
import { Button } from "@mora/ui/components/button";
import { Building2, ChevronDown, Loader2, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function AppPage() {
  const t = useTranslations("nav");
  // const tOrg = useTranslations("organizations");
  const { user, logout } = useAuth();

  const { data: orgs, isLoading: orgsLoading } = useMyOrganizations();
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);

  // Set first org as default once loaded
  const organizations = orgs ?? [];
  const selectedOrg = activeOrg ?? organizations[0] ?? null;

  if (orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top navigation */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Org switcher */}
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold bg-linear-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                Mora
              </span>

              {selectedOrg && (
                <div className="relative">
                  <button
                    onClick={() => setOrgPickerOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="max-w-[120px] truncate">
                      {selectedOrg.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>

                  {orgPickerOpen && organizations.length > 1 && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-1 z-20">
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            setActiveOrg(org);
                            setOrgPickerOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            org.id === selectedOrg.id
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <div className="font-medium truncate">{org.name}</div>
                          <div className="text-xs text-gray-400 capitalize">
                            {org.role.replace(/_/g, " ")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="flex items-center gap-3">
              {user && (
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                  {String(user.firstName ?? user.email)}
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => logout()}
                className="flex items-center gap-2 text-sm h-9 px-3"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">{t("signOut")}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {organizations.length === 0 ? (
          /* No org yet — onboard */
          <CreateOrganizationPanel />
        ) : (
          /* Show requisitions for the active org */
          <RequisitionList orgId={selectedOrg!.id} />
        )}
      </main>
    </div>
  );
}

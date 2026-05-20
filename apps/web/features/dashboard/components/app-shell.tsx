"use client";

import { useAuth } from "@/features/auth";
import { OrgContext } from "@/features/dashboard/context/org-context";
import { CreateOrganizationPanel } from "@/features/organizations/components/create-organization-panel";
import { useMyOrganizations } from "@/features/organizations/hooks/use-organizations";
import type { Organization } from "@/features/organizations/services/organizations.service";
import { Button } from "@mora/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@mora/ui/components/dropdown-menu";
import {
  usePathname as useIntlPathname,
  useRouter as useIntlRouter,
} from "@/i18n/navigation";
import { Separator } from "@mora/ui/components/separator";
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Receipt,
  Settings,
  ShoppingCart,
  Sun,
  UserCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { user } = useAuth();

  const { data: orgs, isLoading } = useMyOrganizations();
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);

  const organizations = orgs ?? [];
  const selectedOrg = activeOrg ?? organizations[0] ?? null;

  const navItems = [
    {
      key: "dashboard",
      href: `/${locale}/dashboard`,
      icon: LayoutDashboard,
      label: "Overview",
    },
    {
      key: "requisitions",
      href: `/${locale}/dashboard/requisitions`,
      icon: FileText,
      label: t("requisitions"),
    },
    {
      key: "purchase-orders",
      href: `/${locale}/dashboard/purchase-orders`,
      icon: ShoppingCart,
      label: t("orders"),
    },
    {
      key: "invoices",
      href: `/${locale}/dashboard/invoices`,
      icon: Receipt,
      label: t("invoices"),
    },
    {
      key: "payments",
      href: `/${locale}/dashboard/payments`,
      icon: CreditCard,
      label: t("payments"),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <CreateOrganizationPanel />
      </div>
    );
  }

  return (
    <OrgContext.Provider
      value={{ activeOrg: selectedOrg, organizations, setActiveOrg }}
    >
      <div className="min-h-screen bg-background flex flex-col">
        {/* ── Header ───────────────────────────────────────────────── */}
        <header className="sticky top-0 z-20 bg-background border-b border-border">
          <div className="flex items-center justify-between h-13">
            {/* Logo + org switcher */}
            <div className="flex items-center gap-3 h-full">
              <Link
                href={`/${locale}/dashboard/requisitions`}
                className="text-xl text-foreground font-bold"
              >
                Mora
              </Link>

              <span className="text-border text-lg">/</span>

              {/* <div className="relative"> */}
              {/*   <button */}
              {/*     onClick={() => setOrgPickerOpen((o) => !o)} */}
              {/*     className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" */}
              {/*   > */}
              {/*     <Building2 className="h-4 w-4 text-gray-400 shrink-0" /> */}
              {/*     <span className="max-w-[140px] truncate"> */}
              {/*       {selectedOrg?.name} */}
              {/*     </span> */}
              {/*     <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" /> */}
              {/*   </button> */}
              {/**/}
              {/*   {orgPickerOpen && organizations.length > 1 && ( */}
              {/*     <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl py-1 z-30"> */}
              {/*       {organizations.map((org) => ( */}
              {/*         <button */}
              {/*           key={org.id} */}
              {/*           onClick={() => { */}
              {/*             setActiveOrg(org); */}
              {/*             setOrgPickerOpen(false); */}
              {/*           }} */}
              {/*           className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${ */}
              {/*             org.id === selectedOrg?.id */}
              {/*               ? "bg-secondary text-foreground" */}
              {/*               : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" */}
              {/*           }`} */}
              {/*         > */}
              {/*           <div className="font-medium truncate">{org.name}</div> */}
              {/*           <div className="text-xs text-gray-400 capitalize mt-0.5"> */}
              {/*             {org.role.replace(/_/g, " ")} */}
              {/*           </div> */}
              {/*         </button> */}
              {/*       ))} */}
              {/*     </div> */}
              {/*   )} */}
              {/* </div> */}
            </div>

            {/* User menu */}
            <div className="flex items-center h-full">
              <SettingButton />
              <Separator orientation="vertical" />
              <UserButton user={user} locale={locale} />
            </div>
          </div>
        </header>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — desktop */}
          <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border bg-card pt-4 pb-6">
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map(({ key, href, icon: Icon, label }) => {
                const active =
                  key === "dashboard"
                    ? pathname.endsWith("/dashboard")
                    : pathname.includes(`/dashboard/${key}`);
                return (
                  <Link
                    key={key}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Org role badge at bottom */}
            {selectedOrg && (
              <div className="mx-3 px-3 py-2 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground truncate">
                  {selectedOrg.name}
                </p>
                <p className="text-xs font-medium text-foreground capitalize mt-0.5">
                  {selectedOrg.role.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </aside>

          {/* Mobile bottom nav */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-card border-t border-border flex">
            {navItems.map(({ key, href, icon: Icon, label }) => {
              const active =
                key === "dashboard"
                  ? pathname.endsWith("/dashboard")
                  : pathname.includes(`/dashboard/${key}`);
              return (
                <Link
                  key={key}
                  href={href}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </OrgContext.Provider>
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const LOCALES = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
] as const;

function getInitials(
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    picture: string | null;
  } | null,
) {
  if (!user) return "?";
  if (user.firstName && user.lastName)
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  if (user.firstName) return user.firstName.slice(0, 2).toUpperCase();
  return user.email.slice(0, 2).toUpperCase();
}

function UserButton({
  user,
  locale,
}: {
  user: ReturnType<typeof useAuth>["user"];
  locale: string;
}) {
  const { logout } = useAuth();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : (user?.email ?? "");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-3 h-12 hover:bg-secondary/60 transition-colors focus:outline-none">
          <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
            {getInitials(user)}
          </div>
          <span className="hidden sm:block text-sm text-foreground max-w-[120px] truncate">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={2}
        className="w-56 rounded-none"
        align="end"
      >
        {/* Identity header */}
        <div className="px-3 py-2.5 border-b border-border">
          <p className="text-sm font-medium text-foreground truncate">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {user?.email}
          </p>
        </div>

        <DropdownMenuGroup className="py-1">
          <DropdownMenuItem asChild className="gap-2">
            <Link href={`/${locale}/dashboard/profile`}>
              <UserCircle className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup className="py-1">
          <DropdownMenuItem asChild className="gap-2 text-muted-foreground">
            <Link href={`/${locale}/updates`}>What&apos;s new</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup className="py-1">
          <DropdownMenuItem
            onClick={() => logout()}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SettingButton() {
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const intlRouter = useIntlRouter();
  const intlPathname = useIntlPathname();

  function switchLocale(next: string) {
    intlRouter.replace(intlPathname, { locale: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-12 focus-within:text-primary rounded-none"
        >
          <Settings />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        alignOffset={-1}
        sideOffset={2}
        className="w-52 rounded-none"
        align="end"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          {THEMES.map(({ value, label, icon: Icon }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setTheme(value)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
              {theme === value && (
                <DropdownMenuShortcut>✓</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Language</DropdownMenuLabel>
          {LOCALES.map(({ value, label, flag }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => switchLocale(value)}
              className="gap-2"
            >
              <span className="text-base leading-none">{flag}</span>
              {label}
              {locale === value && (
                <DropdownMenuShortcut>✓</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Locale-aware navigation utilities.
// Use these instead of next/navigation for correct locale-prefixed URLs.
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

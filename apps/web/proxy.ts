import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const intlProxy = createMiddleware(routing);

const PROTECTED_PATHS = ["/app", "/dashboard", "/settings"];

const localePattern = new RegExp(`^\\/(${routing.locales.join("|")})(\\/|$)`);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const localeMatch = pathname.match(localePattern);
  const locale = localeMatch?.[1] ?? routing.defaultLocale;
  const pathWithoutLocale = localeMatch
    ? pathname.slice(localeMatch[0].length - (localeMatch[2] === "/" ? 1 : 0))
    : pathname;

  const isProtected = PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "/"),
  );

  if (isProtected) {
    const hasToken =
      req.cookies.has("accessToken") || req.cookies.has("refreshToken");
    if (!hasToken) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }
  }

  return intlProxy(req);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

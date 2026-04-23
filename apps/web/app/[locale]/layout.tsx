import { Providers } from "@/components/providers";
import { AuthInitializer } from "@/features/auth";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/react-query-provider";
import { Toaster } from "@mora/ui/components/sonner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "vi")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <QueryProvider>
        <AuthInitializer />
        <Providers>{children}</Providers>
        <Toaster />
      </QueryProvider>
    </NextIntlClientProvider>
  );
}

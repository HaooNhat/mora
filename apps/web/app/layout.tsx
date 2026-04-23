import "@mora/ui/globals.css";
import { getLocale } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

/**
 * Root layout — provides the html/body shell with locale-aware lang attribute.
 * All oroviders and feature layouts live in [locale]/layout.tsx.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="font-sans antialiased min-h-dvh md:min-h-screen">
        {children}
      </body>
    </html>
  );
}

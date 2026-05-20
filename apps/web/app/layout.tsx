import "@mora/ui/globals.css";
import { getLocale } from "next-intl/server";
import { Inter, Inter_Tight } from "next/font/google";

const fontInter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fontInterTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
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
      className={`${fontInter.variable} ${fontInter.className} ${fontInterTight.variable}`}
    >
      <body className="antialiased min-h-dvh md:min-h-screen">{children}</body>
    </html>
  );
}

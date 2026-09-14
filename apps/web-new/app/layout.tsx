import type { Metadata } from "next";

import { CookieBanner } from "@/components/cookie-banner";
import { KindredChrome } from "@/components/kindred/app/kindred-chrome";
import { KindredProvider } from "@/components/kindred/app/kindred-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "BEJELI",
  description: "AI recruitment ecosystem for professionals, recruiters, and companies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <KindredProvider>
          <KindredChrome>
            {children}
            <CookieBanner />
          </KindredChrome>
        </KindredProvider>
      </body>
    </html>
  );
}

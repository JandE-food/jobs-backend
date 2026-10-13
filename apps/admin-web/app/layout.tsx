import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminProvider } from "@/components/admin-app";

import "./globals.css";

export const metadata: Metadata = {
  title: "BEJELI Admin",
  description: "Standalone admin dashboard for BEJELI.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AdminProvider>{children}</AdminProvider>
      </body>
    </html>
  );
}

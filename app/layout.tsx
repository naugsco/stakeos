import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppUpdateNotice } from "@/components/app-update-notice";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "StakeOS",
  description: "Private AI assistant and intelligence dashboard for stake leadership."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
        </div>
        <Navigation />
        <AppUpdateNotice />
        <main className="mx-auto max-w-7xl px-6 py-8 pb-16">{children}</main>
      </body>
    </html>
  );
}

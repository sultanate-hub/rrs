import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/PWARegister";
import { RRSProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "RRS Anti-Social Vices Management System",
  description: "Secure case, suspect, evidence and court records for the Rapid Response Squad.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "RRS ASV" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b2545",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PWARegister />
        <RRSProvider>{children}</RRSProvider>
      </body>
    </html>
  );
}

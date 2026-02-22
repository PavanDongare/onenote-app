import type { Metadata, Viewport } from "next";
import { TenantProvider } from "@/lib/auth/tenant-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneNote",
  description: "Canvas-based note-taking app",
  icons: {
    icon: "/triangle.svg",
    shortcut: "/triangle.svg",
    apple: "/triangle.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Platform",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased h-screen overflow-hidden">
        <TenantProvider value={{ userId: '00000000-0000-0000-0000-000000000002', tenantId: '00000000-0000-0000-0000-000000000001', isAdmin: false }}>
          <main className="h-screen overflow-hidden">
            {children}
          </main>
        </TenantProvider>
      </body>
    </html>
  );
}

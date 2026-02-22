import type { Metadata, Viewport } from "next";
import { TenantProvider } from "@/lib/auth/tenant-context";
import { getUserContext } from "@/lib/auth/get-user-context";
import { UserNav } from "@/components/navigation/user-nav";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userContext = await getUserContext();

  return (
    <html lang="en">
      <body className="antialiased h-screen overflow-hidden">
        <TenantProvider value={{ 
          userId: userContext?.userId ?? '00000000-0000-0000-0000-000000000002', 
          tenantId: userContext?.tenantId ?? '00000000-0000-0000-0000-000000000001', 
          isAdmin: userContext?.isAdmin ?? false 
        }}>
          <div className="flex flex-col h-screen overflow-hidden">
            {userContext && <UserNav email={userContext.email} />}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </TenantProvider>
      </body>
    </html>
  );
}

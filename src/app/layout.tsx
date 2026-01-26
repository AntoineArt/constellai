import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "ConstellAI",
  description: "A modern web application with AI tools collection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans antialiased h-full overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="overflow-hidden">{children}</SidebarInset>
        </SidebarProvider>
        <Analytics />
      </body>
    </html>
  );
}

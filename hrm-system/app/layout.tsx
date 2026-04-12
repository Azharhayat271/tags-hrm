import type { Metadata } from "next";
import "./globals.css";
import { LoadingProvider } from "@/lib/hooks";
import Loader from "@/components/layout/Loader";
import { RouteChangeLoaderProvider } from "@/components/layout/RouteChangeLoaderProvider";

export const metadata: Metadata = {
  title: "TAG Solutions HRM",
  description: "Human Resource Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body 
        className="min-h-full flex flex-col"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontWeight: 300,
          fontFeatureSettings: '"ss01"'
        }}
      >
        <LoadingProvider>
          <RouteChangeLoaderProvider />
          <Loader />
          {children}
        </LoadingProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AgriSentinel - Intelligence Layer of Agriculture",
  description: "Not data. Decisions. Built for farmers, not interfaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

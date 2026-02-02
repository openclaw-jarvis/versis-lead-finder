import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Versis Lead Finder | Dutch Business Leads",
  description: "Lead generation tool for the Versis sales team. Find and manage Dutch business leads with intelligent scoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

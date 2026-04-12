import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Life Command Center | CEO/Founder Dashboard",
  description: "Your personal command center for goals, calendar, KPIs, and daily operations as a CEO and Founder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

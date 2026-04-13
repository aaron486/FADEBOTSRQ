import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Postgame // Executive Dashboard",
  description: "Mission Control for the Strategic Sports Tech Executive.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-charcoal text-white antialiased">
        {children}
      </body>
    </html>
  );
}

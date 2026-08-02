import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FADE — Creator Tracker",
  description: "Creator outreach, contracting, and post tracking for FADE",
};

// Apply the saved theme before first paint to avoid a flash of the wrong mode.
const themeInit = `try{var t=localStorage.getItem("fade-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

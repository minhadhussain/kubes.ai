import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"]
});

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Real Estate Agent OS",
  description: "The operating system for the full real estate workflow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        <div className="page-frame">{children}</div>
      </body>
    </html>
  );
}

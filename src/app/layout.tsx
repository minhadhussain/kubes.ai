import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";

import "@/app/globals.css";

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"]
});

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Real Estate Agent OS",
  description: "The operating system for the full real estate workflow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable}`}>
        <div className="page-frame">{children}</div>
      </body>
    </html>
  );
}

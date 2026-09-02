import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Real Estate Agent OS",
  description: "The operating system for the full real estate workflow."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="page-frame">{children}</div>
      </body>
    </html>
  );
}

import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/app/providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

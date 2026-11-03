import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Onest } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Холодильник",
  description: "Виртуальный холодильник для контроля сроков годности продуктов",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={onest.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

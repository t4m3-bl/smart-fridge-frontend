import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Onest } from "next/font/google";
import "./globals.css";
import RegisterSW from "@/app/register-sw";
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
      <body style={{ minHeight: "100vh", margin: 0, background: "#F5F5F2", color: "#1C1D1A" }}>
        <Providers>
          <RegisterSW />
          {children}
        </Providers>
      </body>
    </html>
  );
}

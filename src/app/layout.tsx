import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { TelegramBootstrap } from "@/components/TelegramBootstrap";

export const metadata: Metadata = {
  title: "Shaxsiy Ombor",
  description: "Telegram Mini App va web dashboard uchun shaxsiy ombor hisobi"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body>
        <TelegramBootstrap />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

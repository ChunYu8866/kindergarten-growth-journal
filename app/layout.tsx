import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "芽芽成長誌｜幼兒園照片成長日誌",
  description: "將最多 4 張照片排成 1:1 成長日誌，可調整裁切與版型，照片只在本機處理。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}

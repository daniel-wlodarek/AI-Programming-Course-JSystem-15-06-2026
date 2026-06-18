import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Asystent decyzji serwisowej",
  description: "Wstępna ocena zgłoszeń zwrotu i reklamacji sprzętu.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}

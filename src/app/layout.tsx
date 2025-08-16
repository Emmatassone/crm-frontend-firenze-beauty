import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppShell from "@/components/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Metadata can't be in a client component, so we export it from here
export const metadata: Metadata = {
  title: "Firenze Beauty - Gestor de Clientes",
  description: "Administrador de clientes, citas y productos belleza.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-100 text-gray-900 min-h-screen flex flex-col`}>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hi Krew",
  description: "Plataforma de gestión para freelancers",
  icons: {
    icon: "/HiKrewLogo.png",
  },
};

import { AuthProvider } from "@/features/auth/context/auth-context";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

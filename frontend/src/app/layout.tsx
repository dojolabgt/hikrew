
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { TopLoader } from "@/components/ui/top-loader";
import { ClientProviders } from "@/components/providers/client-providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const generalSans = localFont({
  src: "../fonts/web/fonts/GeneralSans-Variable.woff2",
  variable: "--font-general-sans",
  weight: "100 900",
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${generalSans.variable} ${geistMono.variable} font-body antialiased`}
      >
        <TopLoader />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

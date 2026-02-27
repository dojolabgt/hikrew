"use client";

import { useEffect } from "react";
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { useSettings } from "@/hooks/useSettings"; // Use the hook instead of direct calls
import { getImageUrl } from "@/lib/image-utils";
import { ErrorBoundary } from "@/components/error-boundary";
import { TopLoader } from "@/components/ui/top-loader";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const generalSans = localFont({
    src: "../fonts/web/fonts/GeneralSans-Variable.woff2",
    variable: "--font-general-sans",
    weight: "100 900",
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
    const { settings } = useSettings();

    // Update page title and favicon when settings change
    useEffect(() => {
        if (!settings) return;

        // Update page title
        document.title = settings.appName || "Dashboard App";

        // Update favicon (this logic is fine here, or could be moved to a separate component/hook)
        if (settings.appFavicon) {
            const faviconUrl = getImageUrl(settings.appFavicon);

            // Find existing favicon or create new one
            let favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;

            if (!favicon) {
                favicon = document.createElement("link");
                favicon.rel = "icon";
                document.head.appendChild(favicon);
            }

            // Update href with cache busting
            if (faviconUrl) {
                favicon.href = `${faviconUrl}?t=${Date.now()}`;
            }
        }
    }, [settings]);

    return (
        <html lang="en" className="scroll-smooth">
            <head>
                <link rel="icon" href="/favicon.ico" sizes="any" id="favicon" />
            </head>
            <body
                className={`${inter.variable} ${generalSans.variable} ${geistMono.variable} font-body antialiased`}
            >
                <TopLoader />
                <ErrorBoundary>
                    {children}
                    <Toaster position="top-left" richColors />
                </ErrorBoundary>
            </body>
        </html>
    );
}

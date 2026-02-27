"use client";



export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="gradient-bg animate-in fade-in duration-500">
            {children}
        </div>
    );
}

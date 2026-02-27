"use client";
import { useEffect, useState, startTransition } from "react";
import { usePathname } from "next/navigation";

/**
 * Top loading bar that shows during page transitions
 * Inspired by Next.js TopLoader and nprogress
 */
export function TopLoader() {
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Use startTransition to avoid cascading renders
        startTransition(() => {
            setLoading(true);
            setProgress(20);
        });

        // Simulate progress
        const timer1 = setTimeout(() => setProgress(40), 100);
        const timer2 = setTimeout(() => setProgress(60), 300);
        const timer3 = setTimeout(() => setProgress(80), 500);

        // Complete after a short delay
        const completeTimer = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
            }, 200);
        }, 700);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(completeTimer);
        };
    }, [pathname]);

    if (!loading) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-transparent">
            <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    boxShadow: "0 0 10px rgba(59, 130, 246, 0.5)",
                }}
            />
        </div>
    );
}
"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function Preloader() {
    const [show, setShow] = useState(true);

    useEffect(() => {
        // Hide preloader after a short delay to ensure hydration is complete
        // and to give a smooth "intro" feel
        const timer = setTimeout(() => {
            setShow(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 animate-in fade-out fill-mode-forwards">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Cargando...</p>
            </div>
        </div>
    );
}

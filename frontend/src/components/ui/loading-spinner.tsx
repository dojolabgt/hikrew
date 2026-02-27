import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

/**
 * Loading spinner component
 * Shows an animated spinner for loading states
 */
export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12",
    };

    return (
        <Loader2
            className={cn(
                "animate-spin text-zinc-500",
                sizeClasses[size],
                className
            )}
        />
    );
}

/**
 * Full page loading spinner
 */
export function FullPageSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50">
            <div className="text-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-zinc-600">Cargando...</p>
            </div>
        </div>
    );
}

/**
 * Centered loading spinner for sections
 */
export function CenteredSpinner({ message = "Cargando..." }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <LoadingSpinner size="md" />
            {message && <p className="text-sm text-zinc-600">{message}</p>}
        </div>
    );
}

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface AppInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
}

export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
    ({ className, icon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        {icon}
                    </div>
                )}
                <Input
                    ref={ref}
                    className={cn(
                        "h-10 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-white shadow-sm transition-colors",
                        icon ? "pl-10" : "",
                        className
                    )}
                    {...props}
                />
            </div>
        )
    }
)
AppInput.displayName = "AppInput"
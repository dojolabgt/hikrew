import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PrimaryButtonProps = React.ComponentProps<typeof Button> & {
    compact?: boolean
}

export const PrimaryButton = React.forwardRef<HTMLButtonElement, PrimaryButtonProps>(
    ({ className, children, compact, ...props }, ref) => {
        return (
            <Button
                ref={ref}
                className={cn(
                    "rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-md transition-all font-medium",
                    compact
                        ? "h-9 px-4 text-sm"
                        : "h-12 px-6 text-base",
                    className
                )}
                {...props}
            >
                {children}
            </Button>
        )
    }
)
PrimaryButton.displayName = "PrimaryButton"
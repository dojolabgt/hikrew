import * as React from "react";
import { Label as UiLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";

// Wrapper for Shadcn Label to enforce Premium styling
// Features: Uppercase, tracking-wider, small text, subtle color

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
        variant?: "default" | "uppercase";
    }
>(({ className, variant = "uppercase", ...props }, ref) => (
    <UiLabel
        ref={ref}
        className={cn(
            variant === "uppercase" && "text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400",
            className
        )}
        {...props}
    />
));
Label.displayName = "Label";

export { Label };

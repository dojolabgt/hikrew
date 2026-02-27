import * as React from "react";
import { Input as UiInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Wrapper for Shadcn Input to enforce Premium styling
// Features: Rounded-xl, taller height (h-11), soft background, focus transitions

export type InputProps = React.ComponentProps<typeof UiInput>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, ...props }, ref) => {
        return (
            <UiInput
                ref={ref}
                className={cn(
                    "h-11 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50/30 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-zinc-800 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500",
                    className
                )}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export { Input };

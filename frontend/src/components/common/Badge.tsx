import * as React from "react";
import { Badge as UiBadge, badgeVariants as uiBadgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// We wrap the Shadcn Badge to enforce our "Premium" design system consistently.
// For example, if we want all badges to be rounded-md instead of rounded-full, we do it here.

type BadgeProps = React.ComponentProps<typeof UiBadge>;

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <UiBadge
            variant={variant}
            className={cn(
                "rounded-md px-2.5 py-0.5 text-xs font-semibold shadow-sm transition-colors",
                // You can add default overrides here
                className
            )}
            {...props}
        />
    );
}

export { Badge, uiBadgeVariants as badgeVariants };

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button as UiButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Map our atomic variants to Shadcn variants if needed, or extend the logic.
// Since Shadcn Button uses cva, we can pass 'variant' directly if they match,
// or map them if our names differ.
// Our names: primary, secondary, danger, ghost, link
// Shadcn names: default, secondary, destructive, ghost, link, outline

// We'll Create a mapped type or just pass props and let the user use the correct ones?
// The user wants "atomic" style. Let's keep our abstraction but use Shadcn's component.

interface ButtonProps extends Omit<React.ComponentProps<typeof UiButton>, "variant" | "size"> {
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    // Redefine variants to our "Atomic" system
    variant?: "primary" | "secondary" | "danger" | "ghost" | "link" | "outline";
    size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "default", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        // Map our variants to Shadcn's variants
        // Helper type to extract variant prop from UiButton
        type UiButtonVariant = React.ComponentProps<typeof UiButton>["variant"];

        let shadcnVariant: UiButtonVariant = "default";
        switch (variant) {
            case "primary": shadcnVariant = "default"; break;
            case "secondary": shadcnVariant = "outline"; break; // We want outline for secondary usually
            case "danger": shadcnVariant = "destructive"; break;
            case "ghost": shadcnVariant = "ghost"; break;
            case "link": shadcnVariant = "link"; break;
            case "outline": shadcnVariant = "outline"; break;
            default: shadcnVariant = "default";
        }

        // Map our sizes if needed, or pass through
        // ui/button has: default, sm, lg, icon. 
        // We added "icon-sm". We might need to handle that via className or just map to "icon" + class.
        type UiButtonSize = React.ComponentProps<typeof UiButton>["size"];

        let shadcnSize: UiButtonSize = "default";
        let sizeClassName = "";

        if (size === "icon-sm") {
            shadcnSize = "icon";
            sizeClassName = "h-8 w-8"; // Override to be smaller
        } else {
            shadcnSize = size as UiButtonSize; // cast as it mostly matches
        }

        // Additional styling to enforce "atomic" look (e.g. rounded-xl)
        // We can append `rounded-xl` to ensure consistency.

        return (
            <UiButton
                ref={ref}
                variant={shadcnVariant}
                size={shadcnSize}
                disabled={disabled || isLoading}
                className={cn("rounded-xl", sizeClassName, className)} // Enforce rounded-xl
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
            </UiButton>
        );
    }
);
Button.displayName = "Button";

export { Button };

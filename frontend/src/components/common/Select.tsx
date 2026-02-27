import * as React from "react";
import {
    Select as UiSelect,
    SelectGroup,
    SelectValue,
    SelectTrigger as UiSelectTrigger,
    SelectContent as UiSelectContent,
    SelectLabel,
    SelectItem as UiSelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Wrapper for Shadcn Select to enforce Premium styling

const Select = UiSelect;
const SelectGroupCommon = SelectGroup;
const SelectValueCommon = SelectValue;

const SelectTrigger = React.forwardRef<
    React.ElementRef<typeof UiSelectTrigger>,
    React.ComponentPropsWithoutRef<typeof UiSelectTrigger>
>(({ className, children, ...props }, ref) => (
    <UiSelectTrigger
        ref={ref}
        className={cn(
            "h-11 rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50/30 dark:bg-zinc-800/50 focus:bg-white dark:focus:bg-zinc-800 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-zinc-800 dark:text-zinc-100",
            className
        )}
        {...props}
    >
        {children}
    </UiSelectTrigger>
));
SelectTrigger.displayName = "SelectTrigger";

const SelectContent = React.forwardRef<
    React.ElementRef<typeof UiSelectContent>,
    React.ComponentPropsWithoutRef<typeof UiSelectContent>
>(({ className, children, position = "popper", ...props }, ref) => (
    <UiSelectContent
        ref={ref}
        className={cn(
            "rounded-xl border-gray-100 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900",
            className
        )}
        position={position}
        {...props}
    >
        {children}
    </UiSelectContent>
));
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
    React.ElementRef<typeof UiSelectItem>,
    React.ComponentPropsWithoutRef<typeof UiSelectItem>
>(({ className, children, ...props }, ref) => (
    <UiSelectItem
        ref={ref}
        className={cn("cursor-pointer text-zinc-700 dark:text-zinc-300 focus:bg-indigo-50 dark:focus:bg-indigo-950/50 focus:text-indigo-900 dark:focus:text-indigo-100 rounded-lg my-0.5", className)}
        {...props}
    >
        {children}
    </UiSelectItem>
));
SelectItem.displayName = "SelectItem";

export {
    Select,
    SelectGroupCommon as SelectGroup,
    SelectValueCommon as SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
};

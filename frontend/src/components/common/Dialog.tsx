import * as React from "react";
import {
    Dialog as UiDialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent as UiDialogContent,
    DialogHeader as UiDialogHeader,
    DialogFooter as UiDialogFooter,
    DialogTitle as UiDialogTitle,
    DialogDescription as UiDialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Wrapper for Shadcn Dialog to enforce Premium styling
// Rounded-3xl corners, cleaner headers, etc.

const Dialog = UiDialog;
const DialogTriggerCommon = DialogTrigger;
const DialogPortalCommon = DialogPortal;
const DialogCloseCommon = DialogClose;

const DialogContent = React.forwardRef<
    React.ElementRef<typeof UiDialogContent>,
    React.ComponentPropsWithoutRef<typeof UiDialogContent>
>(({ className, children, ...props }, ref) => (
    <UiDialogContent
        ref={ref}
        className={cn(
            "rounded-3xl border-0 shadow-2xl shadow-zinc-900/20 dark:shadow-zinc-950/80 bg-white dark:bg-zinc-900 p-0 overflow-hidden sm:max-w-[450px]",
            className
        )}
        {...props}
    >
        {children}
    </UiDialogContent>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <UiDialogHeader
        className={cn(
            "px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50 text-left",
            className
        )}
        {...props}
    />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <UiDialogFooter
        className={cn("px-6 pb-6 pt-2 sm:justify-end", className)}
        {...props}
    />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof UiDialogTitle>,
    React.ComponentPropsWithoutRef<typeof UiDialogTitle>
>(({ className, ...props }, ref) => (
    <UiDialogTitle
        ref={ref}
        className={cn(
            "text-xl font-bold tracking-tight text-zinc-900 dark:text-white",
            className
        )}
        {...props}
    />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof UiDialogDescription>,
    React.ComponentPropsWithoutRef<typeof UiDialogDescription>
>(({ className, ...props }, ref) => (
    <UiDialogDescription
        ref={ref}
        className={cn("text-zinc-500 dark:text-zinc-400", className)}
        {...props}
    />
));
DialogDescription.displayName = "DialogDescription";

export {
    Dialog,
    DialogPortalCommon as DialogPortal,
    DialogOverlay,
    DialogCloseCommon as DialogClose,
    DialogTriggerCommon as DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};

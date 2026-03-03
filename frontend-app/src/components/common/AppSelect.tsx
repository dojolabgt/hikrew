import * as React from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
    value: string
    label: string
    description?: string
}

export interface AppSelectProps {
    value?: string
    onValueChange?: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    disabled?: boolean
    className?: string
    triggerClassName?: string
}

export const AppSelect = React.forwardRef<HTMLButtonElement, AppSelectProps>(
    ({ value, onValueChange, options, placeholder = "Seleccionar...", disabled, className, triggerClassName }, ref) => {
        return (
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger
                    ref={ref}
                    className={cn(
                        "h-10 w-full border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shadow-sm focus:ring-1 focus-visible:ring-1 focus:ring-zinc-900 focus-visible:ring-zinc-900 dark:focus:ring-white dark:focus-visible:ring-white transition-colors",
                        triggerClassName,
                        className
                    )}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                            <span>{opt.label}</span>
                            {opt.description && (
                                <span className="ml-1.5 text-xs text-muted-foreground">
                                    {opt.description}
                                </span>
                            )}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        )
    }
)
AppSelect.displayName = "AppSelect"
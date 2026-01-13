'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    description?: string
}

export function Switch({ label, description, className, ...props }: SwitchProps) {
    return (
        <div className="flex items-start justify-between gap-4 py-2">
            <div className="flex flex-col gap-1">
                {label && <span className="text-sm font-semibold text-foreground leading-none">{label}</span>}
                {description && <span className="text-xs text-muted-foreground leading-normal">{description}</span>}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    {...props}
                />
                <div className={cn(
                    "w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary",
                    className
                )}></div>
            </label>
        </div>
    )
}

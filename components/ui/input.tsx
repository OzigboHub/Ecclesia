import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
}

export function Input({ className, label, error, id, ...props }: InputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium mb-1.5">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
                    'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
                    'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                    error && 'border-red-500 focus-visible:ring-red-500',
                    className
                )}
                {...props}
            />
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    )
}

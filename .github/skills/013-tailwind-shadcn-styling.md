# Skill: Tailwind CSS and shadcn/ui Styling

## Metadata

-   **ID**: `ecclesia.styling.tailwind_shadcn`
-   **Version**: 1.0.0
-   **Category**: Styling
-   **Priority**: High

## Purpose

Use Tailwind CSS v4 for all styling with shadcn/ui as the component foundation. Follow utility-first principles, use the `cn()` helper for class merging, and maintain consistent design patterns.

## Constraints

-   **Use Tailwind utilities only** — no custom CSS except in `globals.css`
-   **Use `cn()` for class merging** — combines clsx + tailwind-merge
-   **Mobile-first** — base styles for mobile, add breakpoints for larger screens
-   **Dark mode support** — use CSS variables for theming
-   **Accept `className` prop** — allow style composition
-   **Consistent spacing** — use Tailwind's spacing scale (4, 6, 8, etc.)

## The `cn()` Utility

```ts
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

```tsx
// Usage - merges classes, resolves conflicts
import { cn } from '@/lib/utils';

<div
	className={cn(
		'bg-primary text-white', // base styles
		isActive && 'bg-primary/90', // conditional
		className // prop override
	)}
/>;
```

## Component Variants Pattern

```tsx
// components/ui/button.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
	// Base styles applied to all variants
	'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
	{
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-primary/90',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90',
				outline:
					'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				icon: 'h-10 w-10',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<button
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}
```

## Card Component Pattern

```tsx
// components/ui/card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
	return (
		<div
			className={cn(
				'rounded-lg border bg-card text-card-foreground shadow-sm',
				className
			)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: CardProps) {
	return (
		<div
			className={cn('flex flex-col space-y-1.5 p-6', className)}
			{...props}
		/>
	);
}

export function CardTitle({
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3
			className={cn(
				'text-2xl font-semibold leading-none tracking-tight',
				className
			)}
			{...props}
		/>
	);
}

export function CardContent({ className, ...props }: CardProps) {
	return (
		<div
			className={cn('p-6 pt-0', className)}
			{...props}
		/>
	);
}

export function CardFooter({ className, ...props }: CardProps) {
	return (
		<div
			className={cn('flex items-center p-6 pt-0', className)}
			{...props}
		/>
	);
}
```

## Input Component Pattern

```tsx
// components/ui/input.tsx
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
					'ring-offset-background placeholder:text-muted-foreground',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
					'disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={ref}
				{...props}
			/>
		);
	}
);
Input.displayName = 'Input';
```

## CSS Variables for Theming

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
	:root {
		--background: 0 0% 100%;
		--foreground: 222.2 84% 4.9%;
		--card: 0 0% 100%;
		--card-foreground: 222.2 84% 4.9%;
		--popover: 0 0% 100%;
		--popover-foreground: 222.2 84% 4.9%;
		--primary: 222.2 47.4% 11.2%;
		--primary-foreground: 210 40% 98%;
		--secondary: 210 40% 96.1%;
		--secondary-foreground: 222.2 47.4% 11.2%;
		--muted: 210 40% 96.1%;
		--muted-foreground: 215.4 16.3% 46.9%;
		--accent: 210 40% 96.1%;
		--accent-foreground: 222.2 47.4% 11.2%;
		--destructive: 0 84.2% 60.2%;
		--destructive-foreground: 210 40% 98%;
		--border: 214.3 31.8% 91.4%;
		--input: 214.3 31.8% 91.4%;
		--ring: 222.2 84% 4.9%;
		--radius: 0.5rem;
	}

	.dark {
		--background: 222.2 84% 4.9%;
		--foreground: 210 40% 98%;
		--card: 222.2 84% 4.9%;
		--card-foreground: 210 40% 98%;
		--popover: 222.2 84% 4.9%;
		--popover-foreground: 210 40% 98%;
		--primary: 210 40% 98%;
		--primary-foreground: 222.2 47.4% 11.2%;
		--secondary: 217.2 32.6% 17.5%;
		--secondary-foreground: 210 40% 98%;
		--muted: 217.2 32.6% 17.5%;
		--muted-foreground: 215 20.2% 65.1%;
		--accent: 217.2 32.6% 17.5%;
		--accent-foreground: 210 40% 98%;
		--destructive: 0 62.8% 30.6%;
		--destructive-foreground: 210 40% 98%;
		--border: 217.2 32.6% 17.5%;
		--input: 217.2 32.6% 17.5%;
		--ring: 212.7 26.8% 83.9%;
	}
}
```

## Responsive Design Patterns

```tsx
// Mobile-first: base → md → lg → xl

// Grid layouts
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Cards */}
</div>

// Sidebar layout
<div className="flex flex-col md:flex-row">
  <aside className="w-full md:w-64 md:flex-shrink-0">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 p-4 md:p-6 lg:p-8">
    {/* Content */}
  </main>
</div>

// Text sizes
<h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">
  Page Title
</h1>

// Spacing
<div className="p-4 md:p-6 lg:p-8">
  <div className="space-y-4 md:space-y-6">
    {/* Content */}
  </div>
</div>

// Hide/show
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>
```

## Common Layout Patterns

```tsx
// Dashboard page layout
export default function DashboardPage() {
	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>
						Parishioners
					</h1>
					<p className='text-muted-foreground'>
						Manage your parish members
					</p>
				</div>
				<Button>
					<Plus className='mr-2 h-4 w-4' />
					Add Parishioner
				</Button>
			</div>

			{/* Stats cards */}
			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
				<Card>
					<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
						<CardTitle className='text-sm font-medium'>
							Total
						</CardTitle>
						<Users className='h-4 w-4 text-muted-foreground' />
					</CardHeader>
					<CardContent>
						<div className='text-2xl font-bold'>1,234</div>
					</CardContent>
				</Card>
				{/* More cards */}
			</div>

			{/* Data table */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Parishioners</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={data}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
```

## Table Styling

```tsx
// components/ui/data-table.tsx
<div className='rounded-md border'>
	<table className='w-full'>
		<thead>
			<tr className='border-b bg-muted/50'>
				<th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
					Name
				</th>
				<th className='h-12 px-4 text-left align-middle font-medium text-muted-foreground'>
					Status
				</th>
				<th className='h-12 px-4 text-right align-middle font-medium text-muted-foreground'>
					Actions
				</th>
			</tr>
		</thead>
		<tbody>
			{data.map((row) => (
				<tr
					key={row.id}
					className='border-b transition-colors hover:bg-muted/50'
				>
					<td className='p-4 align-middle'>{row.name}</td>
					<td className='p-4 align-middle'>
						<Badge
							variant={
								row.status === 'ACTIVE'
									? 'default'
									: 'secondary'
							}
						>
							{row.status}
						</Badge>
					</td>
					<td className='p-4 align-middle text-right'>
						<Button
							variant='ghost'
							size='icon'
						>
							<MoreHorizontal className='h-4 w-4' />
						</Button>
					</td>
				</tr>
			))}
		</tbody>
	</table>
</div>
```

## Badge Component

```tsx
// components/ui/badge.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
	'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	{
		variants: {
			variant: {
				default:
					'border-transparent bg-primary text-primary-foreground',
				secondary:
					'border-transparent bg-secondary text-secondary-foreground',
				destructive:
					'border-transparent bg-destructive text-destructive-foreground',
				outline: 'text-foreground',
				success:
					'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
				warning:
					'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	}
);

interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}
```

## Status Badge Helper

```tsx
// lib/ui-helpers.ts
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
	const variants: Record<
		string,
		'default' | 'secondary' | 'success' | 'warning' | 'destructive'
	> = {
		ACTIVE: 'success',
		INACTIVE: 'secondary',
		PENDING: 'warning',
		APPROVED: 'success',
		REJECTED: 'destructive',
		COMPLETED: 'success',
	};

	return (
		<Badge variant={variants[status] ?? 'default'}>
			{status.replace(/_/g, ' ')}
		</Badge>
	);
}
```

## Icon Usage with Lucide

```tsx
// Always import specific icons
import { Home, Users, DollarSign, Calendar, Settings, ChevronRight, Plus, Trash2 } from 'lucide-react'

// Size consistently
<Home className="h-4 w-4" />           // Small (buttons, inline)
<Users className="h-5 w-5" />          // Medium (nav items)
<DollarSign className="h-6 w-6" />     // Large (cards, headers)

// With buttons
<Button>
  <Plus className="mr-2 h-4 w-4" />
  Add Item
</Button>

// Icon-only button
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete</span>
</Button>
```

## Animation Classes

```tsx
// Use sparingly with Tailwind's built-in animations
<div className="animate-pulse">Loading...</div>
<div className="animate-spin">⟳</div>

// Transitions
<button className="transition-colors hover:bg-accent">
  Hover me
</button>

<div className="transition-transform hover:scale-105">
  Scale on hover
</div>

// Duration and easing
<div className="transition-all duration-200 ease-in-out">
  Smooth transition
</div>
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Custom CSS instead of Tailwind
<div style={{ marginTop: '20px', backgroundColor: 'blue' }}>

// ✅ CORRECT: Use Tailwind
<div className="mt-5 bg-blue-500">

// ❌ WRONG: String concatenation for classes
<div className={'text-lg ' + (isActive ? 'text-blue-500' : '')}>

// ✅ CORRECT: Use cn()
<div className={cn('text-lg', isActive && 'text-blue-500')}>

// ❌ WRONG: Not accepting className prop
function Card({ children }) {
  return <div className="rounded-lg border">{children}</div>
}

// ✅ CORRECT: Accept and merge className
function Card({ className, children }) {
  return (
    <div className={cn('rounded-lg border', className)}>
      {children}
    </div>
  )
}

// ❌ WRONG: Desktop-first responsive
<div className="text-4xl md:text-2xl sm:text-lg">

// ✅ CORRECT: Mobile-first responsive
<div className="text-lg md:text-2xl lg:text-4xl">
```

## Testing Checklist

-   [ ] Uses `cn()` for class merging
-   [ ] Mobile-first responsive design
-   [ ] Accepts `className` prop for composition
-   [ ] Uses CSS variables for theming
-   [ ] Dark mode support
-   [ ] Consistent spacing scale
-   [ ] Proper focus states for accessibility

## Related Skills

-   `ecclesia.styling.mobile_first_design`
-   `ecclesia.ui.component_patterns`
-   `ecclesia.accessibility.forms`

## References

-   [Tailwind CSS Docs](https://tailwindcss.com/docs)
-   [shadcn/ui Components](https://ui.shadcn.com/)
-   [components/ui/](../../components/ui/)
-   [app/globals.css](../../app/globals.css)

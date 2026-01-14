# Skill: Currency Formatting (Nigerian Naira)

## Metadata

-   **ID**: `ecclesia.formatting.currency`
-   **Version**: 1.0.0
-   **Category**: Localization
-   **Priority**: High

## Purpose

Format all monetary values consistently using Nigerian Naira (₦) as the default currency. Provide utility functions for formatting and parsing currency values.

## Constraints

-   **Default currency is Nigerian Naira (₦)**
-   **Use Intl.NumberFormat** for consistent formatting
-   **Store amounts as Decimal/Float** in database
-   **Display with 2 decimal places** minimum
-   **Handle large numbers** with proper grouping

## Currency Utility Functions

```ts
// lib/currency.ts

/**
 * Format a number as Nigerian Naira
 */
export function formatCurrency(
	amount: number | string | null | undefined,
	options: {
		showSymbol?: boolean;
		minimumFractionDigits?: number;
		maximumFractionDigits?: number;
	} = {}
): string {
	const {
		showSymbol = true,
		minimumFractionDigits = 2,
		maximumFractionDigits = 2,
	} = options;

	const value = typeof amount === 'string' ? parseFloat(amount) : amount;

	if (value == null || isNaN(value)) {
		return showSymbol ? '₦0.00' : '0.00';
	}

	const formatter = new Intl.NumberFormat('en-NG', {
		style: showSymbol ? 'currency' : 'decimal',
		currency: 'NGN',
		minimumFractionDigits,
		maximumFractionDigits,
	});

	return formatter.format(value);
}

/**
 * Format as compact (K, M, B) for large numbers
 */
export function formatCurrencyCompact(amount: number): string {
	if (amount >= 1_000_000_000) {
		return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
	}
	if (amount >= 1_000_000) {
		return `₦${(amount / 1_000_000).toFixed(1)}M`;
	}
	if (amount >= 1_000) {
		return `₦${(amount / 1_000).toFixed(1)}K`;
	}
	return formatCurrency(amount);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
	// Remove currency symbol and commas
	const cleaned = value.replace(/[₦,\s]/g, '');
	const parsed = parseFloat(cleaned);
	return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format as currency input value (no symbol, with commas)
 */
export function formatCurrencyInput(amount: number): string {
	return formatCurrency(amount, { showSymbol: false });
}
```

## Usage Examples

```tsx
import { formatCurrency, formatCurrencyCompact } from '@/lib/currency';

// Basic formatting
formatCurrency(1000); // "₦1,000.00"
formatCurrency(50000.5); // "₦50,000.50"
formatCurrency(1234567.89); // "₦1,234,567.89"

// Without symbol
formatCurrency(1000, { showSymbol: false }); // "1,000.00"

// Compact formatting
formatCurrencyCompact(1500000); // "₦1.5M"
formatCurrencyCompact(2500000000); // "₦2.5B"

// Handle null/undefined
formatCurrency(null); // "₦0.00"
formatCurrency(undefined); // "₦0.00"
```

## Display in Components

```tsx
// Simple display
<span>{formatCurrency(payment.amount)}</span>
// Output: ₦50,000.00

// Table cell
<td className="text-right font-mono">
  {formatCurrency(payment.amount)}
</td>

// Stats card with large number
<Card>
  <CardHeader>
    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {formatCurrencyCompact(totalRevenue)}
    </div>
    <p className="text-xs text-muted-foreground">
      {formatCurrency(totalRevenue)}
    </p>
  </CardContent>
</Card>
```

## Form Input with Currency

```tsx
// components/ui/currency-input.tsx
'use client';

import { forwardRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatCurrency, parseCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface CurrencyInputProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		'value' | 'onChange'
	> {
	value: number;
	onChange: (value: number) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
	({ className, value, onChange, ...props }, ref) => {
		const [displayValue, setDisplayValue] = useState(
			value ? formatCurrency(value, { showSymbol: false }) : ''
		);

		const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value.replace(/[^0-9.]/g, '');
			setDisplayValue(raw);
			onChange(parseFloat(raw) || 0);
		};

		const handleBlur = () => {
			if (value) {
				setDisplayValue(formatCurrency(value, { showSymbol: false }));
			}
		};

		return (
			<div className='relative'>
				<span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
					₦
				</span>
				<Input
					ref={ref}
					type='text'
					inputMode='decimal'
					value={displayValue}
					onChange={handleChange}
					onBlur={handleBlur}
					className={cn('pl-8 text-right font-mono', className)}
					{...props}
				/>
			</div>
		);
	}
);
CurrencyInput.displayName = 'CurrencyInput';
```

## Currency Input with React Hook Form

```tsx
// In form component
import { Controller } from 'react-hook-form';
import { CurrencyInput } from '@/components/ui/currency-input';

<Controller
	name='amount'
	control={form.control}
	render={({ field }) => (
		<div className='space-y-2'>
			<Label htmlFor='amount'>Amount (₦) *</Label>
			<CurrencyInput
				id='amount'
				value={field.value}
				onChange={field.onChange}
				disabled={isPending}
			/>
			{errors.amount && (
				<p className='text-sm text-destructive'>
					{errors.amount.message}
				</p>
			)}
		</div>
	)}
/>;
```

## Alternative: Simple Input with Symbol

```tsx
// Simpler approach without custom component
<div className='space-y-2'>
	<Label htmlFor='amount'>Amount (₦) *</Label>
	<div className='relative'>
		<span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
			₦
		</span>
		<Input
			id='amount'
			type='number'
			step='0.01'
			min='0'
			{...register('amount', { valueAsNumber: true })}
			className='pl-8'
			placeholder='0.00'
		/>
	</div>
	{errors.amount && (
		<p className='text-sm text-destructive'>{errors.amount.message}</p>
	)}
</div>
```

## Zod Schema for Currency

```ts
// lib/validators/payment.schema.ts
import { z } from 'zod';

export const paymentSchema = z.object({
	amount: z
		.number({ required_error: 'Amount is required' })
		.positive('Amount must be greater than zero')
		.multipleOf(0.01, 'Amount can have at most 2 decimal places'),

	// Alternative: accept string and transform
	amountFromString: z
		.string()
		.transform((val) => parseFloat(val.replace(/[₦,]/g, '')))
		.pipe(z.number().positive()),
});
```

## Currency in Tables

```tsx
// components/features/payments/payment-columns.tsx
import { ColumnDef } from '@tanstack/react-table';
import { formatCurrency } from '@/lib/currency';
import type { Payment } from '@prisma/client';

export const paymentColumns: ColumnDef<Payment>[] = [
	{
		accessorKey: 'amount',
		header: () => <div className='text-right'>Amount</div>,
		cell: ({ row }) => (
			<div className='text-right font-mono'>
				{formatCurrency(row.getValue('amount'))}
			</div>
		),
	},
	// ... other columns
];
```

## Summaries and Totals

```tsx
// Display total at bottom of table
<tfoot>
	<tr className='border-t bg-muted/50 font-medium'>
		<td
			colSpan={3}
			className='p-4 text-right'
		>
			Total:
		</td>
		<td className='p-4 text-right font-mono'>
			{formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
		</td>
	</tr>
</tfoot>
```

## Prisma Schema for Money

```prisma
// prisma/schema.prisma
model Payment {
  id        String   @id @default(cuid())
  amount    Decimal  @db.Decimal(12, 2) // Up to 999,999,999,999.99
  // ... other fields
}
```

## Server Action with Currency

```ts
// app/actions/payment.actions.ts
'use server';

import db from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

export async function createPayment(data: CreatePaymentInput) {
	// Amount comes as number from validated form
	const payment = await db.payment.create({
		data: {
			...data,
			amount: new Decimal(data.amount), // Convert to Prisma Decimal
			organizationId: session.user.organizationId,
		},
	});

	return {
		success: true,
		message: `Payment of ${formatCurrency(
			data.amount
		)} recorded successfully.`,
		data: payment,
	};
}
```

## Reading Decimal from Prisma

```tsx
// When reading from database, Decimal needs conversion
const payments = await db.payment.findMany();

// In component, convert Decimal to number for formatting
payments.map((payment) => ({
	...payment,
	amount: Number(payment.amount), // Decimal → number
}));

// Or use directly with formatCurrency (handles conversion)
formatCurrency(Number(payment.amount));
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: Manual string concatenation
<span>₦{amount}</span>                    // No formatting
<span>₦{amount.toFixed(2)}</span>         // No thousands separator

// ✅ CORRECT: Use formatCurrency
<span>{formatCurrency(amount)}</span>     // "₦1,234.56"

// ❌ WRONG: Inconsistent decimal places
formatCurrency(1000, { minimumFractionDigits: 0 }) // "₦1,000"
formatCurrency(1000.5, { minimumFractionDigits: 2 }) // "₦1,000.50"

// ✅ CORRECT: Always 2 decimal places
formatCurrency(1000)      // "₦1,000.00"
formatCurrency(1000.5)    // "₦1,000.50"

// ❌ WRONG: Storing as string in database
amount String // Loses precision, hard to query

// ✅ CORRECT: Use Decimal type
amount Decimal @db.Decimal(12, 2)

// ❌ WRONG: Different currency in different places
<span>NGN {amount}</span>  // One place
<span>N{amount}</span>      // Another place

// ✅ CORRECT: Consistent symbol
<span>{formatCurrency(amount)}</span>  // Always "₦"
```

## Testing Checklist

-   [ ] All monetary values use formatCurrency
-   [ ] Currency inputs have ₦ prefix
-   [ ] Tables right-align currency columns
-   [ ] Decimal type used in Prisma schema
-   [ ] Totals/summaries properly calculated
-   [ ] Consistent 2 decimal places

## Related Skills

-   `ecclesia.forms.react_hook_form`
-   `ecclesia.validation.zod_schemas`
-   `ecclesia.database.prisma_patterns`

## References

-   [lib/currency.ts](../../lib/currency.ts)
-   [MDN Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)

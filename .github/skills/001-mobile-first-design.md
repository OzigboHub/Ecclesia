# Skill: Mobile-First Responsive Design

## Metadata

-   **ID**: `ecclesia.ui.mobile_first_design`
-   **Version**: 1.0.0
-   **Category**: UI/UX
-   **Priority**: Critical

## Purpose

Ensure all UI components and layouts are built mobile-first, scaling up for larger screens. This approach optimizes performance on low-end devices (common among parish staff and parishioners) and ensures accessibility across all device types.

## When to Use

-   Creating any new page or component
-   Modifying existing layouts
-   Adding responsive typography or spacing
-   Building forms, tables, or data displays

## Constraints

-   **Default to mobile viewport first** — write base styles for mobile, then use `md:`, `lg:`, `xl:` breakpoints to scale up
-   **Typography scaling**: Use smaller base font sizes on mobile, scale up for tablet/desktop
-   **Touch targets**: Minimum 44x44px for all interactive elements on mobile
-   **Avoid horizontal scroll** on mobile viewports
-   **Test on low-end devices** — assume 3G network speeds and limited processing power

## Tailwind CSS Breakpoint Reference

```
sm: 640px   (small tablets)
md: 768px   (tablets)
lg: 1024px  (laptops)
xl: 1280px  (desktops)
2xl: 1536px (large screens)
```

## Procedure

### Step 1: Start with Mobile Base Styles

Write styles assuming a ~375px viewport width first.

```tsx
// ❌ WRONG: Desktop-first approach
<div className="text-lg md:text-base">  {/* shrinking for mobile */}

// ✅ CORRECT: Mobile-first approach
<div className="text-base md:text-lg lg:text-xl">  {/* growing for larger */}
```

### Step 2: Typography Scale Pattern

```tsx
// Headings - mobile first
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
<h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
<h3 className="text-lg md:text-xl lg:text-2xl font-medium">

// Body text
<p className="text-sm md:text-base">

// Small/caption text
<span className="text-xs md:text-sm text-muted-foreground">
```

### Step 3: Spacing Scale Pattern

```tsx
// Container padding
<div className="px-4 md:px-6 lg:px-8">

// Section spacing
<section className="py-6 md:py-8 lg:py-12">

// Card padding
<div className="p-4 md:p-6">

// Grid gaps
<div className="gap-4 md:gap-6 lg:gap-8">
```

### Step 4: Layout Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">

// Single column on mobile, multi-column on desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Sidebar layout - stack on mobile, side-by-side on desktop
<div className="flex flex-col lg:flex-row">
  <aside className="w-full lg:w-64 lg:flex-shrink-0">
  <main className="flex-1">
</div>
```

### Step 5: Component Visibility

```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">

// Show on mobile, hide on desktop
<div className="block md:hidden">

// Different components per breakpoint
<MobileNav className="md:hidden" />
<DesktopNav className="hidden md:flex" />
```

## Examples

### Dashboard Card (Mobile-First)

```tsx
export function DashboardCard({ title, value, icon: Icon }: Props) {
	return (
		<div className='rounded-lg border bg-card p-4 md:p-6'>
			<div className='flex items-center gap-3 md:gap-4'>
				<div className='rounded-full bg-primary/10 p-2 md:p-3'>
					<Icon className='h-4 w-4 md:h-5 md:w-5 text-primary' />
				</div>
				<div>
					<p className='text-xs md:text-sm text-muted-foreground'>
						{title}
					</p>
					<p className='text-lg md:text-2xl font-bold'>{value}</p>
				</div>
			</div>
		</div>
	);
}
```

### Data Table (Mobile-First)

```tsx
// Mobile: Card view, Desktop: Table view
<div className="block md:hidden">
  {/* Card-based list for mobile */}
  {items.map(item => <MobileItemCard key={item.id} {...item} />)}
</div>
<div className="hidden md:block">
  {/* Traditional table for desktop */}
  <DataTable columns={columns} data={items} />
</div>
```

## Anti-Patterns to Avoid

```tsx
// ❌ Fixed widths that break on mobile
<div className="w-[500px]">

// ✅ Responsive max-width
<div className="w-full max-w-lg">

// ❌ Desktop-first thinking
<div className="flex-row md:flex-col">  // Wrong direction

// ✅ Mobile-first thinking
<div className="flex-col md:flex-row">  // Correct direction

// ❌ Tiny touch targets
<button className="p-1 text-xs">

// ✅ Accessible touch targets
<button className="p-3 min-h-[44px] min-w-[44px]">
```

## Testing Checklist

-   [ ] Viewport tested at 375px (iPhone SE)
-   [ ] Viewport tested at 768px (iPad)
-   [ ] Viewport tested at 1024px+ (Desktop)
-   [ ] No horizontal scrolling on any viewport
-   [ ] All touch targets ≥ 44x44px on mobile
-   [ ] Text is readable without zooming
-   [ ] Forms are usable on mobile keyboard

## Related Skills

-   `ecclesia.ui.tailwind_styling`
-   `ecclesia.ui.shadcn_components`
-   `ecclesia.forms.accessible_forms`

## References

-   [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
-   [app/globals.css](../../app/globals.css)
-   [components/ui/](../../components/ui/)

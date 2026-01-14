# Skill: Accessibility Patterns

## Metadata

-   **ID**: `ecclesia.a11y.accessibility`
-   **Version**: 1.0.0
-   **Category**: Accessibility
-   **Priority**: High

## Purpose

Build accessible interfaces for all users. Ensure forms, navigation, and interactive elements are usable with assistive technologies and keyboard navigation.

## Constraints

-   **All forms must have proper labels** and associations
-   **Error messages linked** to inputs via aria-describedby
-   **Keyboard navigation** works for all interactive elements
-   **Focus states visible** and clear
-   **Screen reader friendly** text and announcements
-   **Sufficient color contrast** for text and interactive elements

## Form Accessibility

### Labels and Inputs

```tsx
// ✅ CORRECT: Proper label association
<div className="space-y-2">
  <Label htmlFor="firstName">First Name *</Label>
  <Input
    id="firstName"                              // Matches htmlFor
    {...register('firstName')}
    aria-required="true"                        // Indicates required
    aria-invalid={!!errors.firstName}           // Indicates error state
    aria-describedby={errors.firstName ? 'firstName-error' : undefined}
  />
  {errors.firstName && (
    <p id="firstName-error" className="text-sm text-destructive" role="alert">
      {errors.firstName.message}
    </p>
  )}
</div>

// ❌ WRONG: No label association
<div>
  <span>First Name</span>  {/* Not a label! */}
  <Input {...register('firstName')} />
</div>
```

### Required Fields

```tsx
// Visual indicator + aria attribute
<Label htmlFor="email">
  Email <span className="text-destructive">*</span>
</Label>
<Input
  id="email"
  type="email"
  aria-required="true"
  {...register('email')}
/>

// Or use aria-label for required indicator
<Label htmlFor="email">
  Email <span aria-label="required" className="text-destructive">*</span>
</Label>
```

### Error States

```tsx
<div className='space-y-2'>
	<Label htmlFor='phone'>Phone Number</Label>
	<Input
		id='phone'
		type='tel'
		{...register('phone')}
		aria-invalid={!!errors.phone}
		aria-describedby={
			[errors.phone ? 'phone-error' : null, 'phone-hint']
				.filter(Boolean)
				.join(' ') || undefined
		}
		className={cn(errors.phone && 'border-destructive')}
	/>
	<p
		id='phone-hint'
		className='text-sm text-muted-foreground'
	>
		Format: 08012345678
	</p>
	{errors.phone && (
		<p
			id='phone-error'
			className='text-sm text-destructive'
			role='alert'
			aria-live='polite'
		>
			{errors.phone.message}
		</p>
	)}
</div>
```

### Form Groups

```tsx
// Group related fields with fieldset and legend
<fieldset className='space-y-4'>
	<legend className='text-lg font-semibold'>Contact Information</legend>

	<div className='space-y-2'>
		<Label htmlFor='email'>Email</Label>
		<Input
			id='email'
			type='email'
			{...register('email')}
		/>
	</div>

	<div className='space-y-2'>
		<Label htmlFor='phone'>Phone</Label>
		<Input
			id='phone'
			type='tel'
			{...register('phone')}
		/>
	</div>
</fieldset>
```

## Button Accessibility

```tsx
// Text button - self-explanatory
<Button type="submit">Create Parishioner</Button>

// Icon button - needs accessible name
<Button variant="ghost" size="icon" aria-label="Delete parishioner">
  <Trash2 className="h-4 w-4" />
</Button>

// Or use sr-only text
<Button variant="ghost" size="icon">
  <Trash2 className="h-4 w-4" />
  <span className="sr-only">Delete parishioner</span>
</Button>

// Loading state
<Button disabled={isPending} aria-busy={isPending}>
  {isPending ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      Creating...
    </>
  ) : (
    'Create'
  )}
</Button>
```

## Link and Navigation

```tsx
// Descriptive link text
// ❌ WRONG: Vague link text
<a href="/docs">Click here</a>

// ✅ CORRECT: Descriptive text
<a href="/docs">View documentation</a>

// External links
<a
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
>
  Visit Example
  <span className="sr-only">(opens in new tab)</span>
  <ExternalLink className="ml-1 h-3 w-3 inline" aria-hidden="true" />
</a>

// Skip link for keyboard users
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-background focus:p-4 focus:rounded-md"
>
  Skip to main content
</a>
```

## Focus Management

```tsx
// Visible focus states (already in Tailwind/shadcn)
<Button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Click Me
</Button>

// Focus trap in modals (handled by Radix/shadcn)
<Dialog>
  <DialogContent>
    {/* Focus trapped within dialog */}
  </DialogContent>
</Dialog>

// Auto-focus first input on mount
<Input autoFocus />

// Or with useEffect for controlled focus
'use client'
import { useRef, useEffect } from 'react'

function SearchForm() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <Input ref={inputRef} placeholder="Search..." />
}
```

## Keyboard Navigation

```tsx
// Custom keyboard handler
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Interactive Element
</div>

// Better: use semantic button
<button onClick={handleClick}>
  Interactive Element
</button>
```

## Tables Accessibility

```tsx
<table aria-label='Parishioners list'>
	<caption className='sr-only'>
		List of parishioners with their status and contact information
	</caption>
	<thead>
		<tr>
			<th scope='col'>Name</th>
			<th scope='col'>Email</th>
			<th scope='col'>Status</th>
			<th scope='col'>
				<span className='sr-only'>Actions</span>
			</th>
		</tr>
	</thead>
	<tbody>
		{parishioners.map((p) => (
			<tr key={p.id}>
				<td>{p.name}</td>
				<td>{p.email}</td>
				<td>
					<Badge aria-label={`Status: ${p.status}`}>{p.status}</Badge>
				</td>
				<td>
					<Button
						variant='ghost'
						size='icon'
						aria-label={`Edit ${p.name}`}
					>
						<Pencil className='h-4 w-4' />
					</Button>
				</td>
			</tr>
		))}
	</tbody>
</table>
```

## Live Regions

```tsx
// Announce dynamic content changes
<div
	aria-live='polite'
	aria-atomic='true'
	className='sr-only'
>
	{announcement}
</div>;

// Usage
const [announcement, setAnnouncement] = useState('');

const handleSave = async () => {
	const result = await saveData();
	setAnnouncement(result.success ? 'Saved successfully' : 'Failed to save');
};

// For errors - more urgent
<div
	role='alert'
	aria-live='assertive'
>
	{error && <p className='text-destructive'>{error}</p>}
</div>;
```

## Images and Icons

```tsx
// Decorative icons (no meaning)
<Search className="h-4 w-4" aria-hidden="true" />

// Meaningful icons need labels
<CheckCircle className="h-4 w-4 text-green-500" aria-label="Completed" />

// Images with alt text
<img src="/logo.png" alt="Ecclesia DPM Logo" />

// Decorative images
<img src="/decoration.png" alt="" role="presentation" />

// Avatar with fallback
<Avatar>
  <AvatarImage src={user.image} alt={`${user.name}'s avatar`} />
  <AvatarFallback aria-label={user.name}>
    {user.name[0]}
  </AvatarFallback>
</Avatar>
```

## Color and Contrast

```tsx
// Don't rely on color alone
// ❌ WRONG: Only color indicates error
<Input className={hasError ? 'border-red-500' : ''} />

// ✅ CORRECT: Color + icon + text
<div className="space-y-2">
  <Input
    className={hasError ? 'border-destructive' : ''}
    aria-invalid={hasError}
  />
  {hasError && (
    <p className="flex items-center gap-1 text-sm text-destructive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      This field is required
    </p>
  )}
</div>

// Status indicators with text
<Badge className="bg-green-100 text-green-800">
  <CheckCircle className="mr-1 h-3 w-3" aria-hidden="true" />
  Active
</Badge>
```

## Modal Accessibility

```tsx
// Using shadcn/Radix Dialog (accessibility built-in)
<Dialog
	open={open}
	onOpenChange={setOpen}
>
	<DialogTrigger asChild>
		<Button>Open Dialog</Button>
	</DialogTrigger>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Edit Profile</DialogTitle>
			<DialogDescription>
				Make changes to your profile here. Click save when you're done.
			</DialogDescription>
		</DialogHeader>
		{/* Form content */}
		<DialogFooter>
			<Button onClick={() => setOpen(false)}>Save changes</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

// Features provided by Radix:
// - Focus trap
// - Escape key closes
// - aria-labelledby (DialogTitle)
// - aria-describedby (DialogDescription)
// - Focus return on close
```

## Screen Reader Only Text

```tsx
// Utility class for hiding visually but keeping for screen readers
// .sr-only is built into Tailwind

// Usage
<span className="sr-only">Additional context for screen readers</span>

// Toggle visibility
<span className="sr-only focus:not-sr-only">
  Skip to content
</span>
```

## Loading States

```tsx
// Announce loading state
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? (
    <div role="status">
      <Skeleton className="h-8 w-full" />
      <span className="sr-only">Loading content...</span>
    </div>
  ) : (
    <Content />
  )}
</div>

// Button loading
<Button disabled={isLoading} aria-busy={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

## Anti-Patterns to Avoid

```tsx
// ❌ WRONG: No label
<Input placeholder="Email" />

// ✅ CORRECT: Proper label
<Label htmlFor="email">Email</Label>
<Input id="email" placeholder="Enter your email" />

// ❌ WRONG: Placeholder as label
<Input placeholder="First Name *" />

// ✅ CORRECT: Label + placeholder
<Label htmlFor="firstName">First Name *</Label>
<Input id="firstName" placeholder="Enter first name" />

// ❌ WRONG: Non-descriptive link
<a href="/profile">Click here</a>

// ✅ CORRECT: Descriptive link
<a href="/profile">View your profile</a>

// ❌ WRONG: No alt text
<img src="/photo.jpg" />

// ✅ CORRECT: Descriptive alt
<img src="/photo.jpg" alt="Parish community gathering" />

// ❌ WRONG: Click handlers on divs
<div onClick={handleClick}>Click me</div>

// ✅ CORRECT: Use semantic button
<button onClick={handleClick}>Click me</button>
```

## Testing Checklist

-   [ ] All form inputs have associated labels
-   [ ] Error messages linked to inputs
-   [ ] Focus visible on all interactive elements
-   [ ] Keyboard navigation works
-   [ ] Screen reader announces changes
-   [ ] Color is not the only indicator
-   [ ] Images have appropriate alt text
-   [ ] Modals trap and return focus

## Related Skills

-   `ecclesia.forms.react_hook_form`
-   `ecclesia.styling.tailwind_shadcn`
-   `ecclesia.states.loading`

## References

-   [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
-   [Radix UI Accessibility](https://www.radix-ui.com/docs/primitives/overview/accessibility)
-   [MDN ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA)

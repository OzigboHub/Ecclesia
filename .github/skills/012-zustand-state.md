# Skill: Zustand State Management

## Metadata

-   **ID**: `ecclesia.state.zustand`
-   **Version**: 1.0.0
-   **Category**: State Management
-   **Priority**: Medium

## Purpose

Use Zustand for global client-side state that needs to persist across components. Avoid unnecessary client-side state — prefer server state when possible.

## When to Use

-   User preferences (theme, sidebar state)
-   UI state that spans multiple components
-   Client-side caching (with caution)
-   Shopping cart / selection state
-   Modal/drawer open states shared across components

## When NOT to Use

-   Data that should come from the server (use Server Components)
-   Form state (use React Hook Form)
-   URL state (use searchParams)
-   Session data (use NextAuth session)

## Constraints

-   **Prefer server state** — only use Zustand when truly needed
-   **Store files in `/store`** directory
-   **Use TypeScript** for type-safe stores
-   **Persist judiciously** — not everything needs localStorage
-   **Keep stores focused** — one store per domain

## Basic Store Pattern

```ts
// store/ui.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
	// State
	sidebarOpen: boolean;
	theme: 'light' | 'dark' | 'system';

	// Actions
	setSidebarOpen: (open: boolean) => void;
	toggleSidebar: () => void;
	setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
	persist(
		(set) => ({
			// Default state
			sidebarOpen: true,
			theme: 'system',

			// Actions
			setSidebarOpen: (open) => set({ sidebarOpen: open }),
			toggleSidebar: () =>
				set((state) => ({ sidebarOpen: !state.sidebarOpen })),
			setTheme: (theme) => set({ theme }),
		}),
		{
			name: 'ecclesia-ui', // localStorage key
			partialize: (state) => ({
				theme: state.theme,
				// Don't persist sidebarOpen — better UX to start fresh
			}),
		}
	)
);
```

## Store Without Persistence

```ts
// store/selection.store.ts
import { create } from 'zustand';

interface SelectionState {
	selectedIds: string[];
	selectId: (id: string) => void;
	deselectId: (id: string) => void;
	toggleId: (id: string) => void;
	selectAll: (ids: string[]) => void;
	clearSelection: () => void;
	isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
	selectedIds: [],

	selectId: (id) =>
		set((state) => ({
			selectedIds: state.selectedIds.includes(id)
				? state.selectedIds
				: [...state.selectedIds, id],
		})),

	deselectId: (id) =>
		set((state) => ({
			selectedIds: state.selectedIds.filter((i) => i !== id),
		})),

	toggleId: (id) =>
		set((state) => ({
			selectedIds: state.selectedIds.includes(id)
				? state.selectedIds.filter((i) => i !== id)
				: [...state.selectedIds, id],
		})),

	selectAll: (ids) => set({ selectedIds: ids }),

	clearSelection: () => set({ selectedIds: [] }),

	// Derived state using get()
	isSelected: (id) => get().selectedIds.includes(id),
}));
```

## Notifications Store

```ts
// store/notifications.store.ts
import { create } from 'zustand';

interface Notification {
	id: string;
	type: 'info' | 'success' | 'warning' | 'error';
	title: string;
	message?: string;
	read: boolean;
	createdAt: Date;
}

interface NotificationsState {
	notifications: Notification[];
	unreadCount: number;

	addNotification: (
		notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
	) => void;
	markAsRead: (id: string) => void;
	markAllAsRead: () => void;
	removeNotification: (id: string) => void;
	clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
	notifications: [],

	get unreadCount() {
		return get().notifications.filter((n) => !n.read).length;
	},

	addNotification: (notification) =>
		set((state) => ({
			notifications: [
				{
					...notification,
					id: crypto.randomUUID(),
					read: false,
					createdAt: new Date(),
				},
				...state.notifications,
			].slice(0, 50), // Keep max 50 notifications
		})),

	markAsRead: (id) =>
		set((state) => ({
			notifications: state.notifications.map((n) =>
				n.id === id ? { ...n, read: true } : n
			),
		})),

	markAllAsRead: () =>
		set((state) => ({
			notifications: state.notifications.map((n) => ({
				...n,
				read: true,
			})),
		})),

	removeNotification: (id) =>
		set((state) => ({
			notifications: state.notifications.filter((n) => n.id !== id),
		})),

	clearAll: () => set({ notifications: [] }),
}));
```

## Using Stores in Components

```tsx
// components/layout/sidebar.tsx
'use client';

import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';

export function Sidebar() {
	// Select only what you need
	const sidebarOpen = useUIStore((state) => state.sidebarOpen);
	const toggleSidebar = useUIStore((state) => state.toggleSidebar);

	return (
		<aside
			className={cn(
				'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transition-transform',
				sidebarOpen ? 'translate-x-0' : '-translate-x-full'
			)}
		>
			{/* Sidebar content */}
		</aside>
	);
}
```

## Selector Optimization

```tsx
// ❌ WRONG: Subscribes to entire store
const store = useUIStore(); // Re-renders on ANY change

// ✅ CORRECT: Select specific state
const sidebarOpen = useUIStore((state) => state.sidebarOpen);

// ✅ CORRECT: Multiple selections with shallow comparison
import { shallow } from 'zustand/shallow';

const { sidebarOpen, theme } = useUIStore(
	(state) => ({
		sidebarOpen: state.sidebarOpen,
		theme: state.theme,
	}),
	shallow
);

// ✅ CORRECT: Derive state in selector
const unreadCount = useNotificationsStore(
	(state) => state.notifications.filter((n) => !n.read).length
);
```

## Combining with Server State

```tsx
// For data that needs initial server fetch but client updates
// store/parishioner-filter.store.ts
import { create } from 'zustand';

interface ParishionerFilterState {
	search: string;
	status: string;
	gender: string;

	setSearch: (search: string) => void;
	setStatus: (status: string) => void;
	setGender: (gender: string) => void;
	clearFilters: () => void;
}

export const useParishionerFilterStore = create<ParishionerFilterState>(
	(set) => ({
		search: '',
		status: '',
		gender: '',

		setSearch: (search) => set({ search }),
		setStatus: (status) => set({ status }),
		setGender: (gender) => set({ gender }),
		clearFilters: () => set({ search: '', status: '', gender: '' }),
	})
);

// Usage in component that also syncs with URL
('use client');

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useParishionerFilterStore } from '@/store/parishioner-filter.store';

export function ParishionerFilters() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const { search, status, setSearch, setStatus } =
		useParishionerFilterStore();

	// Sync URL → Store on mount
	useEffect(() => {
		setSearch(searchParams.get('search') ?? '');
		setStatus(searchParams.get('status') ?? '');
	}, []);

	// Sync Store → URL on change
	useEffect(() => {
		const params = new URLSearchParams();
		if (search) params.set('search', search);
		if (status) params.set('status', status);
		router.push(`?${params.toString()}`);
	}, [search, status, router]);

	// ... render filters
}
```

## Hydration for SSR

```tsx
// Handle hydration mismatch for persisted stores
'use client';

import { useEffect, useState } from 'react';
import { useUIStore } from '@/store/ui.store';

export function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const theme = useUIStore((state) => state.theme);
	const setTheme = useUIStore((state) => state.setTheme);

	// Avoid hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className='w-9 h-9' />; // Placeholder
	}

	return (
		<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
			{theme === 'dark' ? '🌙' : '☀️'}
		</button>
	);
}
```

## Store Directory Structure

```
store/
├── ui.store.ts              # UI preferences (theme, sidebar)
├── selection.store.ts       # Multi-select states
├── notifications.store.ts   # In-app notifications
├── filter.store.ts          # Global filter states
└── index.ts                 # Re-exports
```

```ts
// store/index.ts
export { useUIStore } from './ui.store';
export { useSelectionStore } from './selection.store';
export { useNotificationsStore } from './notifications.store';
```

## Anti-Patterns to Avoid

```ts
// ❌ WRONG: Storing server data in Zustand
const useParishionersStore = create((set) => ({
	parishioners: [], // This should come from server!
	fetchParishioners: async () => {
		const data = await fetch('/api/parishioners');
		set({ parishioners: data }); // Stale data problems
	},
}));

// ❌ WRONG: Form state in Zustand
const useFormStore = create((set) => ({
	firstName: '',
	setFirstName: (name) => set({ firstName: name }),
	// Use React Hook Form instead!
}));

// ❌ WRONG: URL state in Zustand
const useFilterStore = create((set) => ({
	page: 1, // Should be in searchParams
}));

// ❌ WRONG: Subscribing to entire store
function Component() {
	const store = useUIStore(); // Re-renders on any change!
}

// ✅ CORRECT: Select only needed state
function Component() {
	const theme = useUIStore((s) => s.theme);
}
```

## Testing Checklist

-   [ ] Store has TypeScript interface
-   [ ] Actions use set() properly
-   [ ] Persisted state is intentional
-   [ ] Selectors are optimized
-   [ ] Hydration handled for SSR
-   [ ] Store is focused on one domain

## Related Skills

-   `ecclesia.components.server_vs_client`
-   `ecclesia.router.search_params`
-   `ecclesia.forms.react_hook_form`

## References

-   [Zustand Docs](https://zustand-demo.pmnd.rs/)
-   [store/](../../store/)

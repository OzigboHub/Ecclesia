# Ecclesia DPM - Agent Skills Index

This directory contains detailed skill documentation for AI coding agents working on the Ecclesia Digital Parish Manager codebase.

## Skills Overview

| ID  | Skill                                                             | Category      | Priority |
| --- | ----------------------------------------------------------------- | ------------- | -------- |
| 001 | [Mobile-First Design](001-mobile-first-design.md)                 | Styling       | High     |
| 002 | [Separation of Concerns](002-separation-of-concerns.md)           | Architecture  | High     |
| 003 | [Next.js App Router](003-nextjs-app-router.md)                    | Framework     | Critical |
| 004 | [Server vs Client Components](004-server-vs-client-components.md) | Components    | Critical |
| 005 | [Server Actions Pattern](005-server-actions-pattern.md)           | Data          | Critical |
| 006 | [Zod Validation](006-zod-validation.md)                           | Validation    | High     |
| 007 | [Prisma Database Patterns](007-prisma-database-patterns.md)       | Database      | High     |
| 008 | [Organization Scoping](008-organization-scoping.md)               | Multi-tenancy | Critical |
| 009 | [Feature Toggle System](009-feature-toggle-system.md)             | Features      | High     |
| 010 | [Role-Based Access Control](010-role-based-access-control.md)     | Security      | Critical |
| 011 | [React Hook Form](011-react-hook-form.md)                         | Forms         | High     |
| 012 | [Zustand State Management](012-zustand-state.md)                  | State         | Medium   |
| 013 | [Tailwind + shadcn/ui Styling](013-tailwind-shadcn-styling.md)    | Styling       | High     |
| 014 | [Sonner Toast Notifications](014-sonner-toast.md)                 | Feedback      | High     |
| 015 | [Loading States](015-loading-states.md)                           | UI States     | High     |
| 016 | [Error and Not-Found Handling](016-error-not-found.md)            | UI States     | High     |
| 017 | [Empty States Pattern](017-empty-states.md)                       | UI States     | High     |
| 018 | [Auth.js Authentication](018-authjs-authentication.md)            | Auth          | Critical |
| 019 | [Currency Formatting](019-currency-formatting.md)                 | Localization  | High     |
| 020 | [Accessibility Patterns](020-accessibility.md)                    | A11y          | High     |
| 021 | [Performance Optimization](021-performance-optimization.md)       | Performance   | High     |
| 022 | [Axios HTTP Client](022-axios-http-client.md)                     | HTTP          | Medium   |

## Quick Reference by Task

### Starting a New Feature

1. [Separation of Concerns](002-separation-of-concerns.md) - Directory structure
2. [Organization Scoping](008-organization-scoping.md) - Multi-tenancy
3. [Feature Toggle System](009-feature-toggle-system.md) - Check if enabled
4. [Role-Based Access Control](010-role-based-access-control.md) - Permissions

### Building a Page

1. [Next.js App Router](003-nextjs-app-router.md) - File conventions
2. [Server vs Client Components](004-server-vs-client-components.md) - Component types
3. [Loading States](015-loading-states.md) - loading.tsx
4. [Error and Not-Found Handling](016-error-not-found.md) - error.tsx, not-found.tsx
5. [Empty States Pattern](017-empty-states.md) - When no data

### Creating a Form

1. [React Hook Form](011-react-hook-form.md) - Form handling
2. [Zod Validation](006-zod-validation.md) - Schema validation
3. [Server Actions Pattern](005-server-actions-pattern.md) - Data submission
4. [Sonner Toast Notifications](014-sonner-toast.md) - User feedback
5. [Accessibility Patterns](020-accessibility.md) - Form accessibility

### Styling

1. [Mobile-First Design](001-mobile-first-design.md) - Responsive patterns
2. [Tailwind + shadcn/ui Styling](013-tailwind-shadcn-styling.md) - UI components

### Data Operations

1. [Prisma Database Patterns](007-prisma-database-patterns.md) - Database queries
2. [Server Actions Pattern](005-server-actions-pattern.md) - CRUD operations
3. [Organization Scoping](008-organization-scoping.md) - Query filtering

### Authentication & Authorization

1. [Auth.js Authentication](018-authjs-authentication.md) - Auth setup
2. [Role-Based Access Control](010-role-based-access-control.md) - Permissions

### Money/Currency

1. [Currency Formatting](019-currency-formatting.md) - Nigerian Naira (₦)

### Performance

1. [Performance Optimization](021-performance-optimization.md) - Best practices
2. [Server vs Client Components](004-server-vs-client-components.md) - Minimize JS

### External APIs

1. [Axios HTTP Client](022-axios-http-client.md) - Third-party APIs

## Core Principles

1. **Server-First**: Use Server Components by default, minimize client JavaScript
2. **Multi-Tenant**: Always scope queries by `organizationId`
3. **Feature Flags**: Check `OrganizationFeatureSettings` before feature access
4. **Role Guards**: Verify permissions in Server Actions
5. **User Feedback**: Never leave users guessing - loading, error, empty states
6. **Mobile-First**: Design for mobile, enhance for desktop
7. **Type Safety**: Use TypeScript, Zod, and Prisma types throughout

## Skill Document Format

Each skill follows this structure:

```markdown
# Skill: [Name]

## Metadata

-   ID, Version, Category, Priority

## Purpose

What this skill accomplishes

## When to Use

Scenarios where this applies

## Constraints

Rules and limitations

## Patterns

Code examples and templates

## Anti-Patterns

What to avoid

## Testing Checklist

Verification items

## Related Skills

Cross-references

## References

Documentation links
```

## Contributing

When adding new skills:

1. Follow the established format
2. Include practical code examples
3. Show both correct and incorrect patterns
4. Link to related skills
5. Reference actual project files when possible

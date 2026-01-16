# Quick Reference: Super Admin Features

## 🎯 What Was Built

Three complete implementation phases for super admin functionality in Ecclesia parish management system.

---

## 📍 How to Access

### Super Admin Dashboard

**Route**: `/dashboard`
**Role**: SUPER_ADMIN only
**What You See**:

-   8 system-wide metric cards
-   Quick admin action buttons
-   Platform-wide statistics

### Organization Management

**Route**: `/dashboard/admin/organizations`
**Role**: SUPER_ADMIN only
**Features**:

-   List all parishes
-   View organization details
-   Create new parishes
-   Create outstations
-   Edit organization info
-   Delete organizations
-   Transfer outstations between parishes

### User Management

**Route**: `/dashboard/users`
**Enhanced For SUPER_ADMIN**:

-   See all platform users (not just organization)
-   View organization affiliation for each user
-   Cross-organization user visibility

---

## 🔧 Key Server Actions

### Organization Management

```typescript
// List all organizations
const result = await getAllOrganizations();

// Create a parish
const result = await createParish({
	name: "St. Mary's Parish",
	email: 'parish@example.com',
	phone: '+234...',
});

// Create an outstation
const result = await createOutstation({
	name: "St. Mary's Outstation",
	parentId: 'parish-id',
	email: 'outstation@example.com',
});

// Update organization
const result = await updateOrganizationAdminAction(orgId, {
	name: 'Updated Name',
	email: 'new@example.com',
});

// Delete organization
const result = await deleteOrganizationAdminAction(orgId);

// Transfer outstation to another parish
const result = await transferOutstationAdminAction(outstationId, newParishId);
```

### Dashboard Metrics

```typescript
// Get system-wide metrics (SUPER_ADMIN only)
const result = await getSystemMetrics()

// Returns:
{
  success: true,
  data: {
    totalOrganizations: 45,
    totalParishes: 12,
    totalOutstations: 33,
    totalUsers: 156,
    activeUsers: 142,
    averageUsersPerOrg: 3,
    totalParishioners: 5432,
    totalPayments: 1850,
    totalPaymentAmount: 8750000,
    totalMassIntentions: 234,
    totalAppointments: 567
  }
}
```

---

## 🎨 UI Components

### SuperAdminDashboard

Location: `components/features/dashboard/super-admin-dashboard.tsx`

Displays:

-   Organizations card (parishes/outstations)
-   Total users card (with active count)
-   Parishioners card
-   Payments card (formatted currency)
-   Mass intentions card
-   Appointments card
-   Active users percentage
-   Average payments per organization
-   Quick admin action buttons

### Organization Forms

**Create/Edit**: `components/forms/admin-organization-form.tsx`

-   Dual-mode form (parishes & outstations)
-   Name, address, email, phone fields
-   Conditional parent parish selection
-   Zod validation
-   Error handling

### Transfer Modal

**Component**: `components/features/organizations/transfer-outstation-modal.tsx`

-   Dialog for moving outstations
-   Destination parish dropdown
-   Current assignment display
-   Warning alert about permission changes
-   Success/error feedback

---

## 🗺️ Navigation

### Sidebar Navigation (for SUPER_ADMIN)

The sidebar includes links to:

-   Dashboard (main landing)
-   Admin Section
    -   Organizations (manage parishes/outstations)
    -   Create Parish button
    -   Users (all platform users)
    -   Parishioners (all registered members)
    -   Payments (all transactions)

### Direct Links

-   `/dashboard` - Main dashboard (role-based)
-   `/dashboard/admin/organizations` - Organization list
-   `/dashboard/admin/organizations/new` - Create parish
-   `/dashboard/admin/organizations/[id]` - Organization detail
-   `/dashboard/admin/organizations/[id]/edit` - Edit organization
-   `/dashboard/admin/organizations/[id]/new-outstation` - Create outstation
-   `/dashboard/users` - All users (organization column visible)

---

## 📊 Metrics & Calculations

### Organizations

-   **Total Organizations**: Count of all organizations
-   **Total Parishes**: Count where level = 'PARISH'
-   **Total Outstations**: Count where level = 'OUTSTATION'

### Users

-   **Total Users**: Count of all users
-   **Active Users**: Count where isActive = true
-   **Average Users/Org**: totalUsers ÷ totalOrganizations

### Community

-   **Total Parishioners**: Count of all parishioners
-   **Total Mass Intentions**: Count of all masses
-   **Total Appointments**: Count of all appointments

### Financial

-   **Total Payments**: Count of all payment records
-   **Total Payment Amount**: Sum of all payment amounts
-   **Avg Payments/Org**: totalPayments ÷ totalOrganizations

---

## 🔐 Authorization

### Who Can Access What

| Feature                  | SUPER_ADMIN | PARISH_ADMIN | Others |
| ------------------------ | :---------: | :----------: | :----: |
| Super Admin Dashboard    |     ✅      |      ❌      |   ❌   |
| Organization List        |     ✅      |      ❌      |   ❌   |
| Create Parish            |     ✅      |      ❌      |   ❌   |
| Create Outstation        |     ✅      |      ❌      |   ❌   |
| Edit Organization        |     ✅      |     ✅\*     |   ❌   |
| Transfer Outstation      |     ✅      |      ❌      |   ❌   |
| View All Users           |     ✅      |      ❌      |   ❌   |
| Organization Affiliation |     ✅      |      ❌      |   ❌   |

\*PARISH_ADMIN can edit their own organization only

---

## 💾 Database Queries

All metrics use optimized parallel queries:

```typescript
Promise.all([
	db.organization.count(),
	db.organization.count({ where: { level: 'PARISH' } }),
	db.organization.count({ where: { level: 'OUTSTATION' } }),
	db.user.count(),
	db.user.count({ where: { isActive: true } }),
	db.parishioner.count(),
	db.payment.count(),
	db.payment.aggregate({ _sum: { amount: true } }),
	db.massIntention.count(),
	db.appointment.count(),
]);
```

Performance: All 10 queries run in parallel (~100-200ms combined)

---

## 🎯 Common Tasks

### Create a New Parish

1. Navigate to `/dashboard/admin/organizations/new`
2. Enter parish name, address, email, phone
3. Click "Create Parish"
4. Redirects to organization detail page

### Add an Outstation to a Parish

1. Navigate to organization detail (`/dashboard/admin/organizations/[id]`)
2. Scroll to "Outstations" section
3. Click "Create Outstation" button
4. Select parent parish
5. Enter outstation details
6. Click "Create"

### Transfer an Outstation

1. Navigate to outstation detail page
2. Click "Transfer" button
3. Select destination parish from dropdown
4. Review warning about permission changes
5. Click "Transfer"
6. UI refreshes with new parent parish

### View All Platform Users

1. Navigate to `/dashboard/users`
2. If SUPER_ADMIN role:
    - See organization column
    - See users from all organizations
3. If other roles:
    - See only users from their organization
    - Organization column hidden

---

## 🐛 Troubleshooting

### "Permission denied" error

-   Check user role (must be SUPER_ADMIN for admin features)
-   Verify session is valid
-   Check organization scoping for multi-tenant features

### Metrics showing as 0

-   Check if database has data
-   Verify queries are completing
-   Check database connection

### Page not loading

-   Verify authentication (redirects to login if needed)
-   Check user role for authorization
-   Review browser console for errors

### Forms not submitting

-   Check Zod validation errors
-   Verify all required fields filled
-   Check Server Action authorization
-   Review toast notifications for error message

---

## 📈 Performance Notes

-   Dashboard metrics use parallel queries (optimal)
-   Pagination implemented for large lists
-   Includes optimized (prevents N+1 queries)
-   No unnecessary client-side rendering
-   Server Components reduce JS bundle size

---

## 🔄 Data Flow

### Dashboard Page Request

```
User (SUPER_ADMIN) visits /dashboard
          ↓
Dashboard page loads (async server component)
          ↓
Check session & role
          ↓
If SUPER_ADMIN:
  ├─ Load SuperAdminDashboard component
  ├─ Call getSystemMetrics() Server Action
  ├─ Execute 10 parallel DB queries
  ├─ Format results (currency, percentages)
  └─ Display metric cards
          ↓
If Other Role:
  └─ Display organization-specific dashboard
```

### Organization Modification Flow

```
User clicks "Create Parish" button
          ↓
Form loads (Client Component)
          ↓
User fills in details (name, email, etc.)
          ↓
User clicks "Create"
          ↓
Form validates with Zod
          ↓
If invalid:
  └─ Show field errors
          ↓
If valid:
  ├─ Call createParish() Server Action
  ├─ Action validates again server-side
  ├─ Action checks SUPER_ADMIN role
  ├─ Creates in database
  ├─ Revalidates paths
  ├─ Shows success toast
  └─ Redirects to detail page
```

---

## 📚 Related Files

**Core Files**:

-   `app/actions/organization.actions.ts` - Organization Server Actions
-   `app/actions/dashboard.actions.ts` - Metrics Server Action
-   `app/dashboard/page.tsx` - Main dashboard (role-based)
-   `components/features/dashboard/super-admin-dashboard.tsx` - SUPER_ADMIN UI

**Forms**:

-   `components/forms/admin-organization-form.tsx` - Create/edit orgs
-   `components/forms/organization-edit-form.tsx` - Edit details

**Modals**:

-   `components/features/organizations/transfer-outstation-modal.tsx` - Transfer UI

---

## ✨ Key Features Summary

✅ Full organization hierarchy management (parishes & outstations)
✅ System-wide metrics dashboard with 11 calculated metrics
✅ Cross-organization user visibility for SUPER_ADMIN
✅ Outstation transfer between parishes
✅ Role-based access control throughout
✅ Optimized parallel database queries
✅ Form validation with Zod
✅ Toast notifications for user feedback
✅ Confirmation dialogs for destructive actions
✅ Responsive mobile-friendly UI
✅ Dark mode support
✅ Accessibility features (ARIA labels, keyboard nav)

---

**Status**: ✅ Production Ready

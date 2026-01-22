# User Roles & Permissions Matrix
## Lumina Digital Parish Manager (DPM)

**Version:** 1.0
**Last Updated:** January 2026

---

## 1. Role Hierarchy

```
SUPER_ADMIN (Platform Level)
    └── PARISH_ADMIN (Parish Level)
            ├── PARISH_SECRETARY (Parish Level)
            ├── PARISH_STAFF (Parish Level)
            ├── OUTSTATION_ADMIN (Outstation Level)
            ├── SOCIETY_PRESIDENT (Organization Level)
            ├── SOCIETY_SECRETARY (Organization Level)
            └── PARISHIONER (Member Level)
```

---

## 2. Detailed Role Specifications

### 2.1 SUPER_ADMIN (Platform Administrator)

**Who**: Lumina Corp administrators, system owners

**Scope**: Entire platform - all parishes, outstations, and users

**Key Responsibilities**:
- Platform-wide oversight and administration
- Parish onboarding and configuration
- System-wide feature management
- User account management across all organizations
- Financial oversight and reporting
- Technical support and troubleshooting

**Permissions**:

#### Organization Management
- ✅ Create new parishes
- ✅ Create new outstations under any parish
- ✅ Edit any organization details
- ✅ Delete/archive organizations (soft delete)
- ✅ View all organizations
- ✅ Transfer outstations between parishes
- ✅ Set organization hierarchy

#### User Management
- ✅ Create users with any role in any organization
- ✅ Edit any user's details and role
- ✅ Block/unblock any user account
- ✅ Reset passwords for any user
- ✅ Delete users (soft delete)
- ✅ View all user activity logs
- ✅ Assign/reassign organization admins

#### Feature Management
- ✅ Enable/disable features for any organization
- ✅ Set feature limits (e.g., max parishioners)
- ✅ Configure feature pricing
- ✅ Override feature restrictions
- ✅ View feature usage analytics across all parishes

#### Parishioner Management
- ✅ View all parishioners across all parishes
- ✅ Edit parishioner records in any parish
- ✅ Set parishioner limits per organization
- ✅ Merge duplicate parishioner records
- ✅ Export parishioner data

#### Financial Management
- ✅ View all financial transactions across all parishes
- ✅ Generate platform-wide financial reports
- ✅ Configure payment gateways
- ✅ Manage subscription billing
- ✅ Issue refunds for any organization
- ✅ View revenue analytics

#### Data & Security
- ✅ Access all audit logs
- ✅ Perform data backups and restores
- ✅ Manage data retention policies
- ✅ Configure security settings
- ✅ View system health metrics
- ✅ Manage API keys and integrations

#### Limitations
- ❌ Cannot delete permanent records (financial transactions, sacraments) without special authorization
- ❌ Should not interfere with day-to-day parish operations unless requested

---

### 2.2 PARISH_ADMIN (Parish Priest)

**Who**: Parish Priest, or designated parish administrator

**Scope**: Their assigned parish and all its outstations

**Key Responsibilities**:
- Overall parish administration
- Strategic planning and decision-making
- Staff and volunteer management
- Financial oversight for the parish
- Sacramental administration

**Permissions**:

#### Organization Management
- ✅ View parish and outstation details
- ✅ Edit parish information (address, contact, etc.)
- ✅ Create outstations under their parish
- ✅ Edit outstation details
- ✅ Configure parish feature settings
- ❌ Cannot delete parish or outstations
- ❌ Cannot transfer outstations to other parishes

#### User Management
- ✅ Create users for parish and outstations (all roles except SUPER_ADMIN and other PARISH_ADMIN)
- ✅ Edit user details within their parish
- ✅ Block/unblock users within their parish
- ✅ Assign/change user roles within their parish
- ✅ Reset passwords for parish users
- ✅ Assign Outstation Admins
- ✅ Assign Society Presidents and Secretaries
- ❌ Cannot create or manage SUPER_ADMIN users
- ❌ Cannot manage users from other parishes

#### Feature Management
- ✅ Enable/disable features for their parish (within subscription limits)
- ✅ Configure feature settings for their parish
- ✅ View feature usage reports
- ❌ Cannot override platform feature restrictions
- ❌ Cannot modify subscription/billing settings

#### Parishioner Management
- ✅ Create/edit/delete parishioners in their parish
- ✅ View all parishioners in parish and outstations
- ✅ Import parishioners via CSV
- ✅ Export parishioner data
- ✅ Assign parishioners to outstations
- ✅ Manage parishioner sacramental records
- ✅ Set parishioner limits for outstations (within parish limits)

#### Societies
- ✅ Create societies
- ✅ Edit organization details
- ✅ Assign organization presidents and secretaries
- ✅ View all organization members
- ✅ Remove organizations (if no active members)

#### Financial Management
- ✅ View all payments and donations for parish and outstations
- ✅ Record payments and donations
- ✅ Create donation campaigns
- ✅ Create custom donation types
- ✅ Generate financial reports for parish and outstations
- ✅ Configure payment methods
- ✅ Issue receipts
- ❌ Cannot delete payment records
- ❌ Cannot modify completed transactions

#### Mass Intentions & Appointments
- ✅ View all mass intentions
- ✅ Approve/reject mass intention requests
- ✅ Assign mass intentions to specific masses
- ✅ View all appointments
- ✅ Assign appointments to staff
- ✅ Manage appointment availability

#### Events & Communication
- ✅ Create and manage events
- ✅ Send announcements to parish and outstations
- ✅ Manage live streams
- ✅ Configure notification settings

#### Reports & Analytics
- ✅ Access all parish reports
- ✅ View dashboard analytics
- ✅ Export data for their parish

---

### 2.3 PARISH_SECRETARY

**Who**: Parish administrative assistant, office manager

**Scope**: Assigned parish (may include outstations depending on configuration)

**Key Responsibilities**:
- Day-to-day administrative operations
- Member record maintenance
- Financial record keeping
- Event coordination
- Communication management

**Permissions**:

#### Organization Management
- ✅ View parish and outstation details
- ❌ Cannot edit organization settings
- ❌ Cannot create/delete organizations

#### User Management
- ✅ View all parish staff and users
- ❌ Cannot create/edit/delete users
- ❌ Cannot change user roles or permissions

#### Parishioner Management
- ✅ Create new parishioners
- ✅ Edit parishioner details
- ✅ View all parishioners in parish
- ✅ Import parishioners via CSV
- ✅ Export parishioner lists
- ✅ Manage sacramental records
- ❌ Cannot delete parishioners (can deactivate)

#### Societies
- ✅ View all organizations and members
- ✅ Add members to organizations (with president approval)
- ❌ Cannot create organizations
- ❌ Cannot assign presidents/secretaries

#### Financial Management
- ✅ Record all types of payments
- ✅ Generate receipts
- ✅ View payment history
- ✅ Create donation campaigns (with approval)
- ✅ Generate financial reports
- ✅ Process offering counts
- ❌ Cannot delete/modify completed transactions
- ❌ Cannot issue refunds
- ❌ Cannot configure payment settings

#### Mass Intentions & Appointments
- ✅ Book mass intentions
- ✅ View all mass intentions
- ✅ Update mass intention details
- ✅ Schedule appointments
- ✅ View all appointments
- ✅ Send appointment reminders
- ❌ Cannot assign intentions to masses (parish admin only)

#### Events & Communication
- ✅ Create events (with approval workflow)
- ✅ Edit events
- ✅ Manage event RSVPs
- ✅ Send announcements (with approval)
- ✅ Update live stream information
- ❌ Cannot delete major events

#### Reports
- ✅ Generate member reports
- ✅ Generate financial reports
- ✅ Generate sacramental reports
- ✅ Export data

---

### 2.4 PARISH_STAFF

**Who**: General parish staff, volunteers, coordinators

**Scope**: Limited access to specific functional areas

**Key Responsibilities**:
- Specific operational tasks
- Data entry
- Basic member support
- Event assistance

**Permissions**:

#### Organization Management
- ✅ View parish information
- ❌ Cannot edit any settings

#### User Management
- ✅ View own profile
- ✅ Update own profile
- ❌ Cannot view/manage other users

#### Parishioner Management
- ✅ View parishioner list
- ✅ Search parishioners
- ✅ Create new parishioners
- ✅ Edit basic parishioner details (name, contact)
- ❌ Cannot delete parishioners
- ❌ Cannot edit sensitive information (financial history)

#### Societies
- ✅ View organizations
- ✅ View membership lists
- ❌ Cannot edit organizations or memberships

#### Financial Management
- ✅ Record cash/check donations
- ✅ Record offerings
- ✅ Generate receipts
- ✅ View payment history (limited)
- ❌ Cannot view full financial reports
- ❌ Cannot create campaigns
- ❌ Cannot modify transactions
- ❌ Cannot process refunds

#### Mass Intentions & Appointments
- ✅ Book mass intentions
- ✅ View mass intentions
- ✅ Schedule appointments
- ✅ View appointments
- ❌ Cannot cancel/modify others' requests

#### Events & Communication
- ✅ View events
- ✅ Manage event check-ins
- ✅ View announcements
- ❌ Cannot create events
- ❌ Cannot send announcements

#### Reports
- ✅ View basic reports
- ❌ Cannot export sensitive data

---

### 2.5 OUTSTATION_ADMIN

**Who**: Outstation coordinator, catechist, or designated leader

**Scope**: Their assigned outstation only

**Key Responsibilities**:
- Outstation-level administration
- Local member management
- Collection coordination
- Event organization at outstation level

**Permissions**:

#### Organization Management
- ✅ View outstation details
- ✅ Edit outstation contact information
- ❌ Cannot create/delete outstations
- ❌ Cannot change parent parish

#### User Management
- ✅ View outstation staff
- ✅ Request new user accounts (requires parish admin approval)
- ❌ Cannot create/edit/delete users directly

#### Parishioner Management
- ✅ Create parishioners for their outstation
- ✅ Edit parishioners in their outstation
- ✅ View parishioners in their outstation only
- ✅ Manage sacramental records for outstation parishioners
- ❌ Cannot view/edit parishioners from other outstations
- ❌ Cannot delete parishioners

#### Societies
- ✅ View outstation-level organizations
- ✅ Manage outstation organization memberships
- ❌ Cannot create organizations (parish level)

#### Financial Management
- ✅ Record collections/donations for their outstation
- ✅ Generate receipts
- ✅ View outstation financial reports
- ✅ Track outstation-specific campaigns
- ❌ Cannot view parish-wide finances
- ❌ Cannot create campaigns
- ❌ Cannot modify transactions

#### Mass Intentions & Appointments
- ✅ Book mass intentions for outstation
- ✅ View outstation appointments
- ✅ Schedule outstation events
- ❌ Cannot manage parish-level intentions

#### Events & Communication
- ✅ Create outstation events
- ✅ View parish announcements
- ✅ Send outstation-specific announcements
- ❌ Cannot send parish-wide announcements

#### Reports
- ✅ Generate outstation-specific reports
- ✅ Export outstation data
- ❌ Cannot view parish-wide reports

---

### 2.6 SOCIETY_PRESIDENT

**Who**: President of societies (CWO, CMO, CYON, etc.)

**Scope**: Their specific organization within the parish

**Key Responsibilities**:
- Organization leadership
- Member recruitment and retention
- Activity planning
- Financial management for organization
- Reporting to parish admin

**Permissions**:

#### Organization Management
- ✅ View their organization details
- ✅ Edit organization description
- ✅ Update meeting schedules
- ❌ Cannot delete organization
- ❌ Cannot change organization name

#### User Management
- ✅ View Society Secretary
- ✅ Request secretary assignment (parish admin approves)
- ❌ Cannot manage other users

#### Parishioner Management
- ✅ View all parish parishioners (for recruitment)
- ✅ Search parishioners
- ❌ Cannot edit parishioner personal details

#### Organization Membership
- ✅ Add members to their organization
- ✅ Remove members from their organization
- ✅ View membership list
- ✅ Export membership list
- ✅ Track member attendance (if feature enabled)
- ✅ Communicate with members

#### Financial Management
- ✅ Record organization dues/contributions
- ✅ View organization financial reports
- ✅ Create organization-specific campaigns
- ✅ Track organization expenses
- ❌ Cannot access parish finances
- ❌ Cannot modify transaction records

#### Events & Communication
- ✅ Create organization events
- ✅ Send announcements to organization members
- ✅ Manage event RSVPs
- ✅ Schedule organization meetings

#### Reports
- ✅ Generate membership reports
- ✅ Generate activity reports
- ✅ Generate financial reports (organization level)
- ✅ Export organization data

---

### 2.7 SOCIETY_SECRETARY

**Who**: Secretary of societies

**Scope**: Their specific organization within the parish

**Key Responsibilities**:
- Administrative support to president
- Record keeping
- Communication coordination
- Meeting minutes

**Permissions**:

#### Organization Management
- ✅ View organization details
- ✅ Update meeting minutes
- ❌ Cannot edit organization settings

#### Organization Membership
- ✅ Add members (with president approval)
- ✅ Remove members (with president approval)
- ✅ View membership list
- ✅ Update member contact information
- ✅ Track attendance

#### Financial Management
- ✅ Record organization contributions
- ✅ View organization financial reports
- ❌ Cannot create campaigns
- ❌ Cannot modify transactions

#### Events & Communication
- ✅ Create organization events
- ✅ Send announcements to members
- ✅ Manage RSVPs
- ✅ Document meeting minutes

#### Reports
- ✅ Generate membership reports
- ✅ Generate activity reports
- ✅ Export membership lists

---

### 2.8 PARISHIONER

**Who**: Regular parish members

**Scope**: Their own personal account and data

**Key Responsibilities**:
- Maintain personal information
- Self-service for common tasks
- Online giving (if enabled)
- Engagement with parish activities

**Permissions**:

#### Personal Account
- ✅ View own profile
- ✅ Update contact information
- ✅ Update password
- ✅ View own contribution history
- ✅ View own sacramental records
- ❌ Cannot edit sacramental records

#### Societies
- ✅ View available organizations
- ✅ Request to join organizations
- ✅ View own organization memberships
- ❌ Cannot add/remove other members

#### Financial Management
- ✅ View own donation history
- ✅ Download own receipts
- ✅ Make online donations (if enabled)
- ✅ Set up recurring donations (if enabled)
- ❌ Cannot view others' financial data

#### Mass Intentions
- ✅ Book mass intentions
- ✅ View own mass intentions
- ✅ Pay mass intention stipends online
- ❌ Cannot view others' intentions

#### Appointments
- ✅ Book appointments (confession, counseling, meetings)
- ✅ View own appointments
- ✅ Reschedule own appointments
- ✅ Cancel own appointments
- ❌ Cannot view/manage others' appointments

#### Events & Communication
- ✅ View public events
- ✅ RSVP to events
- ✅ View parish announcements
- ✅ View live streams
- ❌ Cannot create events
- ❌ Cannot send announcements

#### Reports
- ✅ View own contribution statements
- ✅ Download own tax receipts
- ❌ Cannot view any other reports

---

## 3. Permission Matrix Table

| Feature/Action | Super Admin | Parish Admin | Parish Secretary | Parish Staff | Outstation Admin | Org President | Org Secretary | Parishioner |
|---|---|---|---|---|---|---|---|---|
| **Organizations** |
| Create Parish | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Parish | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Outstation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Outstation | ✅ | ✅ | ❌ | ❌ | ✅ (own) | ❌ | ❌ | ❌ |
| Set Parishioner Limits | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Users** |
| Create Super Admin | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Parish Admin | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Other Users | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Block/Unblock Users | ✅ | ✅ (parish) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Org Leaders | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Features** |
| Enable/Disable Features | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Set Feature Limits | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Parishioners** |
| Create Parishioner | ✅ | ✅ | ❌ | ❌ | ✅ (outstation) | ❌ | ❌ | ✅ (self) |
| Edit Parishioner | ✅ | ✅ | ❌ | ❌ | ✅ (own) | ❌ | ❌ | ✅ (self) |
| Delete Parishioner | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View All Parishioners | ✅ | ✅ (parish) | ✅ (parish) | ❌ | ✅ (outstation) | ❌ | ❌ | ❌ |
| **Financials** |
| Record Payment | ✅ | ✅ | ✅ | ❌ | ✅ (outstation) | ✅ (org) | ✅ (org) | ✅ (self) |
| Create Campaign | ✅ | ✅ | ✅ (approval) | ❌ | ❌ | ✅ (org) | ❌ | ❌ |
| View Financial Reports | ✅ (all) | ✅ (parish) | ✅ (parish) | ❌ | ✅ (outstation) | ✅ (org) | ✅ (org) | ✅ (self) |
| Delete Transaction | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Issue Refund | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mass Intentions** |
| Book Intention | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assign to Mass | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Appointments** |
| Book Appointment | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Assign to Staff | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Organizations** |
| Create Org | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Leaders | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ✅ (assist) | ❌ | ✅ (outstation) | ✅ (own) | ✅ (own) | ❌ |
| **Events** |
| Create Event | ✅ | ✅ | ✅ | ❌ | ✅ (outstation) | ✅ (org) | ✅ (org) | ❌ |
| Manage RSVPs | ✅ | ✅ | ✅ | ✅ | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (self) |
| **Communication** |
| Parish Announcements | ✅ | ✅ | ✅ (approval) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Org Announcements | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Manage Live Streams | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Special Permissions & Limits

### 4.1 SUPER_ADMIN Exclusive Actions
- Set parishioner limits per organization
- Configure platform-wide settings
- Access system logs and diagnostics
- Manage billing and subscriptions
- Override any restriction

### 4.2 PARISH_ADMIN Exclusive Actions
- Approve/reject major requests from staff
- Assign organization leaders
- Configure parish feature settings
- Issue refunds
- Access audit logs for their parish

### 4.3 Data Visibility Rules

| Role | Data Visibility Scope |
|------|----------------------|
| SUPER_ADMIN | All parishes, all data |
| PARISH_ADMIN | Own parish + all outstations |
| PARISH_SECRETARY | Own parish + all outstations |
| PARISH_STAFF | Own parish (limited fields) |
| OUTSTATION_ADMIN | Own outstation only |
| SOCIETY_PRESIDENT | Own organization + parish member directory |
| SOCIETY_SECRETARY | Own organization + parish member directory |
| PARISHIONER | Own data only |

---

## 5. Implementation Examples

### 5.1 Middleware Authorization Check

```typescript
// lib/middleware/authorize.ts
export function authorize(allowedRoles: UserRole[]) {
  return async (req: NextRequest) => {
    const session = await getServerSession();

    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    return null; // Authorized
  };
}

// Usage in API route
export async function POST(request: NextRequest) {
  const authCheck = await authorize([
    'SUPER_ADMIN',
    'PARISH_ADMIN',
    'PARISH_SECRETARY'
  ])(request);

  if (authCheck) return authCheck;

  // Proceed with logic
}
```

### 5.2 UI Component Authorization

```typescript
// components/ProtectedAction.tsx
import { useSession } from 'next-auth/react';

interface Props {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function ProtectedAction({ allowedRoles, children }: Props) {
  const { data: session } = useSession();

  if (!session || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}

// Usage
<ProtectedAction allowedRoles={['SUPER_ADMIN', 'PARISH_ADMIN']}>
  <button>Delete Organization</button>
</ProtectedAction>
```

---

## 6. Audit Logging Requirements

All role-based actions should be logged:

```typescript
await prisma.auditLog.create({
  data: {
    action: 'PERMISSION_CHANGE',
    entityType: 'User',
    entityId: userId,
    performedBy: session.user.id,
    details: {
      oldRole: 'PARISH_STAFF',
      newRole: 'PARISH_SECRETARY',
      organizationId: orgId
    },
    ipAddress: request.ip
  }
});
```

---

## 7. Best Practices

1. **Principle of Least Privilege**: Users should have minimum permissions needed
2. **Role Assignment**: Carefully consider before assigning elevated roles
3. **Regular Audits**: Review user roles and permissions quarterly
4. **Training**: Ensure users understand their role capabilities
5. **Documentation**: Keep this matrix updated with any permission changes
6. **Testing**: Test all permission boundaries before deployment

---

This comprehensive role specification ensures proper data security, operational efficiency, and clear accountability throughout the Lumina DPM system.
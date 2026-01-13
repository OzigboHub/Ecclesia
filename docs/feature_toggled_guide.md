# Feature Toggle System
## Lumina Digital Parish Manager (DPM)

**Version:** 1.0  
**Last Updated:** January 2026

---

## 1. Overview

The Lumina DPM Feature Toggle System enables parishes to customize their platform experience by enabling or disabling specific features based on their unique requirements, budget constraints, and operational needs. This system provides:

- **Cost Optimization**: Pay only for features you use
- **Simplified Onboarding**: Start with basic features and enable advanced ones gradually
- **Customization**: Tailor the platform to each parish's specific ministry needs
- **Scalability**: Easily enable new features as the parish grows

---

## 2. Architecture

### 2.1 Database Schema

```prisma
model OrganizationFeatureSettings {
  id                        String       @id @default(uuid())
  organizationId            String       @unique
  organization              Organization @relation(fields: [organizationId], references: [id])
  
  // Core Features
  enableParishionerManagement Boolean    @default(true)
  enableSacramentalRecords    Boolean    @default(true)
  enableFinancialManagement   Boolean    @default(true)
  
  // Payment Features
  enableOfferings             Boolean    @default(true)
  enableTithes                Boolean    @default(true)
  enableDonationCampaigns     Boolean    @default(true)
  enableCustomDonationTypes   Boolean    @default(true)
  enableMonthlyTracking       Boolean    @default(true)
  
  // Spiritual Features
  enableMassIntentions        Boolean    @default(true)
  enableAppointments          Boolean    @default(true)
  enableConfessionBooking     Boolean    @default(true)
  
  // Communication Features
  enableLiveStreaming         Boolean    @default(false)
  enableAnnouncements         Boolean    @default(true)
  enableSMSNotifications      Boolean    @default(false)
  enableEmailNotifications    Boolean    @default(true)
  
  // Organization Features
  enablePiousOrganizations    Boolean    @default(true)
  enableEventManagement       Boolean    @default(true)
  
  // Advanced Features
  enableOnlinePayments        Boolean    @default(false)
  enableRecurringDonations    Boolean    @default(false)
  enableMobileApp             Boolean    @default(false)
  enablePublicWebsite         Boolean    @default(true)
  
  createdAt                   DateTime   @default(now())
  updatedAt                   DateTime   @updatedAt

  @@index([organizationId])
}
```

### 2.2 System Flow

```
1. User Action → 2. Feature Check → 3. Access Grant/Deny
                        ↓
                  Audit Log Entry
```

---

## 3. Feature Catalog

### 3.1 Core Features (Default: Enabled)

| Feature | Key | Default | Description | Dependencies |
|---------|-----|---------|-------------|--------------|
| Parishioner Management | `enableParishionerManagement` | `true` | Member records, profiles, demographics | None |
| Sacramental Records | `enableSacramentalRecords` | `true` | Baptism, Confirmation, Marriage tracking | Parishioner Management |
| Financial Management | `enableFinancialManagement` | `true` | Base financial tracking system | None |

### 3.2 Payment Features (Default: Enabled)

| Feature | Key | Default | Description | Dependencies |
|---------|-----|---------|-------------|--------------|
| Offerings | `enableOfferings` | `true` | Sunday and special offerings | Financial Management |
| Tithes | `enableTithes` | `true` | Tithe tracking and reporting | Financial Management |
| Donation Campaigns | `enableDonationCampaigns` | `true` | Building funds, special projects | Financial Management |
| Custom Donation Types | `enableCustomDonationTypes` | `true` | Parish-defined donation categories | Financial Management |
| Monthly Tracking | `enableMonthlyTracking` | `true` | Month-by-month offering tracking | Financial Management |

### 3.3 Spiritual Features (Default: Enabled)

| Feature | Key | Default | Description | Dependencies |
|---------|-----|---------|-------------|--------------|
| Mass Intentions | `enableMassIntentions` | `true` | Book and track mass intentions | None |
| Appointments | `enableAppointments` | `true` | General appointment booking | None |
| Confession Booking | `enableConfessionBooking` | `true` | Specific confession scheduling | Appointments |

### 3.4 Communication Features (Mixed Defaults)

| Feature | Key | Default | Description | Dependencies |
|---------|-----|---------|-------------|--------------|
| Live Streaming | `enableLiveStreaming` | `false` | Stream masses and events | None |
| Announcements | `enableAnnouncements` | `true` | Parish-wide announcements | None |
| SMS Notifications | `enableSMSNotifications` | `false` | SMS reminders and alerts | Third-party service |
| Email Notifications | `enableEmailNotifications` | `true` | Email confirmations and reminders | Email service |

### 3.5 Organization Features (Default: Enabled)

| Feature | Key | Default | Description | Dependencies |
|---------|-----|---------|-------------|--------------|
| Pious Organizations | `enablePiousOrganizations` | `true` | CWO, CMO, CYON management | Parishioner Management |
| Event Management | `enableEventManagement` | `true` | Parish events and RSVP | None |

### 3.6 Advanced Features (Default: Disabled)

| Feature | Key | Default | Description | Dependencies |
|---------|-----|---------|-------------|--------------|
| Online Payments | `enableOnlinePayments` | `false` | Card/mobile money payments | Financial Management, Payment Gateway |
| Recurring Donations | `enableRecurringDonations` | `false` | Automated monthly giving | Online Payments |
| Mobile App | `enableMobileApp` | `false` | Native mobile app access | None |
| Public Website | `enablePublicWebsite` | `true` | Public-facing parish website | None |

---

## 4. Implementation Guide

### 4.1 Backend Implementation

#### API Middleware for Feature Protection

```typescript
// lib/middleware/featureGuard.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function featureGuard(
  feature: keyof OrganizationFeatureSettings,
  organizationId: string
) {
  const settings = await prisma.organizationFeatureSettings.findUnique({
    where: { organizationId }
  });

  if (!settings || !settings[feature]) {
    return NextResponse.json(
      { error: `Feature '${feature}' is not enabled for this organization` },
      { status: 403 }
    );
  }

  return null; // Feature is enabled
}
```

#### API Route Example

```typescript
// app/api/parishioners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { featureGuard } from '@/lib/middleware/featureGuard';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  const organizationId = session.user.organizationId;

  // Check if feature is enabled
  const featureCheck = await featureGuard(
    'enableParishionerManagement',
    organizationId
  );
  
  if (featureCheck) return featureCheck; // Return 403 if disabled

  // Proceed with normal logic
  const parishioners = await prisma.parishioner.findMany({
    where: { organizationId }
  });

  return NextResponse.json(parishioners);
}
```

### 4.2 Frontend Implementation

#### Feature Context Provider

```typescript
// contexts/FeatureContext.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { OrganizationFeatureSettings } from '@prisma/client';

interface FeatureContextType {
  features: OrganizationFeatureSettings | null;
  isEnabled: (feature: keyof OrganizationFeatureSettings) => boolean;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ 
  children, 
  features 
}: { 
  children: ReactNode; 
  features: OrganizationFeatureSettings | null;
}) {
  const isEnabled = (feature: keyof OrganizationFeatureSettings) => {
    return features?.[feature] ?? false;
  };

  return (
    <FeatureContext.Provider value={{ features, isEnabled }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeatures() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeatures must be used within FeatureProvider');
  }
  return context;
}
```

#### Component Usage

```typescript
// components/ParishionerList.tsx
'use client';

import { useFeatures } from '@/contexts/FeatureContext';
import FeatureDisabled from '@/components/FeatureDisabled';

export default function ParishionerList() {
  const { isEnabled } = useFeatures();

  if (!isEnabled('enableParishionerManagement')) {
    return (
      <FeatureDisabled 
        featureName="Parishioner Management"
        settingsLink="/settings/features"
      />
    );
  }

  return (
    <div>
      {/* Parishioner list content */}
    </div>
  );
}
```

#### Navigation Guard

```typescript
// components/Navigation.tsx
'use client';

import { useFeatures } from '@/contexts/FeatureContext';
import Link from 'next/link';

export default function Navigation() {
  const { isEnabled } = useFeatures();

  return (
    <nav>
      {isEnabled('enableParishionerManagement') && (
        <Link href="/parishioners">Parishioners</Link>
      )}
      
      {isEnabled('enableFinancialManagement') && (
        <Link href="/payments">Payments</Link>
      )}
      
      {isEnabled('enableMassIntentions') && (
        <Link href="/mass-intentions">Mass Intentions</Link>
      )}
      
      {isEnabled('enableLiveStreaming') && (
        <Link href="/live-streams">Live Streams</Link>
      )}
    </nav>
  );
}
```

### 4.3 Feature Settings UI

```typescript
// app/(dashboard)/[organizationId]/settings/features/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FeatureGroup {
  title: string;
  features: FeatureItem[];
}

interface FeatureItem {
  key: string;
  label: string;
  description: string;
  dependencies?: string[];
  impact?: string;
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    title: 'Core Features',
    features: [
      {
        key: 'enableParishionerManagement',
        label: 'Parishioner Management',
        description: 'Manage member records, demographics, and profiles',
        impact: 'Disabling will hide all parishioner-related features'
      },
      {
        key: 'enableSacramentalRecords',
        label: 'Sacramental Records',
        description: 'Track baptisms, confirmations, marriages, etc.',
        dependencies: ['enableParishionerManagement']
      },
      {
        key: 'enableFinancialManagement',
        label: 'Financial Management',
        description: 'Core payment and donation tracking',
        impact: 'Required for all payment-related features'
      }
    ]
  },
  {
    title: 'Payment Features',
    features: [
      {
        key: 'enableOfferings',
        label: 'Offerings',
        description: 'Track Sunday and special offerings',
        dependencies: ['enableFinancialManagement']
      },
      {
        key: 'enableTithes',
        label: 'Tithes',
        description: 'Record and report tithes',
        dependencies: ['enableFinancialManagement']
      },
      {
        key: 'enableDonationCampaigns',
        label: 'Donation Campaigns',
        description: 'Create fundraising campaigns for special projects',
        dependencies: ['enableFinancialManagement']
      }
    ]
  },
  // ... more groups
];

export default function FeatureSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/organizations/current/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        router.refresh();
        alert('Features updated successfully!');
      }
    } catch (error) {
      alert('Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Feature Settings</h1>
      
      {FEATURE_GROUPS.map(group => (
        <div key={group.title} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{group.title}</h2>
          
          <div className="space-y-4">
            {group.features.map(feature => (
              <div 
                key={feature.key}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{feature.label}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {feature.description}
                    </p>
                    
                    {feature.dependencies && (
                      <p className="text-xs text-blue-600 mt-2">
                        Requires: {feature.dependencies.join(', ')}
                      </p>
                    )}
                    
                    {feature.impact && (
                      <p className="text-xs text-orange-600 mt-2">
                        ⚠️ {feature.impact}
                      </p>
                    )}
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[feature.key] ?? false}
                      onChange={() => handleToggle(feature.key)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="flex justify-end mt-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Feature Dependencies

### Dependency Matrix

```
Financial Management
├── Offerings
├── Tithes
├── Donation Campaigns
├── Custom Donation Types
├── Monthly Tracking
└── Online Payments
    └── Recurring Donations

Parishioner Management
├── Sacramental Records
└── Pious Organizations

Appointments
└── Confession Booking

None (standalone features)
├── Mass Intentions
├── Live Streaming
├── Announcements
├── Email Notifications
├── SMS Notifications
├── Event Management
├── Mobile App
└── Public Website
```

### Validation Rules

```typescript
// lib/featureValidation.ts
export function validateFeatureChange(
  currentSettings: OrganizationFeatureSettings,
  newSettings: Partial<OrganizationFeatureSettings>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Rule: Cannot disable Financial Management if payment features are enabled
  if (newSettings.enableFinancialManagement === false) {
    if (currentSettings.enableOfferings) {
      errors.push('Disable Offerings before disabling Financial Management');
    }
    if (currentSettings.enableTithes) {
      errors.push('Disable Tithes before disabling Financial Management');
    }
    if (currentSettings.enableOnlinePayments) {
      errors.push('Disable Online Payments before disabling Financial Management');
    }
  }

  // Rule: Cannot disable Parishioner Management if dependent features are enabled
  if (newSettings.enableParishionerManagement === false) {
    if (currentSettings.enableSacramentalRecords) {
      errors.push('Disable Sacramental Records before disabling Parishioner Management');
    }
    if (currentSettings.enablePiousOrganizations) {
      errors.push('Disable Pious Organizations before disabling Parishioner Management');
    }
  }

  // Rule: Cannot disable Appointments if Confession Booking is enabled
  if (newSettings.enableAppointments === false) {
    if (currentSettings.enableConfessionBooking) {
      errors.push('Disable Confession Booking before disabling Appointments');
    }
  }

  // Rule: Cannot disable Online Payments if Recurring Donations is enabled
  if (newSettings.enableOnlinePayments === false) {
    if (currentSettings.enableRecurringDonations) {
      errors.push('Disable Recurring Donations before disabling Online Payments');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

## 6. Audit Logging

### Audit Entry Format

```typescript
// When features are changed
await prisma.auditLog.create({
  data: {
    action: 'PERMISSION_CHANGE',
    entityType: 'OrganizationFeatureSettings',
    entityId: organizationId,
    performedBy: userId,
    details: {
      changes: [
        {
          feature: 'enableLiveStreaming',
          oldValue: false,
          newValue: true
        }
      ],
      reason: 'Enabled for Easter Sunday live mass'
    },
    ipAddress: request.ip
  }
});
```

---

## 7. Default Configurations

### Parish Presets

```typescript
// lib/featurePresets.ts
export const FEATURE_PRESETS = {
  BASIC: {
    enableParishionerManagement: true,
    enableSacramentalRecords: true,
    enableFinancialManagement: true,
    enableOfferings: true,
    enableTithes: true,
    enableMassIntentions: true,
    enableAnnouncements: true,
    enableEventManagement: true,
    enablePublicWebsite: true,
    // All others: false
  },
  
  STANDARD: {
    ...FEATURE_PRESETS.BASIC,
    enableDonationCampaigns: true,
    enableCustomDonationTypes: true,
    enableMonthlyTracking: true,
    enableAppointments: true,
    enablePiousOrganizations: true,
    enableEmailNotifications: true,
  },
  
  PREMIUM: {
    ...FEATURE_PRESETS.STANDARD,
    enableLiveStreaming: true,
    enableOnlinePayments: true,
    enableSMSNotifications: true,
    enableConfessionBooking: true,
    enableMobileApp: true,
  },
  
  CUSTOM: {} // User defines all settings
};
```

---

## 8. Testing Strategy

### Unit Tests

```typescript
// __tests__/features/featureGuard.test.ts
describe('featureGuard', () => {
  it('should allow access when feature is enabled', async () => {
    const result = await featureGuard('enableParishionerManagement', 'org-123');
    expect(result).toBeNull();
  });

  it('should deny access when feature is disabled', async () => {
    const result = await featureGuard('enableLiveStreaming', 'org-123');
    expect(result.status).toBe(403);
  });
});
```

### Integration Tests

```typescript
// __tests__/integration/features.test.ts
describe('Feature Toggle Integration', () => {
  it('should hide parishioner menu when disabled', async () => {
    await updateFeatures({ enableParishionerManagement: false });
    const nav = await render(<Navigation />);
    expect(nav.queryByText('Parishioners')).toBeNull();
  });

  it('should return 403 for parishioner API when disabled', async () => {
    await updateFeatures({ enableParishionerManagement: false });
    const response = await fetch('/api/parishioners');
    expect(response.status).toBe(403);
  });
});
```

---

## 9. Migration Guide

### Enabling a Feature

1. **Check Dependencies**: Ensure required features are enabled
2. **Update Settings**: Use UI or API to enable feature
3. **Verify Access**: Test feature availability in UI and API
4. **Train Users**: Provide training materials for new feature
5. **Monitor Usage**: Track adoption and performance

### Disabling a Feature

1. **Check Dependents**: Ensure no features depend on this one
2. **Notify Users**: Inform users of pending change
3. **Export Data**: If needed, export data before disabling
4. **Update Settings**: Disable feature via UI or API
5. **Verify Hiding**: Confirm UI elements and API endpoints are blocked
6. **Clean Up**: Optionally archive related data

---

## 10. Best Practices

### For Developers

1. **Always check features** before rendering UI or processing API requests
2. **Use the FeatureContext** for consistent client-side checks
3. **Implement proper error messages** when features are disabled
4. **Cache feature settings** to minimize database queries
5. **Test all features** in both enabled and disabled states
6. **Log feature changes** in audit trail

### For Parish Administrators

1. **Start with basic features** and enable more as needed
2. **Understand dependencies** before disabling features
3. **Test in staging** before changing production settings
4. **Communicate changes** to staff before making them
5. **Review usage** regularly to optimize feature set
6. **Plan budget** around enabled features

---

## 11. Cost Considerations

### Pricing Model (Example)

| Tier | Monthly Cost | Included Features |
|------|--------------|-------------------|
| Basic | $50 | Core + Payment + Spiritual features |
| Standard | $100 | Basic + Organizations + Advanced payments |
| Premium | $200 | All features including Live Streaming, SMS, Mobile |
| À la carte | Variable | Pay per feature ($10-30/feature) |

### Feature-Based Pricing

- **Live Streaming**: $30/month
- **SMS Notifications**: $20/month + usage
- **Online Payments**: 2% transaction fee
- **Mobile App Access**: $25/month
- **Advanced Analytics**: $40/month

---

## 12. Support & Troubleshooting

### Common Issues

**Issue**: Feature enabled but not showing in UI  
**Solution**: Clear cache and refresh browser

**Issue**: 403 error when accessing API  
**Solution**: Verify feature is enabled for organization

**Issue**: Cannot disable feature  
**Solution**: Check for dependent features and disable them first

**Issue**: Feature settings not saving  
**Solution**: Check user permissions and audit logs

---

## Conclusion

The Feature Toggle System provides Lumina DPM with the flexibility needed to serve diverse parish requirements while maintaining a single, unified codebase. By following this guide, developers can implement feature-aware functionality, and administrators can optimize their parish's digital infrastructure.
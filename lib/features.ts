import type { OrganizationFeatureSettings } from "@prisma/client";

/**
 * Feature names that can be toggled
 */
export type FeatureName = keyof Omit<
  OrganizationFeatureSettings,
  "id" | "organizationId" | "createdAt" | "updatedAt"
>;

/**
 * Feature categories for grouping in UI
 */
export const featureCategories = {
  core: {
    label: "Core Features",
    description: "Essential parish management features",
    features: [
      "enableParishionerManagement",
      "enableSacramentalRecords",
      "enableFinancialManagement",
    ] as FeatureName[],
  },
  payments: {
    label: "Payment Features",
    description: "Financial transaction management",
    features: [
      "enableOfferings",
      "enableTithes",
      "enableDonationCampaigns",
      "enableCustomDonationTypes",
      "enableMonthlyTracking",
    ] as FeatureName[],
  },
  spiritual: {
    label: "Spiritual Features",
    description: "Mass intentions and appointments",
    features: [
      "enableMassIntentions",
      "enableAppointments",
      "enableConfessionBooking",
    ] as FeatureName[],
  },
  communication: {
    label: "Communication Features",
    description: "Notifications and streaming",
    features: [
      "enableLiveStreaming",
      "enableAnnouncements",
      "enableSMSNotifications",
      "enableEmailNotifications",
    ] as FeatureName[],
  },
  organization: {
    label: "Society Features",
    description: "Groups and societies management",
    features: ["enableSocieties", "enableEventManagement"] as FeatureName[],
  },
  advanced: {
    label: "Advanced Features",
    description: "Premium and advanced capabilities",
    features: [
      "enableOnlinePayments",
      "enableRecurringDonations",
      "enableMobileApp",
      "enablePublicWebsite",
      "requireGateCode",
    ] as FeatureName[],
  },
} as const;

/**
 * Feature display names for UI
 */
export const featureLabels: Record<FeatureName, string> = {
  enableParishionerManagement: "Parishioner Management",
  enableSacramentalRecords: "Sacramental Records",
  enableFinancialManagement: "Financial Management",
  enableOfferings: "Offerings",
  enableTithes: "Tithes",
  enableDonationCampaigns: "Donation Campaigns",
  enableCustomDonationTypes: "Custom Donation Types",
  enableMonthlyTracking: "Monthly Tracking",
  enableMassIntentions: "Mass Intentions",
  enableAppointments: "Appointments",
  enableConfessionBooking: "Confession Booking",
  enableLiveStreaming: "Live Streaming",
  enableAnnouncements: "Announcements",
  enableSMSNotifications: "SMS Notifications",
  enableEmailNotifications: "Email Notifications",
  enableSocieties: "Societies",
  enableEventManagement: "Event Management",
  enableOnlinePayments: "Online Payments",
  enableRecurringDonations: "Recurring Donations",
  enableMobileApp: "Mobile App",
  enablePublicWebsite: "Public Website",
  requireGateCode: "Parish Gate Code",
};

/**
 * Feature descriptions for UI
 */
export const featureDescriptions: Record<FeatureName, string> = {
  enableParishionerManagement: "Manage parishioner profiles and records",
  enableSacramentalRecords: "Track baptisms, confirmations, marriages, etc.",
  enableFinancialManagement: "Record and track all financial transactions",
  enableOfferings: "Accept and track weekly offerings",
  enableTithes: "Track member tithe payments",
  enableDonationCampaigns: "Create and manage fundraising campaigns",
  enableCustomDonationTypes: "Define custom donation categories",
  enableMonthlyTracking: "Track payments by month for reporting",
  enableMassIntentions: "Accept mass intention requests",
  enableAppointments: "Schedule appointments with clergy",
  enableConfessionBooking: "Allow confession time booking",
  enableLiveStreaming: "Stream masses and events live",
  enableAnnouncements: "Post announcements for parishioners",
  enableSMSNotifications: "Send SMS notifications to members",
  enableEmailNotifications: "Send email notifications to members",
  enableSocieties: "Manage societies and groups",
  enableEventManagement: "Create and manage parish events",
  enableOnlinePayments: "Accept payments via payment gateway",
  enableRecurringDonations: "Set up recurring donation schedules",
  enableMobileApp: "Enable mobile app access for members",
  enablePublicWebsite: "Show a public website for the parish",
  requireGateCode:
    "Require a shared code before anyone can view this parish's public timeline",
};

/**
 * Default feature values (matching schema defaults)
 */
const defaultFeatureValues: Record<FeatureName, boolean> = {
  enableParishionerManagement: true,
  enableSacramentalRecords: true,
  enableFinancialManagement: true,
  enableOfferings: true,
  enableTithes: true,
  enableDonationCampaigns: true,
  enableCustomDonationTypes: true,
  enableMonthlyTracking: true,
  enableMassIntentions: true,
  enableAppointments: true,
  enableConfessionBooking: true,
  enableLiveStreaming: false,
  enableAnnouncements: true,
  enableSMSNotifications: false,
  enableEmailNotifications: true,
  enableSocieties: true,
  enableEventManagement: true,
  enableOnlinePayments: false,
  enableRecurringDonations: false,
  enableMobileApp: false,
  enablePublicWebsite: true,
  requireGateCode: false,
};

/**
 * Feature dependencies - some features require others to be enabled
 */
export const featureDependencies: Partial<Record<FeatureName, FeatureName[]>> =
  {
    enableMassIntentions: ["enableFinancialManagement"],
    enableOfferings: ["enableFinancialManagement"],
    enableTithes: ["enableFinancialManagement"],
    enableDonationCampaigns: ["enableFinancialManagement"],
    enableCustomDonationTypes: ["enableFinancialManagement"],
    enableMonthlyTracking: ["enableFinancialManagement"],
    enableOnlinePayments: ["enableFinancialManagement"],
    enableRecurringDonations: [
      "enableFinancialManagement",
      "enableOnlinePayments",
    ],
    enableConfessionBooking: ["enableAppointments"],
  };

/**
 * Get the default value for a feature
 */
export function getDefaultFeatureValue(feature: FeatureName): boolean {
  return defaultFeatureValues[feature];
}

/**
 * Get all feature names
 */
export function getAllFeatureNames(): FeatureName[] {
  return Object.keys(defaultFeatureValues) as FeatureName[];
}

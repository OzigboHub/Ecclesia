// Role hierarchy helpers
export function isAdminRole(role: string): boolean {
  return ["SUPER_ADMIN", "PARISH_ADMIN"].includes(role);
}

export function isStaffRole(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
  ].includes(role);
}

export function canManageUsers(role: string): boolean {
  return ["SUPER_ADMIN", "PARISH_ADMIN"].includes(role);
}

export function canManageOrganizations(role: string): boolean {
  return ["SUPER_ADMIN", "PARISH_ADMIN"].includes(role);
}

export function canManageOutstations(role: string): boolean {
  return ["SUPER_ADMIN", "PARISH_ADMIN", "OUTSTATION_ADMIN"].includes(role);
}

export function canManageParishioners(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
  ].includes(role);
}

export function canRecordPayments(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
  ].includes(role);
}

export function canManageFinancials(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
  ].includes(role);
}

export function canManageMassIntentions(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
  ].includes(role);
}

export function canBookMassIntentions(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
    "PARISHIONER",
  ].includes(role);
}

export function canViewMassCalendar(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
    "PARISHIONER",
  ].includes(role);
}

export function canBookAppointments(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "PARISHIONER",
  ].includes(role);
}

export function canManageEvents(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
  ].includes(role);
}

export function canManageSocieties(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_STAFF",
  ].includes(role);
}

export function canViewSocieties(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
    "PARISHIONER",
  ].includes(role);
}

export function canViewAllParishioners(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "OUTSTATION_ADMIN",
  ].includes(role);
}

export function canManageLiveStreams(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
  ].includes(role);
}

export function canViewLiveStreams(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "PARISH_STAFF",
    "OUTSTATION_ADMIN",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
    "PARISHIONER",
  ].includes(role);
}

export function isSocietyHead(role: string): boolean {
  return ["SOCIETY_PRESIDENT", "SOCIETY_SECRETARY"].includes(role);
}

export function canManageSocietyDues(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
    "SOCIETY_PRESIDENT",
    "SOCIETY_SECRETARY",
  ].includes(role);
}

export function canCreateSocietyAnnouncement(role: string): boolean {
  return ["SOCIETY_PRESIDENT", "SOCIETY_SECRETARY"].includes(role);
}

export function canApproveAnnouncements(role: string): boolean {
  return [
    "SUPER_ADMIN",
    "PARISH_ADMIN",
    "PARISH_SECRETARY",
  ].includes(role);
}

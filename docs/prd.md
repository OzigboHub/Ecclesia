# Product Requirements Document (PRD)

## Ecclesia Digital Parish Manager (DPM)

**Version:** 1.0
**Date:** January 2026
**Status:** Final
**Author:** Product Team

---

## 1. Executive Summary

### 1.1 Product Vision

Ecclesia DPM aims to be the premier digital solution for Catholic parish management, providing an intuitive, secure, and comprehensive platform that streamlines administrative tasks, enhances financial transparency, and improves engagement between parish leadership and members.

### 1.2 Business Objectives

-   Digitize parish administration and record-keeping
-   Improve financial transparency and accountability
-   Enable efficient communication between parish and members
-   Reduce administrative overhead by 60%
-   Support scalable growth across multiple parishes

### 1.3 Success Metrics

-   **User Adoption**: 80% of parish staff using the platform within 3 months
-   **Data Accuracy**: 95% accuracy in financial and member records
-   **User Satisfaction**: NPS score of 50+
-   **Financial Tracking**: 100% of donations and offerings recorded digitally
-   **Time Savings**: 40% reduction in administrative task completion time

---

## 2. User Personas

### 2.1 Parish Priest (PARISH_ADMIN)

**Demographics**: 35-65 years, limited technical expertise
**Goals**:

-   Oversee all parish operations
-   Access comprehensive reports
-   Manage staff and volunteers
    **Pain Points**:
-   Limited time for administrative tasks
-   Need for real-time parish insights
-   Multiple disconnected systems

### 2.2 Parish Secretary (PARISH_SECRETARY)

**Demographics**: 25-55 years, moderate technical skills
**Goals**:

-   Manage daily operations
-   Track donations and offerings
-   Maintain member records
    **Pain Points**:
-   Manual data entry errors
-   Difficulty generating reports
-   Time-consuming reconciliation

### 2.3 Parish Staff (PARISH_STAFF)

**Demographics**: 20-60 years, varying technical skills
**Goals**:

-   Record contributions efficiently
-   Schedule appointments
-   Update member information
    **Pain Points**:
-   Limited access to necessary information
-   Cumbersome data entry processes

### 2.4 Society President/Secretary

**Demographics**: 30-70 years, basic technical skills
**Goals**:

-   Manage organization members
-   Track organization contributions
-   Communicate with members
    **Pain Points**:
-   Lack of visibility into membership
-   Manual tracking of contributions

### 2.5 Parishioner (PARISHIONER)

**Demographics**: 18-80 years, varying technical skills
**Goals**:

-   Book mass intentions easily
-   Schedule appointments
-   View contribution history
    **Pain Points**:
-   Inconvenient office hours
-   Lack of transparency in contributions
-   Difficulty booking services

---

## 3. Functional Requirements

### 3.1 User Management

#### 3.1.1 Authentication & Authorization

**Priority**: P0 (Critical)

**Requirements**:

-   FR-UM-001: System shall support email/password authentication
-   FR-UM-002: System shall implement role-based access control with 8 distinct roles
-   FR-UM-003: System shall enforce password complexity requirements (min 8 chars, 1 uppercase, 1 number, 1 special char)
-   FR-UM-004: System shall support password reset via email
-   FR-UM-005: System shall automatically log out users after 24 hours of inactivity
-   FR-UM-006: System shall track last login time for all users

#### 3.1.2 User Profile Management

**Priority**: P1 (High)

**Requirements**:

-   FR-UM-007: Users shall be able to update their profile information
-   FR-UM-008: System shall validate email uniqueness
-   FR-UM-009: System shall allow admin to activate/deactivate user accounts

### 3.2 Organization Management

#### 3.2.1 Hierarchy Management

**Priority**: P0 (Critical)

**Requirements**:

-   FR-OM-001: System shall support two-level hierarchy (Parish, Outstation)
-   FR-OM-002: Each outstation shall be linked to a parent parish
-   FR-OM-003: System shall prevent circular references in hierarchy
-   FR-OM-004: Parish admin shall view all data for parish and its outstations
-   FR-OM-005: Outstation admin shall only view outstation-specific data

#### 3.2.2 Feature Toggle Management

**Priority**: P0 (Critical)

**Requirements**:

-   FR-OM-006: Each organization shall have configurable feature settings
-   FR-OM-007: Parish admin shall enable/disable features for their organization
-   FR-OM-008: System shall hide UI elements for disabled features
-   FR-OM-009: System shall prevent API access to disabled features
-   FR-OM-010: Feature settings shall include defaults for new organizations
-   FR-OM-011: System shall support 20+ configurable features including:
    -   Parishioner Management
    -   Sacramental Records
    -   Financial Management (Offerings, Tithes, Campaigns)
    -   Mass Intentions
    -   Appointments
    -   Live Streaming
    -   SMS/Email Notifications
    -   Societies
    -   Event Management
    -   Online Payments
    -   Public Website
-   FR-OM-012: Feature changes shall be logged in audit trail
-   FR-OM-013: System shall validate feature dependencies (e.g., online payments require financial management)
-   FR-OM-014: Outstation feature settings shall inherit from parent parish unless overridden

### 3.3 Parishioner Management

#### 3.3.1 Member Records

**Priority**: P0 (Critical)

**Requirements**:

-   FR-PM-001: System shall maintain comprehensive parishioner profiles
-   FR-PM-002: System shall store demographic information (name, DOB, gender, marital status)
-   FR-PM-003: System shall store contact information (email, phone, address)
-   FR-PM-004: System shall validate email and phone uniqueness
-   FR-PM-005: System shall support bulk import of parishioners via CSV
-   FR-PM-006: System shall track parishioner membership in societies

#### 3.3.2 Sacramental Records

**Priority**: P1 (High)

**Requirements**:

-   FR-PM-007: System shall track 5 sacrament types (Baptism, First Communion, Confirmation, Marriage, Anointing of the Sick)
-   FR-PM-008: System shall record date and organization where sacrament was received
-   FR-PM-009: System shall support adding notes to sacramental records
-   FR-PM-010: System shall generate sacramental certificates

### 3.4 Financial Management

#### 3.4.1 Payment Recording

**Priority**: P0 (Critical)

**Requirements**:

-   FR-FM-001: System shall record all payments through unified Payment model
-   FR-FM-002: System shall support 6 payment purposes (Offering, Tithe, Mass Intention, Donation Campaign, Custom Donation, Other)
-   FR-FM-003: System shall support 5 payment methods (Cash, Bank Transfer, Card, Mobile Money, Check)
-   FR-FM-004: System shall track payment status (Pending, Completed, Failed, Refunded)
-   FR-FM-005: System shall allow recording payments on behalf of others with proper attribution
-   FR-FM-006: System shall generate unique receipt numbers for all completed payments
-   FR-FM-007: System shall store transaction references for digital payments
-   FR-FM-008: System shall track monthly offerings (1-12) for categorization
-   FR-FM-009: System shall record who recorded each payment for audit trail

#### 3.4.2 Donation Campaigns

**Priority**: P1 (High)

**Requirements**:

-   FR-FM-010: Parish shall create donation campaigns with name, description, target amount, start and end dates
-   FR-FM-011: System shall track progress towards campaign targets
-   FR-FM-012: System shall link payments to specific campaigns
-   FR-FM-013: System shall support active/inactive campaign status
-   FR-FM-014: System shall generate campaign progress reports
-   FR-FM-015: System shall allow standalone donations without campaign association

#### 3.4.3 Custom Donation Types

**Priority**: P1 (High)

**Requirements**:

-   FR-FM-016: Parish shall create custom donation types
-   FR-FM-017: Each donation type shall have name and description
-   FR-FM-018: System shall ensure donation type names are unique within parish
-   FR-FM-019: System shall support activating/deactivating donation types
-   FR-FM-020: System shall prevent deletion of donation types with existing payments

#### 3.4.4 Financial Reporting

**Priority**: P0 (Critical)

**Requirements**:

-   FR-FM-021: System shall generate financial summary reports by date range
-   FR-FM-022: System shall generate reports by payment purpose
-   FR-FM-023: System shall generate reports by payment method
-   FR-FM-024: System shall generate monthly offering reports
-   FR-FM-025: System shall generate campaign progress reports
-   FR-FM-026: System shall export financial reports to PDF and Excel

### 3.5 Mass Intention Management

#### 3.5.1 Booking Mass Intentions

**Priority**: P1 (High)

**Requirements**:

-   FR-MI-001: System shall support booking 3 intention types (Thanksgiving, Requiem, Special Intention)
-   FR-MI-002: System shall record requester details (name, email, phone)
-   FR-MI-003: System shall specify mass date for intention
-   FR-MI-004: System shall record stipend amount
-   FR-MI-005: System shall link mass intentions to specific events/masses
-   FR-MI-006: System shall link payments to mass intentions
-   FR-MI-007: Parishioners shall book mass intentions through self-service portal
-   FR-MI-008: System shall send confirmation notifications for booked intentions

### 3.6 Appointment Management

#### 3.6.1 Appointment Scheduling

**Priority**: P2 (Medium)

**Requirements**:

-   FR-AM-001: System shall support 4 appointment types (Confession, Counseling, Meeting, Other)
-   FR-AM-002: System shall track appointment status (Pending, Confirmed, Cancelled, Completed)
-   FR-AM-003: System shall assign appointments to specific staff members
-   FR-AM-004: System shall prevent double-booking of assigned staff
-   FR-AM-005: Parishioners shall book appointments through self-service portal
-   FR-AM-006: System shall send appointment reminders 24 hours before scheduled time
-   FR-AM-007: System shall allow rescheduling of pending appointments

### 3.7 Society Management

#### 3.7.1 Organization Setup

**Priority**: P2 (Medium)

**Requirements**:

-   FR-PO-001: Parish shall create societies
-   FR-PO-002: Each organization shall have president and secretary roles
-   FR-PO-003: Organization names shall be unique within parish
-   FR-PO-004: System shall track organization members

#### 3.7.2 Membership Management

**Priority**: P2 (Medium)

**Requirements**:

-   FR-PO-005: Presidents/secretaries shall add members to their organizations
-   FR-PO-006: System shall track membership join dates
-   FR-PO-007: System shall support removing members from organizations
-   FR-PO-008: Parishioners can belong to multiple organizations

### 3.8 Live Streaming

#### 3.8.1 Stream Management

**Priority**: P2 (Medium)

**Requirements**:

-   FR-LS-001: Parish shall create live stream events
-   FR-LS-002: System shall store stream URL and description
-   FR-LS-003: System shall toggle live/inactive stream status
-   FR-LS-004: System shall schedule future streams
-   FR-LS-005: Parishioners shall view active live streams without authentication

### 3.9 Event Management

#### 3.9.1 Event Creation

**Priority**: P2 (Medium)

**Requirements**:

-   FR-EM-001: Parish shall create events with title, description, start/end times
-   FR-EM-002: System shall track event status (Scheduled, Completed, Cancelled)
-   FR-EM-003: System shall support RSVP with maximum attendee limits
-   FR-EM-004: System shall link mass intentions to specific events

---

## 4. Non-Functional Requirements

### 4.1 Security

#### 4.1.1 Authentication Security

**Priority**: P0 (Critical)

**Requirements**:

-   NFR-SEC-001: All passwords shall be hashed using bcrypt (cost factor 12+)
-   NFR-SEC-002: System shall implement JWT-based session management
-   NFR-SEC-003: Session tokens shall expire after 24 hours
-   NFR-SEC-004: System shall support token refresh without re-authentication

#### 4.1.2 Authorization Security

**Priority**: P0 (Critical)

**Requirements**:

-   NFR-SEC-005: All API endpoints shall implement role-based access control
-   NFR-SEC-006: System shall enforce hierarchical data access based on organization
-   NFR-SEC-007: System shall prevent horizontal privilege escalation
-   NFR-SEC-008: System shall prevent vertical privilege escalation

#### 4.1.3 Data Security

**Priority**: P0 (Critical)

**Requirements**:

-   NFR-SEC-009: All data in transit shall be encrypted using TLS 1.3+
-   NFR-SEC-010: Database shall implement encryption at rest
-   NFR-SEC-011: System shall use parameterized queries to prevent SQL injection
-   NFR-SEC-012: System shall validate and sanitize all user inputs
-   NFR-SEC-013: System shall implement CSRF protection

#### 4.1.4 Audit & Compliance

**Priority**: P0 (Critical)

**Requirements**:

-   NFR-SEC-014: System shall log all sensitive operations (payments, user changes, permissions)
-   NFR-SEC-015: Audit logs shall include timestamp, user, action, entity, and IP address
-   NFR-SEC-016: Audit logs shall be immutable and tamper-proof
-   NFR-SEC-017: Audit logs shall be retained for minimum 7 years

### 4.2 Performance

**Requirements**:

-   NFR-PERF-001: Page load time shall be < 2 seconds (95th percentile)
-   NFR-PERF-002: API response time shall be < 500ms (95th percentile)
-   NFR-PERF-003: System shall support 1000 concurrent users
-   NFR-PERF-004: System shall handle 100 transactions per second
-   NFR-PERF-005: Database queries shall execute in < 100ms (95th percentile)
-   NFR-PERF-006: Feature toggles shall be cached to minimize database queries
-   NFR-PERF-007: Disabled features shall not impact system performance

### 4.3 Availability & Reliability

**Requirements**:

-   NFR-AVAIL-001: System uptime shall be 99.9% (excluding planned maintenance)
-   NFR-AVAIL-002: Planned maintenance windows shall not exceed 4 hours/month
-   NFR-AVAIL-003: System shall implement automatic failover for database
-   NFR-AVAIL-004: System shall support zero-downtime deployments

### 4.4 Scalability

**Requirements**:

-   NFR-SCALE-001: System shall support 100+ parishes on single instance
-   NFR-SCALE-002: System shall support 10,000+ parishioners per parish
-   NFR-SCALE-003: System shall horizontally scale to handle increased load
-   NFR-SCALE-004: Database shall support read replicas for reporting queries

### 4.5 Usability

**Requirements**:

-   NFR-USE-001: System shall be accessible on desktop, tablet, and mobile devices
-   NFR-USE-002: System shall follow WCAG 2.1 AA accessibility standards
-   NFR-USE-003: System shall support modern browsers (Chrome, Firefox, Safari, Edge)
-   NFR-USE-004: System shall provide contextual help and tooltips
-   NFR-USE-005: Error messages shall be clear and actionable

### 4.6 Backup & Recovery

**Requirements**:

-   NFR-BACKUP-001: System shall perform daily automated backups
-   NFR-BACKUP-002: Backups shall be stored in geographically separate location
-   NFR-BACKUP-003: System shall support point-in-time recovery
-   NFR-BACKUP-004: Recovery Time Objective (RTO) shall be < 4 hours
-   NFR-BACKUP-005: Recovery Point Objective (RPO) shall be < 24 hours

---

## 5. User Interface Requirements

### 5.1 Design Principles

-   Clean, modern, and intuitive interface
-   Consistent navigation across all pages
-   Clear visual hierarchy
-   Responsive design for all screen sizes
-   Accessible color contrast ratios

### 5.2 Key Screens

#### 5.2.1 Dashboard

-   Summary cards for key metrics
-   Recent activity feed
-   Quick action buttons
-   Upcoming events and appointments

#### 5.2.2 Payment Recording

-   Simple form with payment purpose selection
-   Auto-complete for parishioner search
-   Real-time validation
-   Receipt preview before submission
-   Respects feature toggles (only shows enabled payment types)

#### 5.2.3 Feature Settings Dashboard

-   Toggle switches for each feature
-   Feature descriptions and dependencies
-   Visual indicators for enabled/disabled features
-   Impact warnings before disabling features
-   Save confirmation with audit trail

#### 5.2.4 Financial Reports

-   Date range selector
-   Filter by payment type/method
-   Visual charts and graphs
-   Export functionality

#### 5.2.4 Parishioner Management

-   Searchable and filterable list
-   Quick view modal for details
-   Bulk actions support
-   Import/export functionality

---

## 6. Integration Requirements

### 6.1 Payment Gateways

**Priority**: P1 (High)

**Requirements**:

-   INT-PAY-001: Integrate with Paystack for card payments
-   INT-PAY-002: Integrate with Flutterwave for mobile money
-   INT-PAY-003: Support webhook notifications for payment status

### 6.2 Email Service

**Priority**: P1 (High)

**Requirements**:

-   INT-EMAIL-001: Integrate with SendGrid or AWS SES
-   INT-EMAIL-002: Send transactional emails (receipts, confirmations)
-   INT-EMAIL-003: Support email templates for consistency

### 6.3 SMS Service

**Priority**: P2 (Medium)

**Requirements**:

-   INT-SMS-001: Integrate with Twilio for SMS notifications
-   INT-SMS-002: Send appointment reminders via SMS
-   INT-SMS-003: Send payment receipts via SMS

---

## 7. Data Migration Requirements

### 7.1 Initial Data Import

**Priority**: P1 (High)

**Requirements**:

-   DM-001: Support CSV import for parishioners
-   DM-002: Support CSV import for historical donations
-   DM-003: Validate data integrity during import
-   DM-004: Generate import error reports

---

## 8. Compliance & Regulations

### 8.1 Data Privacy

-   System shall comply with GDPR principles
-   System shall support data export for parishioners
-   System shall support right to deletion (with exceptions for financial records)

### 8.2 Financial Compliance

-   System shall generate audit-compliant financial reports
-   System shall maintain immutable financial records
-   System shall support regulatory reporting requirements

---

## 9. Future Enhancements (Out of Scope for v1.0)

-   Mobile applications (iOS/Android)
-   SMS notifications
-   Advanced analytics and business intelligence
-   Multi-language support
-   Offline mode capability
-   Integration with church management systems
-   QR code-based giving
-   Recurring donation support
-   Volunteer management
-   Asset management

---

## 10. Success Criteria

### 10.1 Launch Criteria

-   All P0 and P1 requirements implemented
-   Security audit completed and passed
-   Load testing completed (supports 1000 concurrent users)
-   User acceptance testing completed with 3 pilot parishes
-   Documentation completed (user guides, API docs, admin guides)

### 10.2 Post-Launch Criteria (3 Months)

-   10+ parishes onboarded
-   80% user adoption rate within pilot parishes
-   NPS score of 50+
-   < 10 critical bugs reported
-   99.5%+ uptime achieved

---

## 11. Risks & Mitigation

| Risk                                        | Impact   | Probability | Mitigation                                               |
| ------------------------------------------- | -------- | ----------- | -------------------------------------------------------- |
| Low user adoption due to technical barriers | High     | Medium      | Comprehensive training, intuitive UI, video tutorials    |
| Data migration errors                       | High     | Medium      | Thorough testing, validation rules, rollback plan        |
| Security breach                             | Critical | Low         | Regular security audits, penetration testing, encryption |
| Performance issues at scale                 | High     | Medium      | Load testing, performance monitoring, auto-scaling       |
| Third-party service downtime                | Medium   | Medium      | Fallback mechanisms, service redundancy                  |

---

## 12. Appendix

### 12.1 Glossary

-   **Parish**: A defined Catholic church community with a resident priest
-   **Outstation**: A smaller worship community under a parish's jurisdiction
-   **Stipend**: A donation given for a mass intention
-   **Society**: A Catholic group within the parish (e.g., CWO, CMO, CYON)

### 12.2 References

-   Catholic Church Canon Law
-   GDPR Compliance Guidelines
-   WCAG 2.1 Accessibility Standards

# Product Backlog

## Ecclesia Digital Parish Manager (DPM)

**Last Updated:** January 2026
**Sprint Duration:** 2 weeks
**Team Velocity:** TBD (to be calculated after Sprint 1)

---

## Backlog Organization

### Priority Levels

-   **P0 (Critical)**: Must have for launch, blocks other work
-   **P1 (High)**: Required for launch
-   **P2 (Medium)**: Important but can be deferred
-   **P3 (Low)**: Nice to have, future enhancement

### Story Point Scale

-   **1 point**: < 4 hours
-   **2 points**: 4-8 hours (half day)
-   **3 points**: 1 day
-   **5 points**: 2-3 days
-   **8 points**: 1 week
-   **13 points**: 2 weeks (needs to be broken down)

---

## Epic 1: Foundation & Infrastructure

### US-001: Project Setup & Configuration

**Priority**: P0
**Points**: 5
**Sprint**: 1

**As a** developer
**I want** the project environment configured
**So that** I can start building features efficiently

**Acceptance Criteria**:

-   [ ] Next.js project initialized with App Router
-   [ ] Prisma configured with PostgreSQL
-   [ ] Tailwind CSS set up
-   [ ] TypeScript configured
-   [ ] ESLint and Prettier configured
-   [ ] Git repository created with .gitignore
-   [ ] README with setup instructions
-   [ ] Environment variables template created

---

### US-002: Database Schema Implementation

**Priority**: P0
**Points**: 8
**Sprint**: 1

**As a** developer
**I want** the complete database schema defined
**So that** data can be stored and retrieved

**Acceptance Criteria**:

-   [ ] All models defined in Prisma schema
-   [ ] Enums properly configured
-   [ ] Relationships correctly established
-   [ ] Indexes created for performance
-   [ ] Initial migration created
-   [ ] Migration runs successfully
-   [ ] Prisma Client generated
-   [ ] Schema documented

**Dependencies**: US-001

---

### US-003: CI/CD Pipeline Setup

**Priority**: P1
**Points**: 5
**Sprint**: 1

**As a** DevOps engineer
**I want** automated testing and deployment
**So that** code quality is maintained and deployments are consistent

**Acceptance Criteria**:

-   [ ] GitHub Actions workflow configured
-   [ ] Automated tests run on PR
-   [ ] Linting checks on commit
-   [ ] Build verification on PR
-   [ ] Automatic deployment to staging
-   [ ] Manual approval for production
-   [ ] Slack notifications for build status

---

## Epic 2: Authentication & Authorization

### US-004: User Authentication Setup

**Priority**: P0
**Points**: 8
**Sprint**: 2

**As a** user
**I want** to log in securely
**So that** I can access the system

**Acceptance Criteria**:

-   [ ] NextAuth.js configured
-   [ ] Login page created
-   [ ] Email/password authentication working
-   [ ] Session management implemented
-   [ ] Password hashing with bcrypt
-   [ ] JWT token generation
-   [ ] Secure cookie configuration
-   [ ] Login audit log entry created

**Dependencies**: US-002

---

### US-005: User Registration

**Priority**: P0
**Points**: 5
**Sprint**: 2

**As a** parish admin
**I want** to create user accounts
**So that** staff can access the system

**Acceptance Criteria**:

-   [ ] Registration form created
-   [ ] Email uniqueness validation
-   [ ] Password complexity validation
-   [ ] Role selection dropdown
-   [ ] Organization assignment
-   [ ] Success/error messages
-   [ ] Email verification (optional)
-   [ ] Audit log entry

**Dependencies**: US-004

---

### US-006: Role-Based Access Control (RBAC)

**Priority**: P0
**Points**: 8
**Sprint**: 2

**As a** system administrator
**I want** role-based permissions
**So that** users only access appropriate features

**Acceptance Criteria**:

-   [ ] Middleware for authentication check
-   [ ] Middleware for role authorization
-   [ ] All 8 roles implemented
-   [ ] API endpoint protection
-   [ ] Role-based UI rendering
-   [ ] Permission denied messages
-   [ ] Unit tests for all roles
-   [ ] Documentation of permissions

**Dependencies**: US-004

---

### US-007: Hierarchical Authorization

**Priority**: P0
**Points**: 8
**Sprint**: 3

**As a** user
**I want** to only see data from my organization
**So that** data privacy is maintained

**Acceptance Criteria**:

-   [ ] Organization-based data filtering
-   [ ] Parish sees own and outstation data
-   [ ] Outstation only sees own data
-   [ ] Organization switching for multi-parish admins
-   [ ] Query filters for all endpoints
-   [ ] Prevent cross-organization access
-   [ ] Integration tests
-   [ ] Security audit

**Dependencies**: US-006

---

## Epic 3: Organization Management

### US-008: Organization CRUD APIs

**Priority**: P0
**Points**: 5
**Sprint**: 3

**As a** super admin
**I want** to manage organizations
**So that** parishes and outstations can be configured

**Acceptance Criteria**:

-   [ ] Create organization endpoint
-   [ ] Read organization endpoint
-   [ ] Update organization endpoint
-   [ ] Delete organization endpoint (soft delete)
-   [ ] Hierarchy validation (prevent circular refs)
-   [ ] Input validation
-   [ ] Error handling
-   [ ] Unit tests

**Dependencies**: US-007

---

### US-008A: Feature Toggle System

**Priority**: P0
**Points**: 13
**Sprint**: 3

**As a** parish admin
**I want** to enable/disable features for my organization
**So that** I only pay for and use features I need

**Acceptance Criteria**:

-   [ ] OrganizationFeatureSettings model created
-   [ ] Feature toggle CRUD APIs
-   [ ] Default feature settings on organization creation
-   [ ] 20+ configurable features defined
-   [ ] Feature dependency validation
-   [ ] Middleware to check feature enabled before API access
-   [ ] React hook/context for feature checks in UI
-   [ ] Audit logging for feature changes
-   [ ] Inheritance logic for outstation features
-   [ ] Unit tests for all feature logic
-   [ ] Integration tests

**Dependencies**: US-008

---

### US-008B: Feature Settings UI

**Priority**: P0
**Points**: 8
**Sprint**: 3

**As a** parish admin
**I want** a UI to manage feature settings
**So that** I can easily configure my parish

**Acceptance Criteria**:

-   [ ] Feature settings page
-   [ ] Toggle switches for each feature
-   [ ] Feature descriptions and tooltips
-   [ ] Dependency warnings (e.g., "Disabling Financial Management will also disable Offerings")
-   [ ] Impact preview before saving
-   [ ] Save confirmation dialog
-   [ ] Success/error messages
-   [ ] Responsive design
-   [ ] Visual grouping of related features
-   [ ] Search/filter features

**Dependencies**: US-008A

---

### US-009: Organization Management UI

**Priority**: P0
**Points**: 8
**Sprint**: 3

**As a** super admin
**I want** a UI to manage organizations
**So that** I can easily set up parishes

**Acceptance Criteria**:

-   [ ] Organization list page
-   [ ] Create organization form
-   [ ] Edit organization form
-   [ ] Organization hierarchy visualization
-   [ ] Parent organization selection
-   [ ] Validation messages
-   [ ] Success/error toasts
-   [ ] Responsive design

**Dependencies**: US-008

---

## Epic 4: Parishioner Management

### US-010: Parishioner CRUD APIs

**Priority**: P0
**Points**: 8
**Sprint**: 4

**As a** parish secretary
**I want** to manage parishioner records
**So that** member information is maintained

**Acceptance Criteria**:

-   [ ] Create parishioner endpoint
-   [ ] Read parishioner endpoint (single & list)
-   [ ] Update parishioner endpoint
-   [ ] Delete parishioner endpoint (soft delete)
-   [ ] Search functionality
-   [ ] Filter by organization
-   [ ] Email/phone uniqueness check
-   [ ] Feature toggle check (enableParishionerManagement)
-   [ ] Return 403 if feature disabled
-   [ ] Unit tests

**Dependencies**: US-007, US-008A

---

### US-011: Parishioner Management UI

**Priority**: P0
**Points**: 13
**Sprint**: 4-5

**As a** parish secretary
**I want** a UI to manage parishioners
**So that** I can efficiently handle member data

**Acceptance Criteria**:

-   [ ] Parishioner list with search
-   [ ] Filter by organization, gender, marital status
-   [ ] Pagination (100 per page)
-   [ ] Create parishioner form
-   [ ] Edit parishioner form
-   [ ] View parishioner profile
-   [ ] Delete confirmation modal
-   [ ] Form validation
-   [ ] Responsive design
-   [ ] Loading states
-   [ ] Hide entire section if enableParishionerManagement is false
-   [ ] Show feature disabled message with link to settings

**Dependencies**: US-010, US-008B

---

### US-012: CSV Import for Parishioners

**Priority**: P1
**Points**: 8
**Sprint**: 5

**As a** parish secretary
**I want** to import parishioners from CSV
**So that** I don't have to manually enter existing records

**Acceptance Criteria**:

-   [ ] CSV upload interface
-   [ ] Template CSV download
-   [ ] Data validation
-   [ ] Duplicate detection
-   [ ] Import preview
-   [ ] Batch import processing
-   [ ] Error report generation
-   [ ] Success summary

**Dependencies**: US-010

---

### US-013: Sacramental Records

**Priority**: P1
**Points**: 8
**Sprint**: 5

**As a** parish secretary
**I want** to record sacraments
**So that** parishioner sacramental history is tracked

**Acceptance Criteria**:

-   [ ] Sacrament CRUD APIs
-   [ ] Sacrament type selection (5 types)
-   [ ] Date received field
-   [ ] Notes field
-   [ ] Link to parishioner
-   [ ] Sacrament list on profile
-   [ ] Certificate generation (future)
-   [ ] Integration tests

**Dependencies**: US-010

---

## Epic 5: Payment System

### US-014: Payment Recording APIs

**Priority**: P0
**Points**: 13
**Sprint**: 6

**As a** parish secretary
**I want** to record all payments
**So that** financial transactions are tracked

**Acceptance Criteria**:

-   [ ] Create payment endpoint
-   [ ] Read payment endpoint (single & list)
-   [ ] Update payment endpoint
-   [ ] Payment status transitions
-   [ ] Receipt number generation
-   [ ] Link to parishioner (optional)
-   [ ] Link to purpose (mass intention, campaign, donation)
-   [ ] Payment on behalf of functionality
-   [ ] Audit log entries
-   [ ] Unit tests

**Dependencies**: US-007

---

### US-015: Payment Recording UI

**Priority**: P0
**Points**: 13
**Sprint**: 6-7

**As a** parish staff
**I want** to easily record payments
**So that** I can process donations quickly

**Acceptance Criteria**:

-   [ ] Payment form with all fields
-   [ ] Purpose selection dropdown
-   [ ] Auto-complete parishioner search
-   [ ] Payment method selection
-   [ ] Amount validation
-   [ ] On-behalf-of toggle
-   [ ] Receipt preview
-   [ ] Print receipt functionality
-   [ ] Success confirmation
-   [ ] Responsive design

**Dependencies**: US-014

---

### US-016: Payment History View

**Priority**: P1
**Points**: 8
**Sprint**: 7

**As a** parish secretary
**I want** to view payment history
**So that** I can track all transactions

**Acceptance Criteria**:

-   [ ] Payment list page
-   [ ] Search by parishioner name
-   [ ] Filter by date range
-   [ ] Filter by purpose
-   [ ] Filter by payment method
-   [ ] Filter by status
-   [ ] Sort by date, amount
-   [ ] Pagination
-   [ ] Export to CSV
-   [ ] Responsive design

**Dependencies**: US-014

---

### US-017: Custom Donation Types

**Priority**: P1
**Points**: 5
**Sprint**: 7

**As a** parish admin
**I want** to create custom donation types
**So that** specific parish needs are tracked

**Acceptance Criteria**:

-   [ ] Donation type CRUD APIs
-   [ ] Create donation type UI
-   [ ] List donation types
-   [ ] Edit donation type
-   [ ] Activate/deactivate types
-   [ ] Link to payments
-   [ ] Prevent deletion if payments exist
-   [ ] Integration tests

**Dependencies**: US-014

---

### US-018: Donation Campaigns

**Priority**: P1
**Points**: 13
**Sprint**: 7-8

**As a** parish admin
**I want** to create donation campaigns
**So that** special projects can be funded

**Acceptance Criteria**:

-   [ ] Campaign CRUD APIs
-   [ ] Create campaign UI
-   [ ] Target amount setting
-   [ ] Start/end date selection
-   [ ] Campaign progress tracking
-   [ ] Link payments to campaigns
-   [ ] Active/inactive status
-   [ ] Campaign list page
-   [ ] Campaign detail page with progress
-   [ ] Integration tests

**Dependencies**: US-014, US-017

---

### US-019: Financial Reports

**Priority**: P0
**Points**: 13
**Sprint**: 8

**As a** parish admin
**I want** comprehensive financial reports
**So that** I can track parish finances

**Acceptance Criteria**:

-   [ ] Financial summary API
-   [ ] Date range selector
-   [ ] Filter by purpose
-   [ ] Filter by method
-   [ ] Monthly offering report
-   [ ] Campaign progress report
-   [ ] Summary cards (total, by type)
-   [ ] Visual charts (pie, bar, line)
-   [ ] Export to PDF
-   [ ] Export to Excel
-   [ ] Performance optimization

**Dependencies**: US-014, US-016

---

## Epic 6: Mass Intentions

### US-020: Mass Intention Booking APIs

**Priority**: P1
**Points**: 8
**Sprint**: 9

**As a** parishioner
**I want** to book mass intentions
**So that** masses can be offered for my intentions

**Acceptance Criteria**:

-   [ ] Mass intention CRUD APIs
-   [ ] Intention type selection (3 types)
-   [ ] Requester details capture
-   [ ] Mass date selection
-   [ ] Stipend amount
-   [ ] Link to parishioner (optional)
-   [ ] Link to event (optional)
-   [ ] Integration tests

**Dependencies**: US-007

---

### US-021: Mass Intention Booking UI

**Priority**: P1
**Points**: 8
**Sprint**: 9

**As a** parishioner
**I want** a simple booking form
**So that** I can easily request mass intentions

**Acceptance Criteria**:

-   [ ] Public booking form
-   [ ] Intention type radio buttons
-   [ ] Text area for intention details
-   [ ] Requester information fields
-   [ ] Mass date picker
-   [ ] Stipend amount display/input
-   [ ] Terms and conditions
-   [ ] Confirmation email
-   [ ] Success message
-   [ ] Responsive design

**Dependencies**: US-020

---

### US-022: Mass Intention Payment Integration

**Priority**: P1
**Points**: 5
**Sprint**: 9

**As a** parish secretary
**I want** mass intention payments recorded
**So that** stipends are tracked

**Acceptance Criteria**:

-   [ ] Link payment to mass intention
-   [ ] Payment purpose = MASS_INTENTION
-   [ ] Display pending payments
-   [ ] Mark as paid functionality
-   [ ] Receipt generation with intention details
-   [ ] Integration tests

**Dependencies**: US-014, US-020

---

### US-023: Mass Intention Calendar View

**Priority**: P2
**Points**: 8
**Sprint**: 10

**As a** parish secretary
**I want** a calendar of mass intentions
**So that** I can see scheduled intentions

**Acceptance Criteria**:

-   [ ] Calendar component
-   [ ] Month/week/day views
-   [ ] Display intentions on dates
-   [ ] Click to view details
-   [ ] Color code by type
-   [ ] Filter by status
-   [ ] Print view
-   [ ] Responsive design

**Dependencies**: US-020

---

## Epic 7: Appointment System

### US-024: Appointment APIs

**Priority**: P2
**Points**: 8
**Sprint**: 10

**As a** parishioner
**I want** to book appointments
**So that** I can meet with parish staff

**Acceptance Criteria**:

-   [ ] Appointment CRUD APIs
-   [ ] Appointment type selection
-   [ ] Staff assignment
-   [ ] Date/time selection
-   [ ] Conflict detection
-   [ ] Status management (4 states)
-   [ ] Link to parishioner
-   [ ] Integration tests

**Dependencies**: US-007

---

### US-025: Appointment Booking UI

**Priority**: P2
**Points**: 13
**Sprint**: 10-11

**As a** parishioner
**I want** to book appointments online
**So that** I don't have to call the office

**Acceptance Criteria**:

-   [ ] Public booking form
-   [ ] Appointment type selection
-   [ ] Staff selection (if applicable)
-   [ ] Date/time picker
-   [ ] Available slots shown
-   [ ] Conflict prevention
-   [ ] Confirmation email
-   [ ] SMS reminder (optional)
-   [ ] Success message
-   [ ] Responsive design

**Dependencies**: US-024

---

### US-026: Appointment Management Dashboard

**Priority**: P2
**Points**: 8
**Sprint**: 11

**As a** parish secretary
**I want** to manage appointments
**So that** I can coordinate schedules

**Acceptance Criteria**:

-   [ ] Appointment list page
-   [ ] Calendar view
-   [ ] Filter by date, type, status, staff
-   [ ] Confirm/cancel appointments
-   [ ] Reassign appointments
-   [ ] Send reminders manually
-   [ ] View appointment details
-   [ ] Responsive design

**Dependencies**: US-024

---

## Epic 8: Pious Organizations

### US-027: Pious Organization Setup APIs

**Priority**: P2
**Points**: 5
**Sprint**: 11

**As a** parish admin
**I want** to create pious organizations
**So that** groups can be managed

**Acceptance Criteria**:

-   [ ] Organization CRUD APIs
-   [ ] President assignment
-   [ ] Secretary assignment
-   [ ] Unique name within parish
-   [ ] Description field
-   [ ] Integration tests

**Dependencies**: US-007

---

### US-028: Pious Organization UI

**Priority**: P2
**Points**: 8
**Sprint**: 11

**As a** parish admin
**I want** to manage pious organizations
**So that** I can set up groups

**Acceptance Criteria**:

-   [ ] Organization list page
-   [ ] Create organization form
-   [ ] Edit organization
-   [ ] Assign president/secretary
-   [ ] View members list
-   [ ] Responsive design

**Dependencies**: US-027

---

### US-029: Membership Management

**Priority**: P2
**Points**: 8
**Sprint**: 12

**As an** organization president
**I want** to manage members
**So that** membership is current

**Acceptance Criteria**:

-   [ ] Membership APIs
-   [ ] Add member interface
-   [ ] Remove member functionality
-   [ ] Member search/filter
-   [ ] View member list
-   [ ] Join date tracking
-   [ ] Integration tests

**Dependencies**: US-027, US-010

---

## Epic 9: Events & Live Streaming

### US-030: Event Management APIs

**Priority**: P2
**Points**: 5
**Sprint**: 12

**As a** parish admin
**I want** to create events
**So that** parish activities are tracked

**Acceptance Criteria**:

-   [ ] Event CRUD APIs
-   [ ] Date/time fields
-   [ ] Location field
-   [ ] Status management
-   [ ] Max attendees (RSVP)
-   [ ] Integration tests

**Dependencies**: US-007

---

### US-031: Event Management UI

**Priority**: P2
**Points**: 8
**Sprint**: 12

**As a** parish admin
**I want** to manage events
**So that** I can publish parish calendar

**Acceptance Criteria**:

-   [ ] Event list page
-   [ ] Create event form
-   [ ] Edit event
-   [ ] Calendar view
-   [ ] RSVP tracking
-   [ ] Public event view
-   [ ] Responsive design

**Dependencies**: US-030

---

### US-032: Live Streaming Setup

**Priority**: P2
**Points**: 8
**Sprint**: 12

**As a** parish admin
**I want** to configure live streams
**So that** masses can be broadcast

**Acceptance Criteria**:

-   [ ] Live stream CRUD APIs
-   [ ] Stream URL input
-   [ ] Title and description
-   [ ] Schedule streaming
-   [ ] Toggle live status
-   [ ] Live stream UI admin panel
-   [ ] Public streaming page
-   [ ] Embed video player
-   [ ] Integration tests

**Dependencies**: US-007

---

## Epic 10: Security & Audit

### US-033: Comprehensive Audit Logging

**Priority**: P0
**Points**: 8
**Sprint**: 13

**As a** system administrator
**I want** all sensitive actions logged
**So that** accountability is maintained

**Acceptance Criteria**:

-   [ ] Audit log for all CRUD operations
-   [ ] Track user, timestamp, IP, action
-   [ ] Payment logging
-   [ ] Permission change logging
-   [ ] Login/logout logging
-   [ ] Audit log viewer (admin only)
-   [ ] Search and filter logs
-   [ ] Export logs
-   [ ] 7-year retention policy

**Dependencies**: All previous stories

---

### US-034: Security Hardening

**Priority**: P0
**Points**: 13
**Sprint**: 13

**As a** security officer
**I want** the system secured
**So that** data is protected

**Acceptance Criteria**:

-   [ ] Rate limiting on all APIs
-   [ ] CSRF protection
-   [ ] XSS prevention
-   [ ] SQL injection prevention (via Prisma)
-   [ ] Input sanitization
-   [ ] Secure headers configured
-   [ ] Security audit completed
-   [ ] Penetration test passed
-   [ ] Vulnerabilities remediated
-   [ ] Security documentation

**Dependencies**: All previous stories

---

## Epic 11: Testing & Quality

### US-035: Unit Test Coverage

**Priority**: P1
**Points**: 13
**Sprint**: 13-14

**As a** developer
**I want** comprehensive unit tests
**So that** code quality is maintained

**Acceptance Criteria**:

-   [ ] 80%+ code coverage
-   [ ] All API endpoints tested
-   [ ] All utility functions tested
-   [ ] All business logic tested
-   [ ] Edge cases covered
-   [ ] Test documentation
-   [ ] Coverage report generated

**Dependencies**: All feature stories

---

### US-036: Integration Testing

**Priority**: P1
**Points**: 8
**Sprint**: 14

**As a** QA engineer
**I want** integration tests
**So that** components work together

**Acceptance Criteria**:

-   [ ] API integration tests
-   [ ] Database integration tests
-   [ ] Auth flow tests
-   [ ] Payment flow tests
-   [ ] End-to-end critical paths
-   [ ] Test data fixtures
-   [ ] CI integration

**Dependencies**: All feature stories

---

### US-037: Performance Testing

**Priority**: P1
**Points**: 8
**Sprint**: 14

**As a** DevOps engineer
**I want** performance benchmarks
**So that** system meets SLAs

**Acceptance Criteria**:

-   [ ] Load testing (1000 concurrent users)
-   [ ] Stress testing
-   [ ] Database query optimization
-   [ ] API response time < 500ms
-   [ ] Page load time < 2s
-   [ ] Performance report
-   [ ] Optimization recommendations

**Dependencies**: All feature stories

---

## Epic 12: Deployment & Documentation

### US-038: Production Infrastructure Setup

**Priority**: P0
**Points**: 13
**Sprint**: 15

**As a** DevOps engineer
**I want** production environment configured
**So that** the system can go live

**Acceptance Criteria**:

-   [ ] Production database (RDS)
-   [ ] Next.js deployment (Vercel/AWS)
-   [ ] CDN configured
-   [ ] SSL certificates
-   [ ] Domain configured
-   [ ] Monitoring tools (Sentry)
-   [ ] Log aggregation
-   [ ] Backup strategy
-   [ ] Disaster recovery plan
-   [ ] Infrastructure documented

---

### US-039: User Documentation

**Priority**: P1
**Points**: 8
**Sprint**: 15

**As a** end user
**I want** comprehensive documentation
**So that** I can use the system effectively

**Acceptance Criteria**:

-   [ ] User guide for each role
-   [ ] Feature tutorials
-   [ ] Video walkthroughs
-   [ ] FAQ section
-   [ ] Troubleshooting guide
-   [ ] Screenshots and examples
-   [ ] Searchable help center
-   [ ] PDF export

---

### US-040: Admin & API Documentation

**Priority**: P1
**Points**: 5
**Sprint**: 15

**As a** administrator/developer
**I want** technical documentation
**So that** I can administer and extend the system

**Acceptance Criteria**:

-   [ ] Admin guide
-   [ ] API documentation (OpenAPI/Swagger)
-   [ ] Database schema documentation
-   [ ] Deployment runbook
-   [ ] Configuration guide
-   [ ] Security best practices
-   [ ] Backup/restore procedures

---

## Epic 13: Launch & Training

### US-041: Pilot Parish Onboarding

**Priority**: P0
**Points**: 13
**Sprint**: 16

**As a** project manager
**I want** pilot parishes onboarded
**So that** real-world testing occurs

**Acceptance Criteria**:

-   [ ] 3 pilot parishes identified
-   [ ] Data migration completed
-   [ ] User accounts created
-   [ ] Training sessions conducted
-   [ ] Support channels established
-   [ ] Feedback collection process
-   [ ] Success metrics tracking

---

### US-042: Training Materials

**Priority**: P1
**Points**: 8
**Sprint**: 16

**As a** trainer
**I want** training materials
**So that** users can learn the system

**Acceptance Criteria**:

-   [ ] Training presentation deck
-   [ ] Hands-on exercises
-   [ ] Quick start guides
-   [ ] Video tutorials
-   [ ] Cheat sheets
-   [ ] Role-specific guides
-   [ ] Q&A document

---

## Future Enhancements (Post-Launch)

### US-043: Mobile Applications

**Priority**: P3
**Points**: 21+

Native iOS and Android applications for parishioners

---

### US-044: SMS Notifications

**Priority**: P3
**Points**: 13

Automated SMS for appointments, events, and announcements

---

### US-045: Advanced Analytics

**Priority**: P3
**Points**: 21+

Business intelligence dashboards and predictive analytics

---

### US-046: Multi-language Support

**Priority**: P3
**Points**: 13

Internationalization for multiple languages

---

### US-047: Payment Gateway Integration

**Priority**: P3
**Points**: 13

Paystack, Flutterwave for online giving

---

### US-048: Recurring Donations

**Priority**: P3
**Points**: 13

Automated monthly/weekly giving

---

### US-049: Volunteer Management

**Priority**: P3
**Points**: 21+

Schedule and track volunteer activities

---

### US-050: Asset Management

**Priority**: P3
**Points**: 13

Track church assets and inventory

---

## Backlog Metrics

### Total Story Points (v1.0 Launch)

-   **Epic 1-2**: 51 points
-   **Epic 3-4**: 84 points
-   **Epic 5**: 91 points
-   **Epic 6-7**: 63 points
-   **Epic 8-9**: 54 points
-   **Epic 10-11**: 50 points
-   **Epic 12-13**: 47 points

**Total: 440 story points**

### Estimated Timeline

-   **Team Velocity**: ~30 points/sprint (estimated)
-   **Number of Sprints**: 15-16 sprints
-   **Duration**: 30-32 weeks (including buffer)

---

## Notes

1. **Story point estimates** are initial and will be refined during sprint planning
2. **Dependencies** must be completed before starting dependent stories
3. **Priority** may shift based on stakeholder feedback
4. **All stories** require acceptance criteria to be met before marking as "Done"
5. **Security stories** (US-033, US-034) are non-negotiable for launch

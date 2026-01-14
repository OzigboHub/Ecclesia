# Epic 08: Live Streaming

**Epic ID:** EPIC-08
**Priority:** P3 (Low)
**Status:** To Do
**PRD Reference:** Section 3.8

---

## Epic Overview

This epic covers the live streaming functionality for masses and parish events. Includes integration with streaming platforms (YouTube, Facebook Live), stream scheduling, embed management, and viewer engagement features.

---

## Features

### Feature 8.1: Stream Configuration

### Feature 8.2: Stream Scheduling

### Feature 8.3: Stream Playback

### Feature 8.4: Analytics and Engagement

---

## User Stories

### Feature 8.1: Stream Configuration

#### US-08-001: Configure Streaming Platform

**As a** Parish Admin
**I want to** configure streaming platform integration
**So that** live streams can be embedded on our site

**Acceptance Criteria:**

-   [ ] Select platform (YouTube, Facebook, Custom)
-   [ ] Enter channel ID or page ID
-   [ ] Test connection
-   [ ] Save platform credentials
-   [ ] Enable/disable streaming feature

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-LS-001

---

#### US-08-002: Add YouTube Channel Integration

**As a** Parish Admin
**I want to** connect our YouTube channel
**So that** YouTube streams appear on our site

**Acceptance Criteria:**

-   [ ] Enter YouTube channel ID
-   [ ] Validate channel exists
-   [ ] Auto-detect live streams
-   [ ] Embed player configuration
-   [ ] API key configuration (optional)

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-LS-001

---

#### US-08-003: Add Facebook Live Integration

**As a** Parish Admin
**I want to** connect our Facebook page
**So that** Facebook streams appear on our site

**Acceptance Criteria:**

-   [ ] Enter Facebook page ID
-   [ ] Connect with Facebook OAuth
-   [ ] Auto-detect live streams
-   [ ] Embed player configuration
-   [ ] Privacy settings consideration

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-LS-001

---

#### US-08-004: Configure Custom RTMP Stream

**As a** Parish Admin
**I want to** use custom streaming setup
**So that** we have flexibility in streaming options

**Acceptance Criteria:**

-   [ ] Enter stream URL (HLS/RTMP)
-   [ ] Test stream playback
-   [ ] Custom player configuration
-   [ ] Fallback URL (optional)
-   [ ] Stream quality settings

**Priority:** P3
**Story Points:** 5
**PRD Ref:** FR-LS-001

---

### Feature 8.2: Stream Scheduling

#### US-08-005: Schedule Upcoming Stream

**As a** Parish Staff
**I want to** schedule upcoming streams
**So that** parishioners know when to watch

**Acceptance Criteria:**

-   [ ] Set stream title
-   [ ] Set date and time
-   [ ] Add description
-   [ ] Select type (Mass, Event, etc.)
-   [ ] Add stream URL or video ID
-   [ ] Set reminder notification time

**Priority:** P1
**Story Points:** 5
**PRD Ref:** FR-LS-002

---

#### US-08-006: View Scheduled Streams

**As a** Parishioner
**I want to** see upcoming scheduled streams
**So that** I can plan to watch

**Acceptance Criteria:**

-   [ ] List of upcoming streams
-   [ ] Shows date, time, title
-   [ ] Shows stream type
-   [ ] Countdown to next stream
-   [ ] Calendar view option

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-LS-002

---

#### US-08-007: Edit Scheduled Stream

**As a** Parish Staff
**I want to** edit stream schedules
**So that** changes are reflected

**Acceptance Criteria:**

-   [ ] Edit title and description
-   [ ] Change date/time
-   [ ] Update stream URL
-   [ ] Send notification of change (optional)
-   [ ] Audit log of changes

**Priority:** P1
**Story Points:** 3
**PRD Ref:** FR-LS-002

---

#### US-08-008: Cancel Scheduled Stream

**As a** Parish Staff
**I want to** cancel streams
**So that** viewers aren't confused

**Acceptance Criteria:**

-   [ ] Cancel with confirmation
-   [ ] Reason for cancellation (optional)
-   [ ] Notify scheduled viewers
-   [ ] Mark as cancelled (not delete)

**Priority:** P1
**Story Points:** 2
**PRD Ref:** FR-LS-002

---

#### US-08-009: Recurring Stream Schedule

**As a** Parish Admin
**I want to** set up recurring streams
**So that** weekly masses auto-schedule

**Acceptance Criteria:**

-   [ ] Set recurrence pattern (weekly, etc.)
-   [ ] Select days of week
-   [ ] Set time
-   [ ] Auto-generate schedule entries
-   [ ] Can edit individual instances

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-LS-002

---

### Feature 8.3: Stream Playback

#### US-08-010: Watch Live Stream on Website

**As a** Parishioner
**I want to** watch live streams on the parish website
**So that** I can participate in Mass remotely

**Acceptance Criteria:**

-   [ ] Embedded video player
-   [ ] Full-screen option
-   [ ] Volume controls
-   [ ] Stream quality selection (if available)
-   [ ] Mobile-responsive player

**Priority:** P0
**Story Points:** 5
**PRD Ref:** FR-LS-003

---

#### US-08-011: Auto-Detect Live Stream

**As a** System
**I want to** automatically detect when stream is live
**So that** viewers see current content

**Acceptance Criteria:**

-   [ ] Check platform API for live status
-   [ ] Display "LIVE" indicator
-   [ ] Switch from schedule to player when live
-   [ ] Update status periodically
-   [ ] Handle stream end gracefully

**Priority:** P1
**Story Points:** 8
**PRD Ref:** FR-LS-003

---

#### US-08-012: Display Countdown to Next Stream

**As a** Parishioner
**I want to** see when the next stream starts
**So that** I know when to return

**Acceptance Criteria:**

-   [ ] Countdown timer displayed
-   [ ] Shows next scheduled stream
-   [ ] Updates in real-time
-   [ ] Provides notification option
-   [ ] Switches to player when live

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-LS-002

---

#### US-08-013: Watch Past Streams (Archive)

**As a** Parishioner
**I want to** watch past recorded streams
**So that** I can catch up on missed content

**Acceptance Criteria:**

-   [ ] List of past streams
-   [ ] Video playback
-   [ ] Search/filter past streams
-   [ ] Sorted by date (newest first)
-   [ ] Links to YouTube/Facebook archive

**Priority:** P2
**Story Points:** 5
**PRD Ref:** FR-LS-004

---

#### US-08-014: Add Past Stream to Archive

**As a** Parish Staff
**I want to** add recorded videos to archive
**So that** parishioners can watch later

**Acceptance Criteria:**

-   [ ] Add video URL (YouTube, Facebook, etc.)
-   [ ] Set title and date
-   [ ] Add description
-   [ ] Categorize (Mass, Event, etc.)
-   [ ] Auto-import from channel (optional)

**Priority:** P2
**Story Points:** 3
**PRD Ref:** FR-LS-004

---

### Feature 8.4: Analytics and Engagement

#### US-08-015: View Stream Analytics

**As a** Parish Admin
**I want to** see stream viewership statistics
**So that** I can understand engagement

**Acceptance Criteria:**

-   [ ] Total viewers (live peak)
-   [ ] Watch time
-   [ ] Platform breakdown
-   [ ] Historical comparison
-   [ ] Geographic data (if available)

**Priority:** P3
**Story Points:** 5
**PRD Ref:** FR-LS-001

---

#### US-08-016: Request Stream Reminder Notification

**As a** Parishioner
**I want to** be notified when stream starts
**So that** I don't miss it

**Acceptance Criteria:**

-   [ ] Subscribe to reminder
-   [ ] Choose notification method (email/SMS)
-   [ ] Notification before stream starts
-   [ ] One-click access to stream
-   [ ] Unsubscribe option

**Priority:** P3
**Story Points:** 5
**PRD Ref:** FR-LS-002

---

#### US-08-017: Display Live Viewer Count

**As a** Parishioner
**I want to** see how many are watching
**So that** I feel part of a community

**Acceptance Criteria:**

-   [ ] Live viewer count displayed
-   [ ] Updates periodically
-   [ ] From platform API
-   [ ] Graceful fallback if unavailable

**Priority:** P3
**Story Points:** 3
**PRD Ref:** FR-LS-003

---

#### US-08-018: Quick Access to Live Stream from Dashboard

**As a** Parishioner
**I want to** quickly access live stream from my dashboard
**So that** I can join easily

**Acceptance Criteria:**

-   [ ] "Watch Live" button when stream active
-   [ ] Visible indicator of live status
-   [ ] One-click to stream page
-   [ ] Shows in sidebar/header

**Priority:** P2
**Story Points:** 2
**PRD Ref:** FR-LS-003

---

## Technical Notes

### Streaming Platforms

-   **YouTube**: Most common, good API support
-   **Facebook Live**: Popular for engagement
-   **Custom RTMP/HLS**: For parishes with their own streaming setup

### Feature Toggle Integration

-   Check `enableLiveStreaming` before all operations
-   This feature is disabled by default
-   Requires explicit enablement by Parish Admin

### API Integrations

-   YouTube Data API v3
-   Facebook Graph API (for page posts)
-   Optional: WebSocket for real-time updates

### Database Schema

```prisma
model LiveStream {
  id              String          @id @default(uuid())
  title           String
  description     String?
  type            LiveStreamType  @default(MASS)
  status          StreamStatus    @default(SCHEDULED)

  // Schedule
  scheduledAt     DateTime
  startedAt       DateTime?
  endedAt         DateTime?

  // Stream source
  platform        StreamPlatform
  streamUrl       String?
  videoId         String?         // YouTube video ID, FB post ID
  embedHtml       String?         // Generated embed code

  // Stats
  peakViewers     Int?
  totalViews      Int?

  organizationId  String
  organization    Organization    @relation(...)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

model StreamConfig {
  id              String          @id @default(uuid())
  platform        StreamPlatform
  channelId       String?
  pageId          String?
  apiKey          String?         // Encrypted
  accessToken     String?         // Encrypted
  isActive        Boolean         @default(true)

  organizationId  String          @unique
  organization    Organization    @relation(...)

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum LiveStreamType {
  MASS
  ADORATION
  NOVENA
  ROSARY
  LECTURE
  EVENT
  OTHER
}

enum StreamStatus {
  SCHEDULED
  LIVE
  ENDED
  CANCELLED
}

enum StreamPlatform {
  YOUTUBE
  FACEBOOK
  CUSTOM
  OTHER
}
```

### Files to Create/Modify

-   `app/dashboard/live-streams/page.tsx` - Management view
-   `app/dashboard/live-streams/new/page.tsx` - Schedule stream
-   `app/dashboard/live-streams/settings/page.tsx` - Platform config
-   `app/live/page.tsx` - Public stream view
-   `app/live/archive/page.tsx` - Past streams
-   `app/actions/live-stream.actions.ts` - Server Actions
-   `components/features/live-stream/video-player.tsx` - Player component
-   `components/features/live-stream/stream-schedule.tsx` - Schedule component
-   `lib/validators/live-stream.schema.ts` - Zod schemas
-   `lib/integrations/youtube.ts` - YouTube API integration
-   `lib/integrations/facebook.ts` - Facebook API integration

---

## Dependencies

-   **EPIC-01**: User Management (authentication)
-   **EPIC-02**: Organization Management (org scoping, feature toggles)
-   **EPIC-11**: Integrations (YouTube/Facebook API)

## Dependent Epics

-   **EPIC-09**: Event Management (stream linked to events)

---

## Estimation Summary

| Story ID  | Story Points |
| --------- | ------------ |
| US-08-001 | 5            |
| US-08-002 | 5            |
| US-08-003 | 5            |
| US-08-004 | 5            |
| US-08-005 | 5            |
| US-08-006 | 3            |
| US-08-007 | 3            |
| US-08-008 | 2            |
| US-08-009 | 5            |
| US-08-010 | 5            |
| US-08-011 | 8            |
| US-08-012 | 3            |
| US-08-013 | 5            |
| US-08-014 | 3            |
| US-08-015 | 5            |
| US-08-016 | 5            |
| US-08-017 | 3            |
| US-08-018 | 2            |
| **Total** | **77**       |

---

## Revision History

| Version | Date       | Author       | Changes          |
| ------- | ---------- | ------------ | ---------------- |
| 1.0     | 2026-01-14 | Product Team | Initial creation |

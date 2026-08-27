import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

function createEcclesiaPDF() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(requiredSpace = 15) {
    if (y + requiredSpace > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter();
    }
  }

  function drawHeaderFooter() {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Ecclesia Digital Parish Manager (DPM) — Features & Test Cases Specification", margin, 8);
    doc.text(`Page ${doc.internal.pages.length - 1}`, pageWidth - margin - 10, pageHeight - 6);
  }

  // ---- COVER / HEADER ----
  // Top decorative bar
  doc.setFillColor(37, 99, 235); // Blue #2563eb
  doc.rect(margin, y, contentWidth, 3, "F");
  y += 8;

  // Badges
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, y, 46, 5.5, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(29, 78, 216);
  doc.text("TECHNICAL SPECIFICATION", margin + 3, y + 3.8);

  doc.roundedRect(margin + 49, y, 42, 5.5, 1.5, 1.5, "FD");
  doc.text("QUALITY ASSURANCE MATRIX", margin + 52, y + 3.8);
  y += 10;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text("Ecclesia Digital Parish Manager (DPM)", margin, y);
  y += 6;

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.text("System Features, Architecture Breakdown & End-to-End Test Cases Matrix", margin, y);
  y += 8;

  // Meta Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

  const colWidth = contentWidth / 4;
  const meta = [
    { label: "VERSION", val: "v1.0 (Production-Ready)" },
    { label: "FRONTEND / STACK", val: "Next.js 16 + React 19" },
    { label: "DATABASE", val: "PostgreSQL + Prisma ORM" },
    { label: "AUTH & SECURITY", val: "NextAuth v5 + 2FA / Passkeys" }
  ];

  meta.forEach((m, idx) => {
    const xPos = margin + idx * colWidth + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);
    doc.text(m.label, xPos, y + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(m.val, xPos, y + 10);
  });
  y += 20;

  // Helper section title
  function addSectionTitle(title) {
    checkPageBreak(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, margin + contentWidth, y);
    y += 6;
  }

  function addSubTitle(sub) {
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text(sub, margin, y);
    y += 5;
  }

  function addBullet(bullet, indent = 4) {
    checkPageBreak(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    
    // Split long lines
    const textLines = doc.splitTextToSize(bullet, contentWidth - indent - 4);
    doc.text("•", margin + indent, y);
    doc.text(textLines, margin + indent + 3.5, y);
    y += textLines.length * 3.8 + 1;
  }

  function addParagraph(text) {
    checkPageBreak(12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 4.2 + 3;
  }

  // --- SECTION 1: ARCHITECTURE OVERVIEW ---
  addSectionTitle("1. System Architecture & High-Level Overview");
  addParagraph("Ecclesia is a multi-tenant Catholic parish management system that unifies administrative operations, sacramental records, financial stewardship, mass scheduling, pastoral appointments, and parishioner engagement into a single high-performance web platform.");

  // Highlight Box
  checkPageBreak(24);
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(2, 132, 199);
  doc.rect(margin, y, contentWidth, 22, "FD");
  doc.setFillColor(2, 132, 199);
  doc.rect(margin, y, 2.5, 22, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(2, 132, 199);
  doc.text("KEY ARCHITECTURAL HIGHLIGHTS:", margin + 5, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text("• Multi-Tenant Hierarchy: Two-level Parish to child Outstations scoping with data segregation.", margin + 5, y + 8.5);
  doc.text("• Step-Up Security Ladder: Multi-tier 2FA (TOTP / Recovery Keys), Passkeys (WebAuthn), and Re-Auth gates.", margin + 5, y + 12.5);
  doc.text("• Modular Feature Engine: 18+ per-organization configurable toggles in OrganizationFeatureSettings.", margin + 5, y + 16.5);
  doc.text("• Integrated Paystack Wallet: Subaccounts, Dedicated Virtual Bank Accounts, online & offline cash ledgering.", margin + 5, y + 20.5);
  y += 28;

  // --- SECTION 2: CORE MODULES ---
  addSectionTitle("2. Core Functional Modules Breakdown");

  addSubTitle("2.1 Multi-Tenant Organization & Hierarchy");
  addBullet("Hierarchical Scoping: Supports top-level Parishes and child Outstations linked via parentId.");
  addBullet("Tenant Scoping: All database access and actions are strictly scoped by session.user.organizationId.");
  addBullet("Inheritance & Roll-ups: Parish Admins view aggregate analytics across outstations; Outstation Admins stay isolated.");

  addSubTitle("2.2 Role-Based Access Control (RBAC) & Security Ladder");
  addBullet("8 User Roles: SUPER_ADMIN, DIOCESE_ADMIN, DEANERY_ADMIN, PARISH_ADMIN, PARISH_SECRETARY, PARISH_STAFF, SOCIETY_PRESIDENT, PARISHIONER.");
  addBullet("Two-Factor Authentication (2FA): TOTP authenticator app support with encrypted single-use recovery codes.");
  addBullet("WebAuthn / Passkeys: Modern passwordless biometric login support across mobile and desktop browsers.");
  addBullet("Step-Up Re-Auth Gates: Critical mutations (updating bank payouts, role promotions) demand password/passkey re-auth.");
  addBullet("Parish Gate Code (/gate/[parishId]): Optional PIN gate to restrict public timelines for private parishes.");

  addSubTitle("2.3 Parishioner Registry & Sacramental Tracking");
  addBullet("Parishioner Directory: Contact details, outstation affiliation, occupation tags, and family groupings.");
  addBullet("Batch CSV Import: High-throughput member onboarding with phone normalization (E.164) and validation.");
  addBullet("Sacramental Logbooks: Baptism, First Holy Communion, Confirmation, Marriage, and Holy Orders tracking.");
  addBullet("Certificate Generation: Automated PDF certificate generation with official parish headers and folios.");

  addSubTitle("2.4 Liturgical Mass Management & Mass Intentions");
  addBullet("Recurring Mass Schedule Templates: Weekday morning, evening, and multiple Sunday Mass schedules.");
  addBullet("Automated Mass Generator: Auto-creates Mass instances up to 90 days in advance with capacity quotas.");
  addBullet("Mass Intention Booking: Online and offline booking for Thanksgiving, Repose of the Soul, and Special Intentions.");
  addBullet("Stipend Accounting & Quotas: Paystack card/USSD payments or manual cash marking with per-mass intention limits.");
  addBullet("Priest Mass Bulletin: Formatted printable sheet of booked intentions for the altar and liturgical ministers.");

  addSubTitle("2.5 Financial Management & Paystack Wallet Integration");
  addBullet("Chart of Accounts: Tithes, Collections, Thanksgiving, Harvest, Building Projects, Mass Stipends, Society Dues.");
  addBullet("Paystack Subaccount & DVA: Automated split payouts, Dedicated Virtual Accounts (DVA) per parish, instant receipts.");
  addBullet("Cash Collections: Physical cash count entry with envelope numbers and counter sign-offs.");
  addBullet("Withdrawal Requests: Multi-step approval workflow to disburse parish wallet balances to verified commercial bank accounts.");

  addSubTitle("2.6 Pastoral Appointments & Confessions");
  addBullet("Priest Availability Schedule: Recurring weekly availability slots and blackout dates (retreats, conferences).");
  addBullet("Booking Flow: Parishioners book pastoral direction, confessions, infant baptism prep, or general inquiries.");
  addBullet("Status Lifecycle: PENDING -> APPROVED / REJECTED -> COMPLETED / CANCELLED with instant notifications.");

  addSubTitle("2.7 Societies & Pious Associations");
  addBullet("Society Directory: Sacred Heart, CWO, CMO, CYON, Legion of Mary, St. Vincent de Paul, Choir, etc.");
  addBullet("Executive Governance: Role assignments for President, Secretary, Financial Secretary, and Treasurer.");
  addBullet("Dues Tracking & Arrears: Automated monthly dues schedules, payment receipts, and arrears defaulter lists.");

  addSubTitle("2.8 Public Parish Feed & Mobile Giving (/feed, /give, /me)");
  addBullet("Parish Timeline: Pinned announcements, saint reflections, liturgical calendar notices, and embedded live streams.");
  addBullet("Quick Giving (/give): Mobile-optimized giving flow via Card, USSD, or Bank Transfer.");
  addBullet("Member Portal (/me): Self-service giving receipts, booked mass intentions, appointments, and active sessions.");

  // --- SECTION 3: TEST MATRIX TABLE ---
  addSectionTitle("3. Comprehensive Test Cases & Verification Matrix");

  function drawTestTable(categoryTitle, tests) {
    checkPageBreak(25);
    addSubTitle(categoryTitle);

    const startX = margin;
    const colW = [22, 38, 70, 38, 14]; // sum = 182 = contentWidth
    const headers = ["TEST ID", "SCENARIO", "EXECUTION STEPS", "EXPECTED OUTCOME", "PRIORITY"];

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(startX, y, contentWidth, 6.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);

    let curX = startX;
    headers.forEach((h, i) => {
      doc.text(h, curX + 2, y + 4.5);
      curX += colW[i];
    });
    y += 6.5;

    // Table Rows
    tests.forEach((t, rowIdx) => {
      const stepLines = doc.splitTextToSize(t.steps, colW[2] - 4);
      const outcomeLines = doc.splitTextToSize(t.outcome, colW[3] - 4);
      const rowHeight = Math.max(stepLines.length, outcomeLines.length) * 3.6 + 4.5;

      checkPageBreak(rowHeight + 2);

      // Row background
      if (rowIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX, y, contentWidth, rowHeight, "F");
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(startX, y, contentWidth, rowHeight, "D");

      // ID
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(15, 23, 42);
      doc.text(t.id, startX + 2, y + 4);

      // Scenario
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      const scnLines = doc.splitTextToSize(t.scenario, colW[1] - 4);
      doc.text(scnLines, startX + colW[0] + 2, y + 4);

      // Steps
      doc.text(stepLines, startX + colW[0] + colW[1] + 2, y + 4);

      // Outcome
      doc.text(outcomeLines, startX + colW[0] + colW[1] + colW[2] + 2, y + 4);

      // Priority Badge
      const pX = startX + colW[0] + colW[1] + colW[2] + colW[3] + 2;
      let pBg = [254, 242, 242]; // P0 red
      let pText = [185, 28, 28];
      if (t.priority === "P1") {
        pBg = [255, 251, 235]; // P1 yellow
        pText = [180, 83, 9];
      } else if (t.priority === "P2" || t.priority === "PASS") {
        pBg = [240, 253, 244]; // P2 green
        pText = [21, 128, 61];
      }
      doc.setFillColor(...pBg);
      doc.setDrawColor(...pText);
      doc.roundedRect(pX, y + 1.5, 10, 4.2, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(...pText);
      doc.text(t.priority, pX + 2.2, y + 4.5);

      y += rowHeight;
    });
    y += 4;
  }

  // 3.1 Auth Tests
  drawTestTable("3.1 Authentication, RBAC & Security Ladder", [
    {
      id: "TC-AUTH-01",
      scenario: "Standard Email Login",
      steps: "1. Open /auth/login\n2. Submit valid credentials",
      outcome: "Session created; redirect to role dashboard/feed",
      priority: "P0"
    },
    {
      id: "TC-AUTH-02",
      scenario: "TOTP 2FA Verification",
      steps: "1. Login on 2FA account\n2. Enter valid 6-digit TOTP",
      outcome: "Session flag set to twoFactorVerified: true",
      priority: "P0"
    },
    {
      id: "TC-AUTH-03",
      scenario: "2FA Recovery Code Flow",
      steps: "1. Click 'Use recovery code'\n2. Enter valid backup key",
      outcome: "Code consumed; session unlocked with regen notice",
      priority: "P0"
    },
    {
      id: "TC-AUTH-04",
      scenario: "RBAC Boundary Isolation",
      steps: "1. Log in as PARISH_STAFF\n2. Attempt admin API route",
      outcome: "HTTP 403 Forbidden / redirect to unauthorized",
      priority: "P0"
    },
    {
      id: "TC-AUTH-05",
      scenario: "Sensitive Action Re-Auth",
      steps: "1. Navigate to Payout Settings\n2. Update bank details",
      outcome: "Step-up modal requires password re-entry",
      priority: "P1"
    },
    {
      id: "TC-AUTH-06",
      scenario: "Session Inactivity Timeout",
      steps: "1. Simulate 24h idle\n2. Request protected resource",
      outcome: "Session revoked; redirected to /auth/login",
      priority: "P1"
    },
    {
      id: "TC-AUTH-07",
      scenario: "Parish Gate PIN Protection",
      steps: "1. Visit gated /feed\n2. Enter wrong & right PIN",
      outcome: "Wrong PIN rejects; correct PIN sets cookie",
      priority: "P1"
    }
  ]);

  // 3.2 Org & Mass Tests
  drawTestTable("3.2 Organization & Mass Scheduling", [
    {
      id: "TC-ORG-01",
      scenario: "Cross-Tenant Data Isolation",
      steps: "1. Create member in Parish A\n2. Query as Parish B Admin",
      outcome: "Parish A member is completely inaccessible to B",
      priority: "P0"
    },
    {
      id: "TC-ORG-02",
      scenario: "Outstation Hierarchy Scope",
      steps: "1. View member list as Parish vs Outstation Admin",
      outcome: "Parish Admin sees aggregate; Outstation sees local",
      priority: "P0"
    },
    {
      id: "TC-MASS-01",
      scenario: "Automated Mass Generation",
      steps: "1. Configure recurring template\n2. Run 30-day generator",
      outcome: "30 mass records created with accurate times & caps",
      priority: "P0"
    },
    {
      id: "TC-MASS-02",
      scenario: "Book Intention with Online Stipend",
      steps: "1. Select Mass on calendar\n2. Pay stipend via Paystack",
      outcome: "Webhook confirms charge; Intention CONFIRMED",
      priority: "P0"
    },
    {
      id: "TC-MASS-03",
      scenario: "Intention Capacity Enforced",
      steps: "1. Attempt booking 6th intention on mass capped at 5",
      outcome: "Blocked: 'Mass Intention Capacity Full'",
      priority: "P1"
    },
    {
      id: "TC-MASS-04",
      scenario: "Priest Mass Sheet Export",
      steps: "1. Open /masses for Sunday\n2. Click 'Export Sheet'",
      outcome: "PDF bulletin generated grouping intentions by mass",
      priority: "P2"
    }
  ]);

  // 3.3 Financial Tests
  drawTestTable("3.3 Financial Stewardship & Paystack", [
    {
      id: "TC-FIN-01",
      scenario: "Record Offline Collection",
      steps: "1. Open /parish-finances/new\n2. Record Cash NGN 250k",
      outcome: "Ledger updated; monthly analytics incremented",
      priority: "P0"
    },
    {
      id: "TC-FIN-02",
      scenario: "Online Donation via /give",
      steps: "1. Open /give on mobile\n2. Pay NGN 10k via Card",
      outcome: "Paystack charge succeeds; ledger & receipt created",
      priority: "P0"
    },
    {
      id: "TC-FIN-03",
      scenario: "Webhook Idempotency",
      steps: "1. Send duplicate webhook\ncharge.success payload",
      outcome: "Recognized as duplicate; no double ledger credit",
      priority: "P0"
    },
    {
      id: "TC-FIN-04",
      scenario: "Withdrawal Approval Workflow",
      steps: "1. Parish Admin requests withdrawal\n2. Super Admin approves",
      outcome: "Paystack Transfer API pays to verified bank",
      priority: "P1"
    }
  ]);

  // 3.4 Sacraments, Appointments & Societies
  drawTestTable("3.4 Sacraments, Appointments & Societies", [
    {
      id: "TC-PAR-01",
      scenario: "Create Parishioner Record",
      steps: "1. Open /dashboard/parishioners/new\n2. Fill info & submit",
      outcome: "Record stored in DB scoped to current orgId",
      priority: "P0"
    },
    {
      id: "TC-PAR-02",
      scenario: "Batch CSV Member Import",
      steps: "1. Upload 100-row CSV on /parishioners/import",
      outcome: "100 records imported; validation errors logged",
      priority: "P1"
    },
    {
      id: "TC-PAR-03",
      scenario: "Record Baptism & Certificate",
      steps: "1. Fill Baptism details\n2. Click 'Download PDF'",
      outcome: "Record saved; certificate downloaded with seal",
      priority: "P1"
    },
    {
      id: "TC-APT-01",
      scenario: "Priest Appointment Booking",
      steps: "1. Pick Tuesday 10:00 AM slot\n2. Submit purpose",
      outcome: "Appointment in PENDING state; staff notified",
      priority: "P1"
    },
    {
      id: "TC-APT-02",
      scenario: "Approve Appointment Flow",
      steps: "1. Secretary clicks Approve on pending appointment",
      outcome: "Status set to APPROVED; member notified",
      priority: "P1"
    },
    {
      id: "TC-SOC-01",
      scenario: "Society Executive Setup",
      steps: "1. Create Society 'CWO'\n2. Designate President/Sec",
      outcome: "Society created; members receive society admin rights",
      priority: "P1"
    },
    {
      id: "TC-SOC-02",
      scenario: "Society Dues & Arrears",
      steps: "1. Set dues = NGN 1,000\n2. Record member payments",
      outcome: "Paid members show 0 arrears; defaulters flagged",
      priority: "P2"
    }
  ]);

  // 3.5 Non-Functional
  drawTestTable("3.5 Non-Functional, Accessibility & Performance", [
    {
      id: "TC-NFR-01",
      scenario: "Accessibility (a11y)",
      steps: "Run automated Playwright @axe-core/playwright audit",
      outcome: "0 critical axe-core violations (WCAG 2.1 AA)",
      priority: "PASS"
    },
    {
      id: "TC-NFR-02",
      scenario: "Mobile Responsiveness",
      steps: "Test fluid layout across 375px - 1920px viewports",
      outcome: "Zero layout breaks or horizontal overflow",
      priority: "PASS"
    },
    {
      id: "TC-NFR-03",
      scenario: "API Rate Limiting",
      steps: "Simulate burst brute-force login and API requests",
      outcome: "5 req/min on login, 60 req/min on standard APIs",
      priority: "PASS"
    },
    {
      id: "TC-NFR-04",
      scenario: "Core Web Vitals",
      steps: "Lighthouse performance run on /feed and /give",
      outcome: "LCP < 2.0s, TTFB < 400ms on broadband",
      priority: "PASS"
    }
  ]);

  // --- SECTION 4: AUTOMATION COMMANDS ---
  addSectionTitle("4. Automated Test Execution Commands");
  
  checkPageBreak(30);
  doc.setFillColor(15, 23, 42); // Dark slate
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, "F");

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.setTextColor(248, 250, 252);
  doc.text("# Run all Playwright E2E test suites", margin + 4, y + 4.5);
  doc.text("pnpm exec playwright test", margin + 4, y + 8);
  doc.text("# Run critical security & authentication test specs", margin + 4, y + 12.5);
  doc.text("pnpm exec playwright test e2e/p0-2fa-login-bug.spec.ts e2e/p1-security-ladder.spec.ts", margin + 4, y + 16);
  doc.text("# Run TypeScript type checks and linting", margin + 4, y + 20);
  doc.text("pnpm tsc --noEmit && pnpm lint", margin + 4, y + 23.5);
  y += 30;

  // Add header & footer to all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Ecclesia Digital Parish Manager (DPM) — Features & Test Cases Specification", margin, 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 14, pageHeight - 6);
  }

  // Save PDF
  const outputDocsPath = path.resolve("docs/Ecclesia_Features_and_Test_Cases.pdf");
  const outputPublicPath = path.resolve("public/Ecclesia_Features_and_Test_Cases.pdf");

  if (!fs.existsSync("docs")) fs.mkdirSync("docs", { recursive: true });
  if (!fs.existsSync("public")) fs.mkdirSync("public", { recursive: true });

  const pdfBytes = doc.output("arraybuffer");
  fs.writeFileSync(outputDocsPath, Buffer.from(pdfBytes));
  fs.writeFileSync(outputPublicPath, Buffer.from(pdfBytes));

  console.log("SUCCESS: Created publication-quality PDF at:");
  console.log("1. " + outputDocsPath);
  console.log("2. " + outputPublicPath);
}

createEcclesiaPDF();

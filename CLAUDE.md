# Aston VIP — Custom ATS (Applicant Tracking System)

## Project Overview

A full-stack, internal Applicant Tracking System built for Aston VIP (aston.ae). Applications are submitted via an Elementor form on the Aston WordPress site, routed through Make.com, and ingested into this system via webhook. The system manages the full hiring pipeline — AI-powered CV scoring, candidate communication, stage tracking, and internal team collaboration.

This is an internal tool. There is no public-facing UI — only the Aston HR team uses this dashboard.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | Auth.js v5 (NextAuth beta) |
| File Storage | Vercel Blob (CV/document storage) |
| AI — CV Scoring | OpenAI GPT-4o (`openai` npm package) |
| CV Text Extraction | `pdf-parse` (Node.js) |
| Email | Resend (`resend` npm package) |
| Styling | Tailwind CSS + shadcn/ui |
| Deployment | Vercel |

---

## Environment Variables

```env
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Vercel Blob
BLOB_READ_WRITE_TOKEN=

# OpenAI
OPENAI_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=careers@aston.ae

# Webhook Security
WEBHOOK_SECRET=
```

---

## Folder Structure

```
/app
  /api
    /webhooks
      /application        ← Make.com posts here
    /applications         ← CRUD for applications
    /jobs                 ← CRUD for job openings
    /auth                 ← Auth.js handlers
  /(dashboard)
    /layout.tsx           ← Protected layout (auth guard)
    /page.tsx             ← Dashboard home / analytics
    /jobs
      /page.tsx           ← Job openings list
      /[id]/page.tsx      ← Single job + its applications
      /new/page.tsx       ← Create job opening
    /applications
      /page.tsx           ← All applications (filterable)
      /[id]/page.tsx      ← Single applicant detail view
    /pipeline
      /page.tsx           ← Kanban board view
    /settings
      /page.tsx           ← Email templates, team users

/components
  /ui                     ← shadcn/ui primitives
  /applications           ← Application-specific components
  /jobs                   ← Job-specific components
  /pipeline               ← Kanban components
  /email                  ← Email template components (React Email)

/lib
  /prisma.ts              ← Prisma client singleton
  /openai.ts              ← OpenAI client
  /resend.ts              ← Resend client
  /blob.ts                ← Vercel Blob helpers
  /cv-parser.ts           ← pdf-parse wrapper → plain text
  /ai-scorer.ts           ← GPT-4o scoring logic
  /email-sender.ts        ← Trigger emails by stage

/prisma
  /schema.prisma

/emails                   ← React Email templates
  /application-received.tsx
  /under-review.tsx
  /shortlisted.tsx
  /interview-invite.tsx
  /offer.tsx
  /rejected.tsx
```

---

## Prisma Schema

```prisma
model User {
  id           String        @id @default(cuid())
  name         String
  email        String        @unique
  role         UserRole      @default(VIEWER)
  department   String?
  createdAt    DateTime      @default(now())
  notes        Note[]
  stageChanges StageHistory[]
}

enum UserRole {
  ADMIN
  HR_MANAGER
  INTERVIEWER
  VIEWER
}

model JobOpening {
  id              String        @id @default(cuid())
  wpJobOpeningId  String        @unique   // hidden field from Elementor
  title           String
  department      String?
  location        String?
  description     String        @db.Text
  requirements    String        @db.Text
  status          JobStatus     @default(OPEN)
  createdAt       DateTime      @default(now())
  closesAt        DateTime?
  applications    Application[]
}

enum JobStatus {
  DRAFT
  OPEN
  CLOSED
  PAUSED
}

model Applicant {
  id           String        @id @default(cuid())
  firstName    String
  lastName     String
  email        String
  phone        String?
  createdAt    DateTime      @default(now())
  applications Application[]
}

model Application {
  id               String          @id @default(cuid())
  applicantId      String
  applicant        Applicant       @relation(fields: [applicantId], references: [id])
  jobOpeningId     String
  jobOpening       JobOpening      @relation(fields: [jobOpeningId], references: [id])
  currentStage     ApplicationStage @default(APPLIED)
  cvUrl            String          // Vercel Blob URL
  gdprConsent      Boolean         @default(false)
  gdprConsentedAt  DateTime?
  source           String          @default("elementor_form")
  makePayload      Json?           // raw Make.com webhook payload
  createdAt        DateTime        @default(now())
  updatedAt        DateTime        @updatedAt
  aiEvaluation     AIEvaluation?
  stageHistory     StageHistory[]
  emailLogs        EmailLog[]
  notes            Note[]

  @@unique([applicantId, jobOpeningId]) // prevent duplicate applications
}

enum ApplicationStage {
  APPLIED
  SCREENING
  SHORTLISTED
  INTERVIEW
  OFFER
  HIRED
  REJECTED
}

model AIEvaluation {
  id                   String      @id @default(cuid())
  applicationId        String      @unique
  application          Application @relation(fields: [applicationId], references: [id])
  score                Int         // 1–10
  recommendation       AIRecommendation
  summary              String      @db.Text
  strengths            String[]
  weaknesses           String[]
  skillsMatchScore     Int         // 1–10
  experienceMatchScore Int         // 1–10
  redFlags             String[]
  rawResponse          Json        // full GPT response stored for audit
  evaluatedAt          DateTime    @default(now())
}

enum AIRecommendation {
  STRONG_YES
  YES
  MAYBE
  NO
  STRONG_NO
}

model StageHistory {
  id            String           @id @default(cuid())
  applicationId String
  application   Application      @relation(fields: [applicationId], references: [id])
  fromStage     ApplicationStage?
  toStage       ApplicationStage
  changedById   String?
  changedBy     User?            @relation(fields: [changedById], references: [id])
  note          String?
  changedAt     DateTime         @default(now())
}

model EmailLog {
  id              String      @id @default(cuid())
  applicationId   String
  application     Application @relation(fields: [applicationId], references: [id])
  templateUsed    String
  subject         String
  sentTo          String
  sentAt          DateTime    @default(now())
  status          String      @default("sent")
  resendMessageId String?
}

model Note {
  id            String      @id @default(cuid())
  applicationId String
  application   Application @relation(fields: [applicationId], references: [id])
  authorId      String
  author        User        @relation(fields: [authorId], references: [id])
  body          String      @db.Text
  isPrivate     Boolean     @default(false)
  createdAt     DateTime    @default(now())
}
```

---

## Webhook Endpoint: POST /api/webhooks/application

### Purpose
Receives all new applications from Make.com after it processes the Elementor form submission.

### Expected Payload
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+971501234567",
  "email": "john@example.com",
  "legal": true,
  "job_opening_id": "wp_123",
  "cv_url": "https://blob.vercel-storage.com/cv-john-doe.pdf"
}
```

### Processing Logic
1. Validate `WEBHOOK_SECRET` header — reject if missing or wrong
2. If `legal !== true` → return 400, do NOT store any data (GDPR)
3. Look up `JobOpening` by `wpJobOpeningId` — return 404 if not found
4. Upsert `Applicant` by email (one person can apply to multiple jobs)
5. Check for duplicate `Application` (same applicant + same job) — return 409 if exists
6. Create `Application` record with `currentStage: APPLIED`
7. Create initial `StageHistory` entry
8. Trigger background jobs (do not await — return 200 immediately):
   - **AI Evaluation**: extract CV text → score with GPT-4o → save `AIEvaluation`
   - **Email**: send "Application Received" email via Resend
9. Return `{ success: true, applicationId }`

---

## AI Scoring: lib/ai-scorer.ts

### CV Text Extraction
Use `pdf-parse` to extract plain text from the PDF stored in Vercel Blob.

```ts
import pdfParse from 'pdf-parse';

export async function extractCvText(cvUrl: string): Promise<string> {
  const response = await fetch(cvUrl);
  const buffer = await response.arrayBuffer();
  const data = await pdfParse(Buffer.from(buffer));
  return data.text;
}
```

### GPT-4o Scoring Prompt

System prompt:
```
You are a senior recruiter at Aston VIP, an international corporate advisory firm specialising in UAE business setup, free zone licensing, and corporate structuring. You evaluate CVs against job descriptions with precision and professionalism.

Always respond with valid JSON only. No preamble, no markdown, no explanation outside the JSON.
```

User prompt:
```
Evaluate this candidate for the following role.

JOB TITLE: {jobTitle}
JOB REQUIREMENTS: {jobRequirements}
JOB DESCRIPTION: {jobDescription}

CANDIDATE CV:
{cvText}

Return a JSON object with exactly these fields:
{
  "score": <integer 1-10>,
  "recommendation": <"STRONG_YES" | "YES" | "MAYBE" | "NO" | "STRONG_NO">,
  "summary": <2-3 sentence summary of fit>,
  "strengths": [<array of strings>],
  "weaknesses": [<array of strings>],
  "skillsMatchScore": <integer 1-10>,
  "experienceMatchScore": <integer 1-10>,
  "redFlags": [<array of strings, empty if none>]
}
```

Use `response_format: { type: "json_object" }` in the OpenAI call.

---

## Email Triggers by Stage

| Stage transition | Template | Subject |
|---|---|---|
| Application created | `application-received` | "We've received your application — Aston VIP" |
| APPLIED → SCREENING | `under-review` | "Your application is under review — Aston VIP" |
| SCREENING → SHORTLISTED | `shortlisted` | "Great news — you've been shortlisted" |
| SHORTLISTED → INTERVIEW | `interview-invite` | "Interview Invitation — Aston VIP" |
| Any → OFFER | `offer` | "An offer from Aston VIP" |
| Any → REJECTED | `rejected` | "Your application — Aston VIP" |

All emails are sent from `careers@aston.ae` via Resend.
All emails are triggered from `lib/email-sender.ts` which maps stage → template → Resend call.

---

## Role Permissions

| Action | ADMIN | HR_MANAGER | INTERVIEWER | VIEWER |
|---|---|---|---|---|
| Create/edit job openings | ✅ | ✅ | ❌ | ❌ |
| View all applications | ✅ | ✅ | ✅ (assigned only) | ✅ |
| Move pipeline stages | ✅ | ✅ | ❌ | ❌ |
| Send emails manually | ✅ | ✅ | ❌ | ❌ |
| Add notes | ✅ | ✅ | ✅ | ❌ |
| View AI scores | ✅ | ✅ | ✅ | ✅ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Delete applications | ✅ | ❌ | ❌ | ❌ |

---

## Build Phases

### Phase 1 — Foundation
- [ ] Next.js 14 project init with TypeScript + Tailwind + shadcn/ui
- [ ] Prisma setup + PostgreSQL connection + schema migration
- [ ] Auth.js v5 with credential/email login
- [ ] Protected dashboard layout with role-based route guards
- [ ] Job Openings CRUD (create, edit, open/close/pause)
- [ ] Webhook endpoint `/api/webhooks/application` (full processing logic)
- [ ] Basic applications list view per job

### Phase 2 — AI & Email
- [ ] `lib/cv-parser.ts` — pdf-parse CV text extraction
- [ ] `lib/ai-scorer.ts` — GPT-4o scoring with structured JSON output
- [ ] Background evaluation trigger on webhook receipt
- [ ] `AIEvaluation` record storage + display on applicant detail page
- [ ] Resend integration + React Email templates (all 6 templates)
- [ ] Auto-send "Application Received" on webhook
- [ ] Email trigger on every stage change

### Phase 3 — Pipeline & Collaboration
- [ ] Kanban board view (`/pipeline`) — drag-and-drop across stages
- [ ] Stage history + activity timeline on applicant detail
- [ ] Internal notes (public / private toggle)
- [ ] Bulk actions (select multiple → move stage or send email)
- [ ] Duplicate detection (flag same email + same job)

### Phase 4 — Communication & Scheduling
- [ ] Editable email templates in `/settings`
- [ ] Manual "send email" button on applicant detail (choose template)
- [ ] Interview date/time scheduling field + calendar invite email

### Phase 5 — Analytics & Compliance
- [ ] Analytics dashboard (applications over time, stage conversion, AI score distribution)
- [ ] In-app CV PDF preview (no download required)
- [ ] GDPR data retention: scheduled job to purge rejected applicant data after 6 months
- [ ] WordPress job sync (optional: auto-pull job title/description from WP REST API by `wp_job_opening_id`)

---

## Coding Conventions

- All server actions and API routes must be `async` and wrapped in try/catch
- Prisma client imported from `lib/prisma.ts` singleton only
- Never expose raw database errors to the client — map to safe error messages
- All webhook responses return within 200ms — background jobs must not block the response
- Use `zod` for all incoming webhook and form validation
- Comment all non-obvious logic, especially AI prompt construction and email triggers
- One component per file, colocated with its types
- Use `server components` by default; add `"use client"` only where interactivity requires it

---

## Key Business Rules

1. **No GDPR consent = no data stored.** If `legal !== true` in the webhook payload, reject immediately and store nothing.
2. **Duplicate applications are blocked.** Same applicant email + same job = 409 error returned to Make.com.
3. **AI scoring is non-blocking.** The webhook returns 200 before AI evaluation completes. The evaluation runs in the background.
4. **All stage changes are logged.** Every move through the pipeline creates a `StageHistory` record with the user who made the change.
5. **Email logs are always written.** Whether Resend succeeds or fails, log the attempt in `EmailLog` with status.
6. **Job openings must exist before applications arrive.** The HR team creates the job in the ATS first, which generates the `wpJobOpeningId` to be placed as a hidden field in Elementor.

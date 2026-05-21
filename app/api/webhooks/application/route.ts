import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { scoreApplication } from "@/lib/ai-scorer";
import { sendStageEmailWithLog } from "@/lib/email-sender";

// Zod schema for the incoming Make.com payload
const webhookSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  legal: z.boolean(),
  job_opening_id: z.string().min(1),
  cv_url: z.string().url(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Validate WEBHOOK_SECRET header
    const secret = req.headers.get("x-webhook-secret");
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = webhookSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { first_name, last_name, email, phone, legal, job_opening_id, cv_url } =
      parsed.data;

    // 3. GDPR — do NOT store any data if consent not given
    if (!legal) {
      return NextResponse.json(
        { error: "GDPR consent not provided. Application rejected." },
        { status: 400 }
      );
    }

    // 4. Look up JobOpening by wpJobOpeningId
    const jobOpening = await prisma.jobOpening.findUnique({
      where: { wpJobOpeningId: job_opening_id },
    });

    if (!jobOpening) {
      return NextResponse.json(
        { error: `Job opening not found: ${job_opening_id}` },
        { status: 404 }
      );
    }

    // 5. Upsert Applicant by email (one person, multiple jobs)
    const applicant = await prisma.applicant.upsert({
      where: { email },
      update: {
        firstName: first_name,
        lastName: last_name,
        phone: phone ?? null,
      },
      create: {
        firstName: first_name,
        lastName: last_name,
        email,
        phone: phone ?? null,
      },
    });

    // 6. Check for duplicate application (same applicant + same job)
    const existing = await prisma.application.findUnique({
      where: {
        applicantId_jobOpeningId: {
          applicantId: applicant.id,
          jobOpeningId: jobOpening.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate application", applicationId: existing.id },
        { status: 409 }
      );
    }

    // 7. Create Application record
    const application = await prisma.application.create({
      data: {
        applicantId: applicant.id,
        jobOpeningId: jobOpening.id,
        currentStage: "APPLIED",
        cvUrl: cv_url,
        gdprConsent: true,
        gdprConsentedAt: new Date(),
        source: "elementor_form",
        makePayload: body as never,
      },
    });

    // 8. Create initial StageHistory entry
    await prisma.stageHistory.create({
      data: {
        applicationId: application.id,
        fromStage: null,
        toStage: "APPLIED",
        note: "Application submitted via Elementor form",
      },
    });

    // 9. Background jobs — run after response is sent.
    // `after()` ensures Vercel keeps the function alive until these complete
    // even though the 200 response is already on its way to Make.com.
    after(async () => {
      await Promise.allSettled([
        scoreApplication(application.id),
        sendStageEmailWithLog(application.id, "APPLIED"),
      ]);
    });

    return NextResponse.json(
      { success: true, applicationId: application.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook] Unhandled error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

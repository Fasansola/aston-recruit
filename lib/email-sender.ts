import { render } from "@react-email/render";
import resend from "./resend";
import prisma from "./prisma";
import { ApplicationStage } from "@prisma/client";

// Import all email templates
import ApplicationReceived from "@/emails/application-received";
import UnderReview from "@/emails/under-review";
import Shortlisted from "@/emails/shortlisted";
import InterviewInvite from "@/emails/interview-invite";
import Offer from "@/emails/offer";
import Rejected from "@/emails/rejected";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "careers@aston.ae";

// Map each stage to its email config
const STAGE_EMAIL_MAP: Record<
  ApplicationStage,
  { subject: string; template: string } | null
> = {
  APPLIED: {
    subject: "We've received your application — Aston VIP",
    template: "application-received",
  },
  SCREENING: {
    subject: "Your application is under review — Aston VIP",
    template: "under-review",
  },
  SHORTLISTED: {
    subject: "Great news — you've been shortlisted",
    template: "shortlisted",
  },
  INTERVIEW: {
    subject: "Interview Invitation — Aston VIP",
    template: "interview-invite",
  },
  OFFER: {
    subject: "An offer from Aston VIP",
    template: "offer",
  },
  HIRED: null, // No automated email for HIRED
  REJECTED: {
    subject: "Your application — Aston VIP",
    template: "rejected",
  },
};

/**
 * Send a stage-triggered email for an application.
 * Always writes an EmailLog record — even if the send fails.
 *
 * This function is intended to be called fire-and-forget — it handles
 * its own errors internally.
 */
export async function sendStageEmail(
  applicationId: string,
  stage: ApplicationStage
): Promise<void> {
  const emailConfig = STAGE_EMAIL_MAP[stage];

  // No email configured for this stage
  if (!emailConfig) return;

  let status = "sent";
  let resendMessageId: string | undefined;

  try {
    // 1. Get application with applicant and job info
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        jobOpening: true,
      },
    });

    if (!application) {
      console.error(`[Email Sender] Application not found: ${applicationId}`);
      return;
    }

    const { firstName } = application.applicant;
    const jobTitle = application.jobOpening.title;

    // 2. Render the correct template based on stage
    let html: string;

    switch (stage) {
      case "APPLIED":
        html = await render(ApplicationReceived({ firstName, jobTitle }));
        break;
      case "SCREENING":
        html = await render(UnderReview({ firstName, jobTitle }));
        break;
      case "SHORTLISTED":
        html = await render(Shortlisted({ firstName, jobTitle }));
        break;
      case "INTERVIEW":
        html = await render(InterviewInvite({ firstName, jobTitle }));
        break;
      case "OFFER":
        html = await render(Offer({ firstName, jobTitle }));
        break;
      case "REJECTED":
        html = await render(Rejected({ firstName, jobTitle }));
        break;
      default:
        return;
    }

    // 3. Send via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: application.applicant.email,
      subject: emailConfig.subject,
      html,
    });

    if (result.data?.id) {
      resendMessageId = result.data.id;
    }

    console.log(
      `[Email Sender] Sent "${emailConfig.subject}" to ${application.applicant.email}`
    );
  } catch (error) {
    console.error(
      `[Email Sender] Failed to send email for application ${applicationId} stage ${stage}:`,
      error
    );
    status = "failed";
  } finally {
    // 4. Always log the email attempt — even on failure
    try {
      await prisma.emailLog.create({
        data: {
          applicationId,
          templateUsed: emailConfig.template,
          subject: emailConfig.subject,
          sentTo: "", // Will be resolved below if we have the applicant
          status,
          resendMessageId,
        },
      });
    } catch (logError) {
      console.error("[Email Sender] Failed to write email log:", logError);
    }
  }
}

/**
 * Variant that fetches the recipient email before sending so the log is accurate.
 * Used internally but exported for direct calls.
 */
export async function sendStageEmailWithLog(
  applicationId: string,
  stage: ApplicationStage
): Promise<void> {
  const emailConfig = STAGE_EMAIL_MAP[stage];
  if (!emailConfig) return;

  let status = "sent";
  let resendMessageId: string | undefined;
  let sentTo = "";

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { applicant: true, jobOpening: true },
    });

    if (!application) return;

    sentTo = application.applicant.email;
    const { firstName } = application.applicant;
    const jobTitle = application.jobOpening.title;

    let html: string;

    switch (stage) {
      case "APPLIED":
        html = await render(ApplicationReceived({ firstName, jobTitle }));
        break;
      case "SCREENING":
        html = await render(UnderReview({ firstName, jobTitle }));
        break;
      case "SHORTLISTED":
        html = await render(Shortlisted({ firstName, jobTitle }));
        break;
      case "INTERVIEW":
        html = await render(InterviewInvite({ firstName, jobTitle }));
        break;
      case "OFFER":
        html = await render(Offer({ firstName, jobTitle }));
        break;
      case "REJECTED":
        html = await render(Rejected({ firstName, jobTitle }));
        break;
      default:
        return;
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: sentTo,
      subject: emailConfig.subject,
      html,
    });

    if (result.data?.id) {
      resendMessageId = result.data.id;
    }
  } catch (error) {
    console.error(`[Email Sender] Send failed for ${applicationId}:`, error);
    status = "failed";
  } finally {
    try {
      await prisma.emailLog.create({
        data: {
          applicationId,
          templateUsed: emailConfig.template,
          subject: emailConfig.subject,
          sentTo,
          status,
          resendMessageId,
        },
      });
    } catch (logError) {
      console.error("[Email Sender] Failed to write email log:", logError);
    }
  }
}

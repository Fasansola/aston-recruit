import openai from "./openai";
import prisma from "./prisma";
import { extractCvText } from "./cv-parser";
import { AIRecommendation } from "@prisma/client";

interface ScoringResult {
  score: number;
  recommendation: AIRecommendation;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  skillsMatchScore: number;
  experienceMatchScore: number;
  redFlags: string[];
}

/**
 * Score an application using GPT-4o.
 * Fetches the application from DB, extracts CV text, calls OpenAI,
 * and saves the AIEvaluation record.
 *
 * This function is intended to be called fire-and-forget — it handles
 * its own errors internally.
 */
export async function scoreApplication(applicationId: string): Promise<void> {
  try {
    // 1. Fetch application with all related data needed for scoring
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        jobOpening: true,
      },
    });

    if (!application) {
      console.error(`[AI Scorer] Application not found: ${applicationId}`);
      return;
    }

    // 2. Extract CV text from the PDF stored in Vercel Blob
    const cvText = await extractCvText(application.cvUrl);

    // 3. Build the prompt
    const userPrompt = `Evaluate this candidate for the following role.

JOB TITLE: ${application.jobOpening?.title ?? "Unknown"}
JOB REQUIREMENTS: ${application.jobOpening?.requirements ?? ""}
JOB DESCRIPTION: ${application.jobOpening?.description ?? ""}

CANDIDATE CV:
${cvText}

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
}`;

    // 4. Call GPT-4o with structured JSON output
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a senior recruiter at Aston VIP, an international corporate advisory firm specialising in UAE business setup, free zone licensing, and corporate structuring. You evaluate CVs against job descriptions with precision and professionalism.\n\nAlways respond with valid JSON only. No preamble, no markdown, no explanation outside the JSON.",
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("No content returned from OpenAI");
    }

    // 5. Parse the JSON response
    const result = JSON.parse(rawContent) as ScoringResult;

    // 6. Validate recommendation is a valid enum value
    const validRecommendations: AIRecommendation[] = [
      "STRONG_YES",
      "YES",
      "MAYBE",
      "NO",
      "STRONG_NO",
    ];
    if (!validRecommendations.includes(result.recommendation)) {
      throw new Error(`Invalid recommendation: ${result.recommendation}`);
    }

    // 7. Save AIEvaluation to DB
    await prisma.aIEvaluation.create({
      data: {
        applicationId,
        score: Math.min(10, Math.max(1, Math.round(result.score))),
        recommendation: result.recommendation,
        summary: result.summary,
        strengths: result.strengths ?? [],
        weaknesses: result.weaknesses ?? [],
        skillsMatchScore: Math.min(10, Math.max(1, Math.round(result.skillsMatchScore))),
        experienceMatchScore: Math.min(
          10,
          Math.max(1, Math.round(result.experienceMatchScore))
        ),
        redFlags: result.redFlags ?? [],
        rawResponse: completion as never,
      },
    });

    console.log(`[AI Scorer] Scored application ${applicationId}: ${result.score}/10`);
  } catch (error) {
    console.error(`[AI Scorer] Failed to score application ${applicationId}:`, error);
    // Do not rethrow — this runs fire-and-forget
  }
}

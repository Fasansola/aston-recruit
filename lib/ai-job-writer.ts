import openai from "./openai";

export interface GeneratedJobContent {
  description: string;
  requirements: string;
  shortDescription: string; // ACF: short_description — 1-2 sentence listing card summary
}

/**
 * Uses GPT-4o to generate a professional job description and requirements
 * for Aston VIP based on a brief prompt from the HR team.
 *
 * @param title       - Job title (e.g. "Business Setup Consultant")
 * @param department  - Optional department (e.g. "Sales")
 * @param location    - Optional location (e.g. "Dubai, UAE")
 * @param notes       - Free-form notes / keywords from HR (e.g. "3 years UAE exp, Arabic speaker preferred")
 */
export async function generateJobContent(
  title: string,
  department: string | undefined,
  location: string | undefined,
  notes: string
): Promise<GeneratedJobContent> {
  const context = [
    department && `Department: ${department}`,
    location && `Location: ${location}`,
    notes && `Notes / key requirements: ${notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior HR copywriter at Aston VIP, an international corporate advisory firm in the UAE specialising in business setup, free zone licensing, visa services, and corporate structuring.

Write compelling, professional job postings that reflect the premium brand and the UAE corporate environment. Use clear, confident language. Avoid generic filler phrases.

Always respond with valid JSON only — no markdown, no preamble.`,
      },
      {
        role: "user",
        content: `Write a job posting for the following role at Aston VIP.

JOB TITLE: ${title}
${context}

Return a JSON object with exactly these three fields:

{
  "shortDescription": "<1-2 punchy sentences (max 200 chars) summarising the role for job listing cards. No fluff — lead with the impact or the opportunity.>",
  "description": "<1-2 concise intro paragraphs (plain text, separated by a blank line) describing the role and its purpose at Aston VIP. Then on new lines, list 5-7 key day-to-day responsibilities, each starting with '• '. This separation is important — the publisher splits intro paragraphs from bullet lines automatically.>",
  "requirements": "<6-10 requirements covering experience, qualifications, and skills. Each requirement on its own line starting with '• '. Plain text only — no markdown, no headings.>"
}

Example shortDescription: "Lead end-to-end business setup for clients across UAE free zones and mainland — a senior client-facing role with direct impact on company growth."

Example description format:
"The Business Setup Consultant will be the first point of contact for clients looking to establish a company in the UAE.\n\nWorking directly with clients across all stages of the setup process, you will guide them from initial consultation through to license issuance.\n\n• Advise clients on the most suitable business structure and jurisdiction\n• Manage the end-to-end application process for free zone and mainland licenses\n• Liaise with government authorities and free zone offices on behalf of clients"`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No content returned from OpenAI");

  const result = JSON.parse(raw) as GeneratedJobContent;
  if (!result.description || !result.requirements) {
    throw new Error("Incomplete response from OpenAI");
  }

  return result;
}

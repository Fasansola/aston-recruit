import openai from "./openai";

export interface GeneratedJobContent {
  description: string;
  requirements: string;
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

Return a JSON object with exactly these two fields:
{
  "description": "<3-4 paragraph job description covering: role overview, key responsibilities, what the candidate will be doing day-to-day, and why Aston VIP is a great place to work. Plain text, no markdown, use line breaks between paragraphs.>",
  "requirements": "<bulleted list of 6-10 requirements covering experience, skills, and qualifications. Each bullet on a new line starting with '• '. Plain text, no markdown.>"
}`,
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

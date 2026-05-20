// pdf-parse is a CommonJS module — use require() to avoid ESM default export issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

/**
 * Fetch a PDF from a URL (e.g. Vercel Blob) and extract its plain text.
 */
export async function extractCvText(cvUrl: string): Promise<string> {
  const response = await fetch(cvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch CV: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  const data = await pdfParse(Buffer.from(buffer));
  return data.text;
}

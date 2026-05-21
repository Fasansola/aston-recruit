import { extractText } from "unpdf";

/**
 * Downloads a PDF from a Vercel Blob (private) URL and extracts plain text.
 * Private blobs require the BLOB_READ_WRITE_TOKEN as a Bearer token.
 */
export async function extractCvText(cvUrl: string): Promise<string> {
  const response = await fetch(cvUrl, {
    headers: {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CV (${response.status}): ${cvUrl}`);
  }

  const buffer = await response.arrayBuffer();

  const { text } = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });

  return text ?? "";
}

import { put } from "@vercel/blob";

/**
 * Upload a CV file buffer to Vercel Blob storage.
 * Returns the public blob URL.
 */
export async function uploadCv(
  filename: string,
  buffer: Buffer
): Promise<string> {
  const blob = await put(filename, buffer, {
    access: "public",
    contentType: "application/pdf",
  });
  return blob.url;
}

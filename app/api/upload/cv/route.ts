import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * POST /api/upload/cv
 *
 * Accepts a PDF file upload from Make.com and stores it in Vercel Blob.
 * Secured with the same WEBHOOK_SECRET header used by the main webhook.
 *
 * Make.com should send:
 *   - Header: x-webhook-secret: <WEBHOOK_SECRET>
 *   - Body: multipart/form-data with a field named "cv" containing the PDF file
 *
 * Returns: { url: "https://..." }
 */
export async function POST(req: NextRequest) {
  try {
    // Validate secret
    const secret = req.headers.get("x-webhook-secret");
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data — send multipart/form-data with a 'cv' field" },
        { status: 400 }
      );
    }

    const file = formData.get("cv");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing 'cv' file field in form data" },
        { status: 400 }
      );
    }

    // Validate it's a PDF
    if (file.type && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted" },
        { status: 400 }
      );
    }

    // Build a unique filename
    const originalName =
      file instanceof File ? file.name.replace(/[^a-zA-Z0-9._-]/g, "_") : "cv.pdf";
    const timestamp = Date.now();
    const filename = `cvs/${timestamp}_${originalName}`;

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: "application/pdf",
    });

    return NextResponse.json({ url: blob.url }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/upload/cv]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

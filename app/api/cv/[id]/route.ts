import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/cv/[id]
 *
 * Returns a short-lived signed download URL for a private CV blob.
 * Only authenticated users can access this endpoint.
 * The signed URL is returned as a redirect so the browser opens the PDF directly.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Look up the application to get the blob URL
    const application = await prisma.application.findUnique({
      where: { id },
      select: { cvUrl: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Generate a signed URL valid for 1 hour
    const blobInfo = await head(application.cvUrl, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Redirect the browser to the signed download URL
    return NextResponse.redirect(blobInfo.downloadUrl);
  } catch (error) {
    console.error("[GET /api/cv/[id]]", error);
    return NextResponse.json({ error: "Could not load CV" }, { status: 500 });
  }
}

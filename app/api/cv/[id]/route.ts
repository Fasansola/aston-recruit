import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/cv/[id]
 *
 * Streams a private Vercel Blob CV through this authenticated route so the
 * browser never needs direct access to the blob (which would require our token).
 * Only authenticated users can access this endpoint.
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

    // Fetch the private blob server-side using our token, then stream it to
    // the client. This avoids the browser needing to authenticate with Vercel Blob.
    const blobResponse = await fetch(application.cvUrl, {
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!blobResponse.ok) {
      console.error(`[GET /api/cv/${id}] Blob fetch failed: ${blobResponse.status}`);
      return NextResponse.json({ error: "Could not load CV" }, { status: 502 });
    }

    // Pass through the PDF bytes with appropriate headers for inline rendering
    return new NextResponse(blobResponse.body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=\"cv.pdf\"",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/cv/[id]]", error);
    return NextResponse.json({ error: "Could not load CV" }, { status: 500 });
  }
}

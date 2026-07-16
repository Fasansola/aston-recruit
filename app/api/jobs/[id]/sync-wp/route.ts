import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/jobs/[id]/sync-wp
 * Fetches the current permalink from WordPress by wpPostId and updates
 * wpPostUrl in the DB if it has changed (e.g. after a slug change on WP admin).
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

    const job = await prisma.jobOpening.findUnique({
      where: { id },
      select: { wpPostId: true, wpPostUrl: true },
    });

    if (!job?.wpPostId) {
      return NextResponse.json({ synced: false });
    }

    const { WORDPRESS_URL, WORDPRESS_CAREER_TOKEN, WORDPRESS_USERNAME, WORDPRESS_APP_PASSWORD } =
      process.env;

    if (!WORDPRESS_URL) {
      return NextResponse.json({ synced: false });
    }

    const baseUrl = WORDPRESS_URL.replace(/\/$/, "");

    // Try the custom token endpoint first, fall back to standard WP REST
    let link: string | null = null;

    if (WORDPRESS_CAREER_TOKEN) {
      const res = await fetch(
        `${baseUrl}/wp-json/aston/v1/career/${job.wpPostId}`,
        { headers: { "X-Aston-Token": WORDPRESS_CAREER_TOKEN } }
      );
      if (res.ok) {
        const data = (await res.json()) as { link?: string };
        link = data.link ?? null;
      }
    } else if (WORDPRESS_USERNAME && WORDPRESS_APP_PASSWORD) {
      const credentials = Buffer.from(
        `${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD.replace(/\s/g, "")}`
      ).toString("base64");
      const res = await fetch(
        `${baseUrl}/wp-json/wp/v2/career/${job.wpPostId}`,
        { headers: { Authorization: `Basic ${credentials}` } }
      );
      if (res.ok) {
        const data = (await res.json()) as { link?: string };
        link = data.link ?? null;
      }
    }

    if (!link) {
      return NextResponse.json({ synced: false });
    }

    // Only write to DB if the URL actually changed
    if (link !== job.wpPostUrl) {
      await prisma.jobOpening.update({
        where: { id },
        data: { wpPostUrl: link },
      });
    }

    return NextResponse.json({ synced: true, wpPostUrl: link });
  } catch (error) {
    console.error("[GET /api/jobs/[id]/sync-wp]", error);
    return NextResponse.json({ synced: false });
  }
}

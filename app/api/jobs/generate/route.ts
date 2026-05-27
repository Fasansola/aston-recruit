import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { generateJobContent } from "@/lib/ai-job-writer";

const schema = z.object({
  title: z.string().min(1),
  department: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().default(""),
});

/**
 * POST /api/jobs/generate
 * Uses GPT-4o to draft a job description and requirements for the given role.
 * Returns { description, requirements }.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-expect-error — custom role field
    const role = session.user.role as string;
    if (!["ADMIN", "HR_MANAGER"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { title, department, location, notes } = parsed.data;
    const result = await generateJobContent(title, department, location, notes);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/jobs/generate]", error);
    return NextResponse.json({ error: "Failed to generate job content" }, { status: 500 });
  }
}

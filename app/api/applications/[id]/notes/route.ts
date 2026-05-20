import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

const noteSchema = z.object({
  body: z.string().min(1).max(5000),
  isPrivate: z.boolean().optional().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // VIEWERs cannot add notes
    // @ts-expect-error — custom role field
    const role = session.user.role as string;
    if (role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: applicationId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify the application exists
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Ensure the author user exists in our DB (it should — they're logged in)
    const author = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!author) {
      return NextResponse.json({ error: "Author not found" }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        applicationId,
        authorId: author.id,
        body: parsed.data.body,
        isPrivate: parsed.data.isPrivate,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("[POST /api/applications/[id]/notes]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

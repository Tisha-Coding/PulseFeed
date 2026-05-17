import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getContentBySlug,
  updateContentBySlug,
  deleteContentBySlug,
} from "@/services/contentService";
import { getRequestUser } from "@/lib/session";

type Ctx = { params: Promise<{ slug: string }> };

const slugSchema = z.object({ slug: z.string().min(1, "Slug is required") });

// Fields an admin may update. `regenerateSlug` controls slug integrity.
const updateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").optional(),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  articleBody: z.string().optional(),
  duration: z.number().optional(),
  readTime: z.number().optional(),
  regenerateSlug: z.boolean().optional(),
});

// GET - fetch by slug. Opening the page does NOT count a view; the view is
// registered separately once the viewer has actually watched/read for a while.
export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = slugSchema.parse(await params);
    const content = await getContentBySlug(slug);
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Content not found" },
      { status: 404 },
    );
  }
}

// PUT - update content (admin only).
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = slugSchema.parse(await params);
    const user = await getRequestUser(req);
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { regenerateSlug, ...fields } = updateSchema.parse(await req.json());
    const content = await updateContentBySlug(
      slug,
      fields,
      Boolean(regenerateSlug),
    );
    return NextResponse.json({ success: true, data: content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update content" },
      { status: 500 },
    );
  }
}

// DELETE - remove content (admin only).
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = slugSchema.parse(await params);
    const user = await getRequestUser(req);
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }
    await deleteContentBySlug(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to delete content" },
      { status: 500 },
    );
  }
}

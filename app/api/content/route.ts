import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFeed, createContent } from "@/services/contentService";
import { getRequestUser } from "@/lib/session";

// Zod-validated query params for the feed.
const feedQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  type: z.enum(["VIDEO", "ARTICLE"]).optional(),
  sort: z.enum(["trending", "latest"]).optional(),
});

// Only the title is required for both types; description and thumbnail are
// optional. Video/article-specific fields are required only for their own
// type — the `.refine()` chain enforces that server-side, so a UI bypass
// can't create half-formed content.
const createContentSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    type: z.enum(["VIDEO", "ARTICLE"]),
    description: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    videoUrl: z.string().optional(),
    articleBody: z.string().optional(),
    duration: z.number().optional(),
    readTime: z.number().optional(),
  })
  .refine((d) => d.type !== "VIDEO" || !!d.videoUrl?.trim(), {
    message: "Video URL is required for a video",
    path: ["videoUrl"],
  })
  .refine((d) => d.type !== "VIDEO" || (d.duration ?? 0) > 0, {
    message: "Duration is required for a video",
    path: ["duration"],
  })
  .refine((d) => d.type !== "ARTICLE" || !!d.articleBody?.trim(), {
    message: "Article body is required for an article",
    path: ["articleBody"],
  })
  .refine((d) => d.type !== "ARTICLE" || (d.readTime ?? 0) > 0, {
    message: "Read time is required for an article",
    path: ["readTime"],
  });

// GET - cursor-paginated discovery feed.
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const q = feedQuerySchema.parse({
      cursor: sp.get("cursor") ?? undefined,
      limit: sp.get("limit") ?? undefined,
      type: sp.get("type") ?? undefined,
      sort: sp.get("sort") ?? undefined,
    });

    const user = await getRequestUser(request);
    const { data, nextCursor, hasMore } = await getFeed({
      cursor: q.cursor ?? null,
      limit: q.limit,
      type: q.type ?? null,
      sort: q.sort ?? null,
      userId: user?.id ?? null,
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: { nextCursor, hasMore },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}

// POST - create content (admin only).
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const data = createContentSchema.parse(await request.json());
    const content = await createContent(data);
    return NextResponse.json({ success: true, data: content }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create content" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toggleEngagement, getEngagement } from "@/services/engagementService";
import { getRequestUser } from "@/lib/session";

// userId is taken from the session, never the body — only contentId + the
// desired flags are accepted.
const engagementSchema = z.object({
  contentId: z.number().int().positive(),
  isLiked: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
});

// POST - toggle like / bookmark (idempotent, atomic counters).
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in" },
        { status: 401 },
      );
    }

    // ===== ADMIN ENGAGEMENT LOCK (server-side) =====
    // Admins manage content; liking/bookmarking is a reader-only action.
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Engagement is disabled for admin accounts" },
        { status: 403 },
      );
    }
    // ===============================================

    const { contentId, isLiked, isBookmarked } = engagementSchema.parse(
      await request.json(),
    );

    const engagement = await toggleEngagement({
      userId: user.id,
      contentId,
      isLiked,
      isBookmarked,
    });

    return NextResponse.json({ success: true, data: engagement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    // Log the real cause server-side; the client gets a generic message.
    console.error("[engagement POST] failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update engagement" },
      { status: 500 },
    );
  }
}

// GET - the current user's engagement for one content item.
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in" },
        { status: 401 },
      );
    }

    const contentId = z.coerce
      .number()
      .int()
      .positive()
      .parse(request.nextUrl.searchParams.get("contentId"));

    const engagement = await getEngagement(user.id, contentId);
    return NextResponse.json({ success: true, data: engagement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch engagement" },
      { status: 500 },
    );
  }
}

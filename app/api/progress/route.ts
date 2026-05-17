import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  saveProgress,
  getProgress,
  getContinueList,
} from "@/services/progressService";
import { getRequestUser } from "@/lib/session";

// userId comes from the session. The frontend debounces these writes
// (every few seconds of playback / on unmount), so they stay cheap.
const progressSchema = z.object({
  contentId: z.number().int().positive(),
  lastPosition: z.number().int().min(0),
  isCompleted: z.boolean().optional(),
});

// POST - save "continue watching/reading" progress.
export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in" },
        { status: 401 },
      );
    }

    // ===== ADMIN VIEW-ONLY (server-side): admins don't track progress =====
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Progress tracking is disabled for admin accounts" },
        { status: 403 },
      );
    }
    // =====================================================================

    const { contentId, lastPosition, isCompleted } = progressSchema.parse(
      await request.json(),
    );

    const progress = await saveProgress({
      userId: user.id,
      contentId,
      lastPosition,
      isCompleted,
    });
    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update progress" },
      { status: 500 },
    );
  }
}

// GET - with ?contentId= returns one item's progress;
//       without it returns the user's "Continue" list.
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in" },
        { status: 401 },
      );
    }

    // ===== ADMIN VIEW-ONLY (server-side): admins have no progress =====
    if (user.role === "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Progress tracking is disabled for admin accounts" },
        { status: 403 },
      );
    }
    // ==================================================================

    const raw = request.nextUrl.searchParams.get("contentId");
    if (raw) {
      const contentId = z.coerce.number().int().positive().parse(raw);
      const progress = await getProgress(user.id, contentId);
      return NextResponse.json({ success: true, data: progress });
    }

    const list = await getContinueList(user.id);
    return NextResponse.json({ success: true, data: list });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch progress" },
      { status: 500 },
    );
  }
}

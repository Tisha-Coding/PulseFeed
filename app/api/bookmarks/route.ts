import { NextRequest, NextResponse } from "next/server";
import { getUserBookmarks } from "@/services/engagementService";
import { getRequestUser } from "@/lib/session";

// GET - the logged-in user's bookmarked content.
export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be logged in" },
        { status: 401 },
      );
    }

    const data = await getUserBookmarks(user.id);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to load bookmarks" },
      { status: 500 },
    );
  }
}

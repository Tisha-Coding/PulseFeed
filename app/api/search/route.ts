import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchContent } from "@/services/contentService";
import { getRequestUser } from "@/lib/session";

const searchSchema = z.object({ q: z.string().min(1, "Search query required") });

// GET - title/description search (backed by GIN trigram indexes for speed).
export async function GET(request: NextRequest) {
  try {
    const { q } = searchSchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });

    const user = await getRequestUser(request);
    const results = await searchContent(q, user?.id ?? null);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 },
    );
  }
}

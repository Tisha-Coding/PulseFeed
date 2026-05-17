import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerView } from "@/services/contentService";
import { getRequestUser } from "@/lib/session";

type Ctx = { params: Promise<{ slug: string }> };

const slugSchema = z.object({ slug: z.string().min(1, "Slug is required") });

// POST - count ONE view. The client calls this only after the viewer has
// genuinely spent time on the content (watched a video / read an article),
// so opening-and-leaving never inflates the count. Admins never count.
export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = slugSchema.parse(await params);

    const user = await getRequestUser(req);
    if (user?.role === "ADMIN") {
      return NextResponse.json({ success: true, skipped: true });
    }

    const { viewCount } = await registerView(slug);
    return NextResponse.json({ success: true, viewCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, errors: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to register view" },
      { status: 500 },
    );
  }
}

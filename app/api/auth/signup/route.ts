import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signupSchema } from "@/lib/validators";
import { getUserByEmail, createUser } from "@/services/userService";

// POST - register a new user.
export async function POST(request: NextRequest) {
  try {
    // Zod validation (name, email, password, confirmPassword).
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    // Reject duplicate emails.
    if (await getUserByEmail(parsed.data.email)) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await createUser({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
    });

    return NextResponse.json(
      { message: "Account created", user: { email: user.email } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

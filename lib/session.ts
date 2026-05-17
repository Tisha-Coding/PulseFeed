import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Reads the authenticated user from the NextAuth JWT cookie.
 * userId is derived server-side — never trusted from the request body.
 */
export async function getRequestUser(
  req: NextRequest,
): Promise<{ id: number; role: string } | null> {
  const token = await getToken({ req });
  if (!token?.id) return null;
  return { id: Number(token.id), role: String(token.role ?? "USER") };
}

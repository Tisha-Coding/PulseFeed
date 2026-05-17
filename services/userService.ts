import { prisma } from "@/lib/db";

/** User data-access layer. */

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      password: input.passwordHash,
    },
  });
}

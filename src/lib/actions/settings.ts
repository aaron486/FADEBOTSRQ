"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";

export async function addAllowedEmail(email: string) {
  const user = await requireUser();
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
    return { ok: false as const, error: "Enter a valid email address" };
  await prisma.allowedEmail.upsert({
    where: { email: normalized },
    update: {},
    create: { email: normalized, addedBy: user.email },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function removeAllowedEmail(id: string) {
  const user = await requireUser();
  const entry = await prisma.allowedEmail.findUniqueOrThrow({ where: { id } });
  if (entry.email === user.email.toLowerCase())
    return { ok: false as const, error: "You can't remove your own email" };
  await prisma.allowedEmail.delete({ where: { id } });
  revalidatePath("/settings");
  return { ok: true as const };
}

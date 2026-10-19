"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";

/** Add creators to a list by name, creating the list if needed. */
export async function addCreatorsToList(name: string, creatorIds: string[]) {
  await requireUser();
  const listName = name.trim();
  if (!listName) return { ok: false as const, error: "Give the list a name." };
  if (creatorIds.length === 0) return { ok: false as const, error: "Select creators first." };
  const list = await prisma.creatorList.upsert({
    where: { name: listName },
    create: { name: listName },
    update: {},
  });
  await prisma.creatorListMember.createMany({
    data: creatorIds.map((creatorId) => ({ listId: list.id, creatorId })),
    skipDuplicates: true,
  });
  revalidatePath("/creators");
  return { ok: true as const, listId: list.id };
}

export async function removeCreatorsFromList(listId: string, creatorIds: string[]) {
  await requireUser();
  await prisma.creatorListMember.deleteMany({ where: { listId, creatorId: { in: creatorIds } } });
  revalidatePath("/creators");
  return { ok: true as const };
}

export async function deleteList(listId: string) {
  await requireUser();
  await prisma.creatorList.delete({ where: { id: listId } });
  revalidatePath("/creators");
  return { ok: true as const };
}

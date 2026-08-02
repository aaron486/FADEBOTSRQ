"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { Platform } from "@/lib/creator-meta";

export type TemplateInput = {
  name: string;
  platform: Platform | null;
  subject: string | null;
  body: string;
};

export async function createTemplate(input: TemplateInput) {
  await requireUser();
  if (!input.name.trim() || !input.body.trim())
    return { ok: false as const, error: "Template needs a name and a body" };
  await prisma.template.create({
    data: {
      name: input.name.trim(),
      platform: input.platform,
      subject: input.subject?.trim() || null,
      body: input.body,
    },
  });
  revalidatePath("/templates");
  return { ok: true as const };
}

export async function updateTemplate(id: string, input: TemplateInput) {
  await requireUser();
  if (!input.name.trim() || !input.body.trim())
    return { ok: false as const, error: "Template needs a name and a body" };
  await prisma.template.update({
    where: { id },
    data: {
      name: input.name.trim(),
      platform: input.platform,
      subject: input.subject?.trim() || null,
      body: input.body,
    },
  });
  revalidatePath("/templates");
  return { ok: true as const };
}

export async function deleteTemplate(id: string) {
  await requireUser();
  await prisma.template.delete({ where: { id } });
  revalidatePath("/templates");
  return { ok: true as const };
}

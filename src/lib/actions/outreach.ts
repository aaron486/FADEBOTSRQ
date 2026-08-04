"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { sendEmail } from "@/lib/email";
import { PLATFORMS, Stage, stageIndex, Platform, channels } from "@/lib/creator-meta";

function revalidateCreator(id: string) {
  revalidatePath("/");
  revalidatePath(`/creators/${id}`);
}

async function advanceToSent(creatorId: string, currentStage: Stage) {
  if (stageIndex(currentStage) < stageIndex("OUTREACH_SENT")) {
    await prisma.creator.update({
      where: { id: creatorId },
      data: { stage: "OUTREACH_SENT" },
    });
  } else {
    // touch updatedAt so "recently updated" sorting reflects the send
    await prisma.creator.update({ where: { id: creatorId }, data: {} });
  }
}

/** Record that a DM was sent manually on IG/X/TikTok (their APIs don't allow programmatic DMs). */
export async function markDmSent(
  creatorId: string,
  input: { channel: Platform; body: string; isFollowUp: boolean }
) {
  const user = await requireUser();
  const creator = await prisma.creator.findUniqueOrThrow({ where: { id: creatorId } });
  const available = channels({
    instagramHandle: creator.instagramHandle,
    xHandle: creator.xHandle,
    tiktokHandle: creator.tiktokHandle,
    youtubeHandle: creator.youtubeHandle,
    email: creator.email,
    phone: creator.phone,
    primaryPlatform: creator.primaryPlatform as Platform,
  });
  if (!available.some((c) => c.platform === input.channel)) {
    return { ok: false as const, error: "This creator has no handle for that channel." };
  }

  await prisma.outreachMessage.create({
    data: {
      creatorId,
      channel: input.channel,
      body: input.body,
      status: "SENT",
      isFollowUp: input.isFollowUp,
      sentAt: new Date(),
      sentById: user.id,
    },
  });
  await prisma.activity.create({
    data: {
      creatorId,
      userId: user.id,
      text: `${input.isFollowUp ? "Follow-up" : "Outreach"} DM sent on ${PLATFORMS[input.channel].label}`,
    },
  });
  await advanceToSent(creatorId, creator.stage as Stage);
  revalidateCreator(creatorId);
  return { ok: true as const };
}

/** Actually send an outreach email via Resend and log it. */
export async function sendOutreachEmail(
  creatorId: string,
  input: { subject: string; body: string; isFollowUp: boolean }
) {
  const user = await requireUser();
  const creator = await prisma.creator.findUniqueOrThrow({ where: { id: creatorId } });

  const to = creator.email?.trim();
  if (!to) return { ok: false as const, error: "This creator has no email address on file." };
  if (!input.subject.trim()) return { ok: false as const, error: "Subject is required." };
  if (!input.body.trim()) return { ok: false as const, error: "Message body is empty." };

  const result = await sendEmail({ to, subject: input.subject, text: input.body });

  const message = await prisma.outreachMessage.create({
    data: {
      creatorId,
      channel: "EMAIL",
      subject: input.subject,
      body: input.body,
      status: result.ok ? "SENT" : "FAILED",
      isFollowUp: input.isFollowUp,
      sentAt: result.ok ? new Date() : null,
      sentById: user.id,
      resendId: result.ok ? result.id : null,
      error: result.ok ? null : result.error,
    },
  });

  if (!result.ok) {
    await prisma.activity.create({
      data: { creatorId, userId: user.id, text: `Email failed to send: ${result.error}` },
    });
    revalidateCreator(creatorId);
    return { ok: false as const, error: result.error };
  }

  await prisma.activity.create({
    data: {
      creatorId,
      userId: user.id,
      text: `${input.isFollowUp ? "Follow-up" : "Outreach"} email sent to ${to}${
        result.simulated ? " (simulated — no RESEND_API_KEY)" : ""
      }`,
    },
  });
  await advanceToSent(creatorId, creator.stage as Stage);
  revalidateCreator(creatorId);
  return { ok: true as const, simulated: result.simulated, messageId: message.id };
}

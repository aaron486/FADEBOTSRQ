import { Resend } from "resend";
import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; id: string; simulated: boolean }
  | { ok: false; error: string };

/**
 * Sends an email. Provider order:
 * 1. Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD) — preferred, since a warmed
 *    personal account lands in inboxes far better than a fresh domain.
 * 2. Resend (RESEND_API_KEY).
 * 3. Neither set (local dev): logged to the console as a simulated success,
 *    so the whole flow is testable with no external account.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""); // app passwords paste with spaces

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: gmailUser, pass: gmailPass },
      });
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || gmailUser,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return { ok: true, id: info.messageId ?? "", simulated: false };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown SMTP error";
      if (/535|auth/i.test(msg)) {
        return {
          ok: false,
          error:
            "Gmail rejected the login — check GMAIL_USER and GMAIL_APP_PASSWORD (create one at myaccount.google.com → Security → App passwords; needs 2-Step Verification on).",
        };
      }
      return { ok: false, error: `Gmail send failed: ${msg}` };
    }
  }

  const from = process.env.EMAIL_FROM || "FADE <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `\n[email:simulated] to=${input.to}\nfrom=${from}\nsubject=${input.subject}\n---\n${input.text}\n---\n`
    );
    return { ok: true, id: `simulated_${Date.now()}`, simulated: true };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "", simulated: false };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown email error" };
  }
}

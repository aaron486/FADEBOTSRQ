import { Resend } from "resend";

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
 * Sends an email through Resend. Without RESEND_API_KEY (local dev) the email
 * is logged to the server console and reported as a simulated success, so the
 * whole flow is testable with no external account.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
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

import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const devLoginEnabled =
  process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

async function isAllowed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const found = await prisma.allowedEmail.findUnique({
    where: { email: email.toLowerCase() },
  });
  return !!found;
}

const providers: Provider[] = [
  Resend({
    from: process.env.EMAIL_FROM,
    // Route magic links through our own sender so dev mode (no RESEND_API_KEY)
    // logs the link to the console instead of failing.
    async sendVerificationRequest({ identifier, url }) {
      const result = await sendEmail({
        to: identifier,
        subject: "Sign in to FADE Creator Tracker",
        text: `Sign in to FADE Creator Tracker:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
        html: `<body style="font-family:system-ui,sans-serif;padding:24px"><h2>FADE Creator Tracker</h2><p><a href="${url}" style="display:inline-block;background:#2a78d6;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Sign in</a></p><p style="color:#52514e;font-size:13px">If you did not request this, ignore this email.</p></body>`,
      });
      if (!result.ok) throw new Error(`Failed to send magic link: ${result.error}`);
      if (result.simulated) console.log(`\n[auth] Magic link for ${identifier}:\n${url}\n`);
    },
  }),
];

if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login",
      credentials: { email: { label: "Email", type: "email" } },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        if (!email || !(await isAllowed(email))) return null;
        return prisma.user.upsert({
          where: { email },
          update: {},
          create: { email, name: email.split("@")[0] },
        });
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async signIn({ user }) {
      return isAllowed(user.email);
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) session.user.id = token.id as string;
      return session;
    },
  },
});

/** For server actions: returns the signed-in user's {id, email} or throws. */
export async function requireUser() {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email) throw new Error("Not authenticated");
  return { id, email };
}

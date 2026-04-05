import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { D1Adapter } from "@auth/d1-adapter";

function getDB(): D1Database | undefined {
  try {
    const ctx = (globalThis as Record<symbol, unknown>)[
      Symbol.for("__cloudflare-request-context__")
    ] as { env?: { DB?: D1Database } } | undefined;
    return ctx?.env?.DB;
  } catch {
    return undefined;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const db = getDB();

  return {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    ...(db ? { adapter: D1Adapter(db) } : {}),
    session: { strategy: db ? "database" : "jwt" },
    callbacks: {
      session({ session, user, token }) {
        if (user?.id) session.user.id = user.id;
        else if (token?.sub) session.user.id = token.sub;
        return session;
      },
    },
    events: {
      async createUser({ user }) {
        if (!user.id) return;
        const db = getDB();
        if (!db) return;
        try {
          await db
            .prepare(
              "UPDATE users SET credits = 3, plan = 'free' WHERE id = ? AND (credits IS NULL OR credits = 0)"
            )
            .bind(user.id)
            .run();
        } catch (e) {
          console.error("[createUser] Failed to grant credits:", e);
        }
      },
    },
    pages: { signIn: "/" },
    trustHost: true,
  };
});

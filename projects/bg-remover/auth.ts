import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { D1Adapter } from "@auth/d1-adapter";

// Auth.js v5 config factory — receives Cloudflare env via getRequestContext at runtime
export const { handlers, signIn, signOut, auth } = NextAuth((req) => {
  // next-on-pages injects cf bindings onto the request object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cfEnv = (req as any)?.cf?.env as CloudflareEnv | undefined;

  // Fallback: try getRequestContext (works in some next-on-pages versions)
  let db: D1Database | undefined = cfEnv?.DB;

  if (!db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRequestContext } = require("@cloudflare/next-on-pages");
      db = getRequestContext().env.DB;
    } catch {
      // not in CF runtime (e.g. local dev)
    }
  }

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
        if (user) session.user.id = user.id;
        if (token?.sub) session.user.id = token.sub;
        return session;
      },
    },
    pages: {
      signIn: "/",
    },
  };
});

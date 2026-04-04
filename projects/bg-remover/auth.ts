import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { D1Adapter } from "@auth/d1-adapter";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  const { env } = getRequestContext();

  return {
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    adapter: D1Adapter(env.DB),
    session: { strategy: "database" },
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
    pages: {
      signIn: "/",
    },
  };
});

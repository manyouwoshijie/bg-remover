import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { saveUser } from "@/lib/db";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (profile) {
        await saveUser(profile);
      }
      return true;
    },
  },
  pages: {
    signIn: '/',
  },
});

export { handler as GET, handler as POST };

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { D1Adapter } from "@auth/d1-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth(() => {
  let db: D1Database | undefined;
  try {
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    db = getRequestContext().env.DB;
  } catch {
    // local dev
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
      async signIn({ user, account, profile }) {
        // 新用户注册时送 3 次额度
        if (db && user.id && account?.provider === "google") {
          try {
            // 检查是否是新用户（credits 为 null 说明刚创建）
            const existing = await db
              .prepare("SELECT id, credits FROM users WHERE id = ?")
              .bind(user.id)
              .first<{ id: string; credits: number | null }>();
            
            if (existing && existing.credits === null) {
              // 新注册用户，送 3 次额度
              await db
                .prepare("UPDATE users SET credits = 3, plan = 'free' WHERE id = ?")
                .bind(user.id)
                .run();
            } else if (!existing) {
              // D1Adapter 还没创建用户，通过 events 处理
            }
          } catch (e) {
            console.error("Failed to grant initial credits:", e);
          }
        }
        return true;
      },
      session({ session, user, token }) {
        if (user) session.user.id = user.id;
        if (token?.sub) session.user.id = token.sub;
        return session;
      },
    },
    events: {
      async createUser({ user }) {
        // 用户第一次创建时送 3 次额度
        if (db && user.id) {
          try {
            await db
              .prepare("UPDATE users SET credits = 3, plan = 'free' WHERE id = ? AND (credits IS NULL OR credits = 0)")
              .bind(user.id)
              .run();
          } catch (e) {
            console.error("Failed to grant initial credits on createUser:", e);
          }
        }
      },
    },
    pages: {
      signIn: "/",
    },
  };
});

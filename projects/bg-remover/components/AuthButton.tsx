"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <img src={session.user?.image || ''} alt="avatar" className="w-8 h-8 rounded-full" />
        <span className="text-sm">{session.user?.name}</span>
        <button onClick={() => signOut()} className="text-sm text-red-500 hover:underline">
          退出
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => signIn('google')}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
    >
      Google 登录
    </button>
  );
}

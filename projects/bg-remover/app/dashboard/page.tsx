"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface UserStats {
  credits: number;
  plan: string;
  createdAt?: number;
  logs: { id: string; status: string; created_at: number }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/stats")
        .then((r) => r.json() as Promise<UserStats>)
        .then((d) => {
          setStats(d);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">请先登录</p>
          <Link href="/" className="text-blue-600 hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  const planLabels: Record<string, string> = {
    free: "免费版",
    pro: "Pro",
    pro_plus: "Pro+",
    unlimited: "无限制",
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1">
            ← 返回首页
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-red-500 hover:underline"
          >
            退出登录
          </button>
        </div>

        {/* 用户信息卡 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            {session.user.image && (
              <img src={session.user.image} alt="avatar" className="w-14 h-14 rounded-full" />
            )}
            <div>
              <h1 className="text-xl font-semibold">{session.user.name}</h1>
              <p className="text-gray-500 text-sm">{session.user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                {planLabels[stats?.plan ?? "free"] ?? stats?.plan}
              </span>
            </div>
          </div>
        </div>

        {/* 额度卡 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">剩余额度</h2>
          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-gray-900">{stats?.credits ?? 0}</span>
            <span className="text-gray-400 mb-1">次</span>
          </div>
          {(stats?.credits ?? 0) === 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              额度已用完 · 升级套餐继续使用
            </div>
          )}
          {(stats?.credits ?? 0) > 0 && (stats?.credits ?? 0) <= 1 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              额度即将耗尽，考虑升级套餐？
            </div>
          )}
          <Link
            href="/pricing"
            className="mt-4 w-full block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors text-sm"
          >
            升级套餐 →
          </Link>
        </div>

        {/* 使用记录 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">使用记录</h2>
          {!stats?.logs?.length ? (
            <p className="text-gray-400 text-sm text-center py-6">暂无使用记录</p>
          ) : (
            <div className="space-y-2">
              {stats.logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${log.status === "success" ? "bg-green-400" : "bg-red-400"}`} />
                    <span className="text-sm text-gray-600">
                      {log.status === "success" ? "背景去除成功" : "处理失败"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(log.created_at * 1000).toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

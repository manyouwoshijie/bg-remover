import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let db: D1Database | undefined;
  try {
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    db = getRequestContext().env.DB;
  } catch {
    // local dev
  }

  if (!db) {
    return NextResponse.json({ credits: 0, plan: 'free', logs: [] });
  }

  const user = await db
    .prepare('SELECT credits, plan, created_at FROM users WHERE id = ?')
    .bind(session.user.id)
    .first<{ credits: number; plan: string; created_at: number }>();

  const logs = await db
    .prepare(
      'SELECT id, status, created_at FROM usage_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    )
    .bind(session.user.id)
    .all<{ id: string; status: string; created_at: number }>();

  return NextResponse.json({
    credits: user?.credits ?? 0,
    plan: user?.plan ?? 'free',
    createdAt: user?.created_at,
    logs: logs.results ?? [],
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'edge';

const GUEST_FREE_LIMIT = 2;
const GUEST_COOKIE = 'guest_uses';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // ── 未登录用户：cookie 计数，限 2 次 ──
    if (!session?.user?.id) {
      const cookieVal = request.cookies.get(GUEST_COOKIE)?.value ?? '0';
      const guestUses = parseInt(cookieVal, 10) || 0;

      if (guestUses >= GUEST_FREE_LIMIT) {
        return NextResponse.json(
          {
            error: `免费试用已用完 ${GUEST_FREE_LIMIT} 次，登录即可获得更多额度`,
            code: 'GUEST_LIMIT_REACHED',
          },
          { status: 401 }
        );
      }

      // 处理图片
      const result = await processImage(request);
      if (!result.ok) return result.response;

      // 记录 cookie 计数
      const response = new NextResponse(result.buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="result.png"',
          'Cache-Control': 'no-store',
        },
      });
      response.cookies.set(GUEST_COOKIE, String(guestUses + 1), {
        maxAge: 60 * 60 * 24 * 30, // 30 天
        httpOnly: true,
        sameSite: 'lax',
      });
      return response;
    }

    // ── 已登录用户：检查 D1 额度 ──
    const userId = session.user.id;

    let db: D1Database | undefined;
    try {
      const { getRequestContext } = require('@cloudflare/next-on-pages');
      db = getRequestContext().env.DB;
    } catch {
      // local dev
    }

    if (db) {
      const user = await db
        .prepare('SELECT credits, plan FROM users WHERE id = ?')
        .bind(userId)
        .first<{ credits: number; plan: string }>();

      if (!user) {
        return NextResponse.json({ error: '用户不存在', code: 'USER_NOT_FOUND' }, { status: 404 });
      }

      if ((user.credits ?? 0) <= 0) {
        return NextResponse.json(
          {
            error: '额度已用完，升级套餐继续使用',
            code: 'INSUFFICIENT_CREDITS',
            credits: 0,
            plan: user.plan,
          },
          { status: 402 }
        );
      }

      // 先扣额度
      const deductResult = await db
        .prepare('UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0')
        .bind(userId)
        .run();

      if (!deductResult.success || deductResult.meta.changes === 0) {
        return NextResponse.json(
          { error: '额度已用完，升级套餐继续使用', code: 'INSUFFICIENT_CREDITS' },
          { status: 402 }
        );
      }
    }

    // 处理图片
    const result = await processImage(request);
    if (!result.ok) {
      // 退回额度
      if (db) {
        await db.prepare('UPDATE users SET credits = credits + 1 WHERE id = ?').bind(userId).run();
      }
      return result.response;
    }

    // 记录使用日志
    if (db) {
      const logId = crypto.randomUUID();
      await db
        .prepare('INSERT INTO usage_logs (id, user_id, status, created_at) VALUES (?, ?, ?, unixepoch())')
        .bind(logId, userId, 'success')
        .run();
    }

    return new NextResponse(result.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="result.png"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── 共用图片处理逻辑 ──
async function processImage(
  request: NextRequest
): Promise<{ ok: true; buffer: ArrayBuffer } | { ok: false; response: NextResponse }> {
  const formData = await request.formData();
  const imageFile = formData.get('image') as File | null;

  if (!imageFile) {
    return {
      ok: false,
      response: NextResponse.json({ error: '请上传图片', code: 'NO_IMAGE' }, { status: 400 }),
    };
  }

  if (imageFile.size > 12 * 1024 * 1024) {
    return {
      ok: false,
      response: NextResponse.json({ error: '图片超过 12MB，请压缩后重试' }, { status: 413 }),
    };
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json({ error: '服务配置错误' }, { status: 500 }),
    };
  }

  const bgForm = new FormData();
  bgForm.append('image_file', imageFile);
  bgForm.append('size', 'auto');

  const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
    method: 'POST',
    headers: { 'X-Api-Key': apiKey },
    body: bgForm,
  });

  if (!resp.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: '处理失败，请稍后重试' }, { status: 500 }),
    };
  }

  const buffer = await resp.arrayBuffer();
  return { ok: true, buffer };
}

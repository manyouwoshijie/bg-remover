import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') ?? 'unknown';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;
  const callbackUrl = `${origin}/api/auth/callback/google`;

  return NextResponse.json({
    callbackUrl,
    host,
    proto,
    AUTH_URL: process.env.AUTH_URL ?? 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'NOT SET',
    AUTH_SECRET: process.env.AUTH_SECRET ? `SET (${process.env.AUTH_SECRET.length} chars)` : 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? `SET (${process.env.NEXTAUTH_SECRET.length} chars)` : 'NOT SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? `SET (${process.env.GOOGLE_CLIENT_ID.length} chars)` : 'NOT SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? `SET (${process.env.GOOGLE_CLIENT_SECRET.length} chars)` : 'NOT SET',
  });
}

import { NextRequest, NextResponse } from 'next/server';

// 边缘计算运行时，适配 Cloudflare Pages
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (imageFile.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 12MB)' }, { status: 413 });
    }

    const bgForm = new FormData();
    bgForm.append('image_file', imageFile);
    bgForm.append('size', 'auto');

    const apiKey = process.env.REMOVE_BG_API_KEY || "ieZg6Sit1Y8U1pMfQDJWh7yG";
    if (!apiKey) {
      console.error('REMOVE_BG_API_KEY is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const resp = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: bgForm,
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Remove.bg error:', resp.status, errorText);
      return NextResponse.json({ error: 'Processing failed, please try again later' }, { status: 500 });
    }

    const buffer = await resp.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="result.png"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('API Route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
